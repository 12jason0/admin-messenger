// 주문·재고 규칙 (화면과 무관한 순수 함수). 검사: npm run check:admin
import type { Item, Order, OrderLine, StockReason } from "./admin-data";

export type StockStatus = "정상" | "부족" | "품절";

export function stockStatus(item: Pick<Item, "stock" | "safety">): StockStatus {
  if (item.stock === 0) return "품절";
  return item.stock < item.safety ? "부족" : "정상";
}

export const isLow = (item: Pick<Item, "stock" | "safety">) => item.stock < item.safety;

/** 안전재고 위(또는 같음)에서 아래로 내려가는 순간에만 true: 부족이 이어지는 동안은 다시 울리지 않습니다. */
export const crossedBelow = (before: number, after: number, safety: number) => before >= safety && after < safety;

/** 조정 후 재고. 실사조정의 수량은 "세어 본 실제 수량"입니다. 음수가 되면 null */
export function stockAfter(before: number, reason: StockReason, qty: number) {
  const after = reason === "입고" ? before + qty : reason === "실사조정" ? qty : before - qty;
  return after < 0 ? null : after;
}

/** 재고보다 많이 주문한 품목. 같은 품목이 여러 줄이면 합쳐서 봅니다. */
export function shortages(lines: Pick<OrderLine, "sku" | "qty">[], items: Item[]) {
  const wanted = new Map<string, number>();
  for (const l of lines) wanted.set(l.sku, (wanted.get(l.sku) ?? 0) + l.qty);
  return items.filter((item) => (wanted.get(item.sku) ?? 0) > item.stock);
}

/** 입력칸의 수량·금액: 쉼표는 허용, 음수·소수·문자는 null */
export function parseWhole(raw: string) {
  const text = raw.replaceAll(",", "").trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

/** 입력 중인 값을 천 단위 쉼표로. 숫자가 아니면 그대로 두어 오류 안내가 나오게 합니다. */
export function commaInput(raw: string) {
  const value = parseWhole(raw);
  return value === null ? raw : value.toLocaleString("ko-KR");
}

export const comma = (n: number) => n.toLocaleString("ko-KR");
export const won = (n: number) => `${comma(n)}원`;

export function orderSummary(lines: Pick<OrderLine, "name">[]) {
  return lines.length > 1 ? `${lines[0].name} 외 ${lines.length - 1}건` : (lines[0]?.name ?? "");
}

/** 2026-11-02T14:30 → 11-02 14:30 */
export const shortAt = (at: string) => `${at.slice(5, 10)} ${at.slice(11)}`;
/** 2026-11-02T14:30 → 2026-11-02 14:30 */
export const fullAt = (at: string) => at.replace("T", " ");

/** 취소 건을 뺀 매출 합계 */
export function revenue(orders: Order[], from: string, to: string) {
  return orders.reduce((sum, o) => {
    const day = o.at.slice(0, 10);
    return o.status !== "취소" && day >= from && day <= to ? sum + o.amount : sum;
  }, 0);
}

type Cell = string | number;

export function toCsv(rows: Cell[][]) {
  const cell = (value: Cell) => {
    if (typeof value === "number") return String(value);
    // 엑셀이 수식으로 실행하지 않도록 =, +, -, @ 로 시작하는 글자 앞에 작은따옴표를 붙입니다.
    const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
  };
  return `﻿${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}

export function pageCount(total: number, size: number) {
  return Math.max(1, Math.ceil(total / size));
}
