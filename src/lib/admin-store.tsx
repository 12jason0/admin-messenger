"use client";

import { createContext, useContext, useRef, useState } from "react";
import { DEMO_NOW, ITEMS, ORDERS, STOCK_LOGS, TODAY, type Item, type Order, type OrderLine, type OrderStatus, type StockLog, type StockReason } from "./admin-data";
import { crossedBelow, shortages, stockAfter } from "./admin-logic";
import { BOT, ME, STOCK_CHANNEL, lowStockText } from "./data";

export type Role = "admin" | "staff";
export type Toast = { id: number; text: string; error?: boolean };
export type OrderDraft = { customer: string; lines: { sku: string; qty: number }[] };

/** 팀 소식 한 줄. 처음 데이터는 ago(고정 문구), 실제로 일어난 일은 stamp(시각)를 씁니다. */
export type Activity = { id: string; actorId: string; text: string; ago?: string; stamp?: number; orderId?: string; sku?: string; channelId?: string };

/** 대시보드 카드에서 필터를 켜고 들어갈 때 주문번호·SKU 대신 넘기는 값 */
export const WAITING_FILTER = "filter:waiting";
export const LOW_FILTER = "filter:low";

const orderVerb = (o: Pick<Order, "id" | "status">) => `주문 ${o.id} ${o.status === "접수" ? "등록" : o.status}`;

const minutesOf = (at: string) => {
  const [h, m] = at.slice(-5).split(":").map(Number);
  return h * 60 + m;
};

// 처음 화면을 채우는 활동. 실제 주문 데이터에서 만들어서, 눌렀을 때 그 주문으로 찾아갈 수 있습니다.
// 주문 활동은 "주문 몇 분 뒤"로 적어서 주문 시각보다 앞설 수 없습니다. 목록은 최신순입니다.
const SEED_ACTIVITIES: Activity[] = (() => {
  const today = ORDERS.filter((o) => o.at.startsWith(TODAY)).reverse();
  const entry = (i: number, after: number): Activity => ({
    id: `seed-o${i}`,
    actorId: today[i].assigneeId,
    text: orderVerb(today[i]),
    ago: `${minutesOf(DEMO_NOW) - minutesOf(today[i].at) - after}분 전`,
    orderId: today[i].id,
  });
  const bot = (sku: string, name: string, stock: number, safety: number): Activity => ({
    id: `seed-${sku}`,
    actorId: BOT,
    text: lowStockText(name, sku, stock, safety),
    ago: "1시간 전",
    channelId: STOCK_CHANNEL,
  });
  return [
    entry(0, 3),
    { id: "seed-a1", actorId: "doyun", text: "랜 케이블 CAT6 5m 재고 조정 · 입고 30개", ago: "12분 전", sku: "SKU-1036" },
    entry(1, 6),
    entry(2, 5),
    entry(3, 2),
    bot("SKU-1035", "USB-C 충전 케이블 1m", 3, 30),
    bot("SKU-1031", "복합기 토너 검정", 6, 12),
  ];
})();

type StockChange = { sku: string; after: number; reason: StockReason; memo: string };

/** 기준 날짜는 고정이고, 시각만 지금 시계를 씁니다. 버튼을 누를 때만 불러서 하이드레이션과 무관합니다. */
function clock() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${TODAY}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 재고·주문·권한 상태. 모든 화면이 같은 값을 읽어서 바꾸면 바로 반영됩니다.
 *
 * 주의: 권한은 데모라서 화면에서만 막습니다.
 * 실제 서비스라면 모든 조회·변경 API에서 서버가 권한을 다시 검사해야 합니다.
 * (화면에서 숨긴 금액도 응답에 들어 있으면 누구나 볼 수 있습니다.)
 */
export function useAdminState(onLowStock: (items: Item[]) => void) {
  const [items, setItems] = useState(ITEMS);
  const [orders, setOrders] = useState(ORDERS);
  const [logs, setLogs] = useState(STOCK_LOGS);
  const [activities, setActivities] = useState(SEED_ACTIVITIES);
  const [role, setRole] = useState<Role>("admin");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const isAdmin = role === "admin";

  function toast(text: string, error = false) {
    const id = ++seq.current;
    setToasts((list) => [...list, { id, text, error }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }

  // 최신이 맨 앞. 팀 소식 위젯은 앞에서부터 잘라 보여 줍니다.
  function record(entries: Omit<Activity, "id" | "stamp">[]) {
    const stamp = Date.now();
    setActivities((list) => [...entries.map((e) => ({ ...e, id: `act-${++seq.current}`, stamp })), ...list]);
  }

  // 재고가 바뀌는 길은 여기 하나뿐이라, 조정이든 출고든 알림과 기록이 똑같이 남습니다.
  function applyStock(changes: StockChange[]) {
    const at = clock();
    const newLogs: StockLog[] = [];
    const low: Item[] = [];
    const next = items.map((item) => {
      const change = changes.find((c) => c.sku === item.sku);
      if (!change) return item;
      const updated = { ...item, stock: change.after, lastInbound: change.reason === "입고" ? TODAY : item.lastInbound };
      newLogs.push({ id: `log-${++seq.current}`, sku: item.sku, at, by: ME, reason: change.reason, before: item.stock, after: change.after, memo: change.memo });
      if (crossedBelow(item.stock, change.after, item.safety)) low.push(updated);
      return updated;
    });
    setItems(next);
    setLogs((list) => [...newLogs, ...list]);
    if (low.length) {
      onLowStock(low);
      record(low.map((i) => ({ actorId: BOT, text: lowStockText(i.name, i.sku, i.stock, i.safety), channelId: STOCK_CHANNEL })));
    }
  }

  function adjustStock(sku: string, reason: StockReason, qty: number, memo: string) {
    const item = items.find((i) => i.sku === sku);
    if (!isAdmin || !item) return false;
    const after = stockAfter(item.stock, reason, qty);
    if (after === null) return false;
    record([{ actorId: ME, text: `${item.name} 재고 조정 · ${reason} ${item.stock} → ${after}`, sku }]);
    applyStock([{ sku, after, reason, memo }]);
    toast(`${item.name} 재고를 ${item.stock}개에서 ${after}개로 바꿨어요`);
    return true;
  }

  function changeOrderStatus(id: string, status: OrderStatus) {
    const order = orders.find((o) => o.id === id);
    if (!order || order.status === status) return;
    // 출고완료·취소는 끝난 상태입니다. 되돌리면 재고 복구 규칙이 따로 필요해서 데모에서는 막습니다.
    if (order.status === "출고완료" || order.status === "취소") return;

    if (status === "출고완료") {
      const short = shortages(order.lines, items);
      if (short.length) {
        toast(`재고가 모자라 출고할 수 없어요: ${short.map((i) => `${i.name} ${i.stock}개`).join(", ")}`, true);
        return;
      }
      applyStock(
        order.lines.map((l) => ({
          sku: l.sku,
          after: items.find((i) => i.sku === l.sku)!.stock - l.qty,
          reason: "출고" as const,
          memo: order.id,
        })),
      );
    }
    record([{ actorId: ME, text: orderVerb({ id, status }), orderId: id }]);
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    toast(`${id} 상태를 ${status}(으)로 바꿨어요`);
  }

  function saveOrderMemo(id: string, memo: string) {
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, memo } : o)));
    toast("메모를 저장했어요");
  }

  function createOrder(draft: OrderDraft) {
    const merged = new Map<string, number>();
    for (const l of draft.lines) merged.set(l.sku, (merged.get(l.sku) ?? 0) + l.qty);
    const lines: OrderLine[] = [...merged].map(([sku, qty]) => {
      const item = items.find((i) => i.sku === sku)!;
      return { sku, name: item.name, qty, price: item.price };
    });
    if (!lines.length || shortages(lines, items).length) return false;

    const stamp = TODAY.slice(2).replaceAll("-", "");
    const count = orders.filter((o) => o.at.startsWith(TODAY)).length + 1;
    const order: Order = {
      id: `ORD-${stamp}-${String(count).padStart(2, "0")}`,
      at: clock(),
      customer: draft.customer,
      lines,
      amount: lines.reduce((sum, l) => sum + l.qty * l.price, 0),
      status: "접수",
      assigneeId: ME,
      memo: "",
    };
    record([{ actorId: ME, text: orderVerb(order), orderId: order.id }]);
    setOrders((list) => [...list, order]);
    toast(`주문 ${order.id}을 등록했어요`);
    return true;
  }

  return { items, orders, logs, activities, role, setRole, isAdmin, toasts, toast, adjustStock, changeOrderStatus, saveOrderMemo, createOrder };
}

type AdminValue = ReturnType<typeof useAdminState> & {
  openItem: (sku: string) => void;
  openOrder: (id: string) => void;
  openChannel: (id: string) => void;
};

export const AdminContext = createContext<AdminValue | null>(null);

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("AdminContext 안에서만 쓸 수 있어요");
  return value;
}
