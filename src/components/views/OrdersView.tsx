"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Plus, Trash2 } from "lucide-react";
import { CUSTOMERS, ORDER_STATUSES, TODAY, TODAY_COMPACT, addDays, type Order, type OrderStatus } from "@/lib/admin-data";
import { comma, fullAt, orderSummary, pageCount, parseWhole, shortAt, shortages } from "@/lib/admin-logic";
import { WAITING_FILTER, useAdmin } from "@/lib/admin-store";
import type { Person } from "@/lib/data";
import { panelVariants, viewVariants } from "@/lib/motion";
import { AdminButton, DetailPanel, Field, GLASS_BUTTON, INPUT, Modal, Money, NumberInput, OrderPill, PRIMARY, PageHeader, Pagination, SearchBox, SortHeader, downloadCsv, ignoreComposingEnter, type Sort } from "../ui/admin";
import { Segmented } from "../ui/Segmented";

const PAGE_SIZE = 20;
type Period = "today" | "7d" | "30d" | "all";
const PERIOD_DAYS: Record<Exclude<Period, "all">, number> = { today: 0, "7d": 6, "30d": 29 };
type SortKey = "at" | "amount";

export default function OrdersView({ people, focusId }: { people: Record<string, Person>; focusId: string | null }) {
  const { orders, isAdmin, toast } = useAdmin();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">(focusId === WAITING_FILTER ? "출고대기" : "all");
  const [period, setPeriod] = useState<Period>("all");
  const [sort, setSort] = useState<Sort<SortKey>>({ key: "at", desc: true });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(focusId);
  const [creating, setCreating] = useState(false);

  // 직원은 금액을 볼 수 없으므로 금액순 정렬도 일시순으로 되돌립니다.
  const activeSort: Sort<SortKey> = !isAdmin && sort.key === "amount" ? { key: "at", desc: true } : sort;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = period === "all" ? "" : addDays(TODAY, -PERIOD_DAYS[period]);
    const found = orders.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        o.at.slice(0, 10) >= from &&
        (!q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)),
    );
    const sign = activeSort.desc ? -1 : 1;
    return found.sort((a, b) => sign * (activeSort.key === "at" ? a.at.localeCompare(b.at) : a.amount - b.amount) || b.id.localeCompare(a.id));
  }, [orders, query, status, period, activeSort.key, activeSort.desc]);

  const pages = pageCount(list.length, PAGE_SIZE);
  const current = Math.min(page, pages);
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = orders.find((o) => o.id === selectedId);

  const filtered = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };
  const toggleSort = (key: SortKey) => {
    setSort((s) => ({ key, desc: s.key === key ? !s.desc : true }));
    setPage(1);
  };

  function exportCsv() {
    downloadCsv(`주문목록_${TODAY_COMPACT}.csv`, [
      ["주문번호", "일시", "거래처", "품목", "금액", "상태", "담당자", "메모"],
      ...list.map((o) => [
        o.id,
        fullAt(o.at),
        o.customer,
        o.lines.map((l) => `${l.name} x${l.qty}`).join(" / "),
        o.amount,
        o.status,
        people[o.assigneeId]?.name ?? "",
        o.memo,
      ]),
    ]);
    toast(`주문 ${comma(list.length)}건을 내려받았어요`);
  }

  return (
    <motion.section variants={viewVariants} initial="hidden" animate="show" exit="exit" className="mx-auto max-w-[1480px]">
      <PageHeader title="주문" sub={`전체 ${comma(orders.length)}건 · 최근 90일`}>
        <AdminButton onClick={exportCsv} className={GLASS_BUTTON}>
          <Download size={16} aria-hidden="true" />
          엑셀 다운로드
        </AdminButton>
        <button type="button" onClick={() => setCreating(true)} className={PRIMARY}>
          <Plus size={16} aria-hidden="true" />
          주문 등록
        </button>
      </PageHeader>

      <div className={`grid grid-cols-[minmax(0,1fr)] items-start gap-4 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
        <motion.div variants={panelVariants} className="glass glass-strong min-w-0 rounded-[28px] p-3 md:p-4">
          <div className="mb-3 flex flex-col gap-2.5">
            <SearchBox label="주문 검색" placeholder="주문번호·거래처 검색" value={query} onChange={filtered(setQuery)} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Segmented
                label="상태 필터"
                variant="surface"
                value={status}
                onChange={filtered(setStatus)}
                options={[{ value: "all" as const, label: "전체" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))]}
              />
              <Segmented
                label="기간 필터"
                variant="surface"
                value={period}
                onChange={filtered(setPeriod)}
                options={[
                  { value: "today", label: "오늘" },
                  { value: "7d", label: "7일" },
                  { value: "30d", label: "30일" },
                  { value: "all", label: "전체" },
                ]}
              />
              <select
                aria-label="정렬"
                value={`${activeSort.key}-${activeSort.desc ? "desc" : "asc"}`}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split("-");
                  setSort({ key: key as SortKey, desc: dir === "desc" });
                  setPage(1);
                }}
                className={`${INPUT} w-auto lg:hidden`}
              >
                <option value="at-desc">최신순</option>
                <option value="at-asc">오래된순</option>
                {isAdmin && <option value="amount-desc">금액 높은순</option>}
                {isAdmin && <option value="amount-asc">금액 낮은순</option>}
              </select>
            </div>
          </div>

          <table className="hidden w-full table-fixed text-[14px] lg:table">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col />
              <col className="w-[15%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead className="border-b border-white/10 text-left">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">주문번호</th>
                <SortHeader label="일시" name="at" sort={activeSort} onSort={toggleSort} />
                <th scope="col" className="px-3 py-2.5 font-semibold">거래처</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">품목</th>
                <SortHeader label="금액" name="amount" sort={activeSort} onSort={toggleSort} right disabled={!isAdmin} />
                <th scope="col" className="px-3 py-2.5 font-semibold">상태</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">담당자</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className={`cursor-pointer border-b border-white/6 transition-colors ${o.id === selectedId ? "bg-white/12" : "hover:bg-white/7"}`}
                >
                  <td className="truncate px-3 py-2.5 tabular-nums">
                    <button type="button" className="font-medium hover:underline">
                      {o.id}
                    </button>
                  </td>
                  <td className="truncate px-3 py-2.5 tabular-nums">{shortAt(o.at)}</td>
                  <td className="truncate px-3 py-2.5">{o.customer}</td>
                  <td className="truncate px-3 py-2.5">{orderSummary(o.lines)}</td>
                  <td className="truncate px-3 py-2.5 text-right">
                    <Money value={o.amount} />
                  </td>
                  <td className="px-3 py-2.5">
                    <OrderPill status={o.status} />
                  </td>
                  <td className="truncate px-3 py-2.5">{people[o.assigneeId]?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="flex flex-col gap-2 lg:hidden">
            {rows.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => setSelectedId(o.id)} className="surface flex w-full flex-col gap-1 rounded-2xl p-3 text-left text-[14px]">
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium tabular-nums">{o.id}</span>
                    <OrderPill status={o.status} />
                  </span>
                  <span className="truncate">{o.customer} · {orderSummary(o.lines)}</span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="tabular-nums">{shortAt(o.at)} · {people[o.assigneeId]?.name}</span>
                    <span className="font-semibold">
                      <Money value={o.amount} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {rows.length === 0 && <p className="py-10 text-center text-[14px]">조건에 맞는 주문이 없어요.</p>}
          <Pagination page={current} pages={pages} total={list.length} onPage={setPage} />
        </motion.div>

        <AnimatePresence>
          {selected && <OrderDetail key={selected.id} order={selected} assignee={people[selected.assigneeId]} onClose={() => setSelectedId(null)} />}
        </AnimatePresence>
      </div>

      {creating && <OrderForm onClose={() => setCreating(false)} />}
    </motion.section>
  );
}

function OrderDetail({ order, assignee, onClose }: { order: Order; assignee?: Person; onClose: () => void }) {
  const { changeOrderStatus, saveOrderMemo } = useAdmin();
  const [memo, setMemo] = useState(order.memo);
  const finished = order.status === "출고완료" || order.status === "취소";

  return (
    <DetailPanel label="주문 상세" title={order.id} onClose={onClose}>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[14px]">
        <dt>일시</dt>
        <dd className="text-right tabular-nums">{fullAt(order.at)}</dd>
        <dt>거래처</dt>
        <dd className="text-right">{order.customer}</dd>
        <dt>담당자</dt>
        <dd className="text-right">{assignee?.name}</dd>
      </dl>

      <h3 className="mt-5 mb-2 text-[14px] font-semibold">품목</h3>
      <ul className="flex flex-col gap-1.5">
        {order.lines.map((l) => (
          <li key={l.sku} className="surface flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-[14px]">
            <span className="min-w-0">
              <span className="block truncate font-medium">{l.name}</span>
              <span className="block tabular-nums">
                <Money value={l.price} /> × {comma(l.qty)}개
              </span>
            </span>
            <Money value={l.price * l.qty} />
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between px-1 text-[15px] font-semibold">
        합계
        <Money value={order.amount} />
      </p>

      <h3 className="mt-5 mb-2 text-[14px] font-semibold">상태 변경</h3>
      <Segmented
        label="주문 상태"
        variant="surface"
        value={order.status}
        disabled={finished}
        onChange={(s) => changeOrderStatus(order.id, s)}
        options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
      />
      <p className="mt-1.5 text-[13px]">{finished ? "끝난 주문은 상태를 바꿀 수 없어요." : "출고완료로 바꾸면 재고가 차감돼요."}</p>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-[14px] font-semibold">메모</span>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onKeyDown={(e) => {
            // 한글 조합 중 Enter는 무시
            if (e.key === "Enter" && !e.nativeEvent.isComposing) saveOrderMemo(order.id, memo.trim());
          }}
          placeholder="Enter로 저장"
          className={INPUT}
        />
      </label>
      <button type="button" disabled={memo.trim() === order.memo} onClick={() => saveOrderMemo(order.id, memo.trim())} className={`${PRIMARY} mt-2 w-full`}>
        메모 저장
      </button>
    </DetailPanel>
  );
}

type DraftLine = { key: number; sku: string; qty: string };

function OrderForm({ onClose }: { onClose: () => void }) {
  const { items, createOrder } = useAdmin();
  const [customer, setCustomer] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ key: 0, sku: "", qty: "1" }]);
  const [nextKey, setNextKey] = useState(1);

  const parsed = lines.flatMap((l) => {
    const qty = parseWhole(l.qty);
    return l.sku && qty ? [{ sku: l.sku, qty }] : [];
  });
  const short = shortages(parsed, items);
  const amount = parsed.reduce((sum, l) => sum + l.qty * (items.find((i) => i.sku === l.sku)?.price ?? 0), 0);
  const complete = parsed.length === lines.length;
  const valid = customer !== "" && complete && short.length === 0;

  const patch = (key: number, change: Partial<DraftLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...change } : l)));

  function qtyError(line: DraftLine) {
    const qty = parseWhole(line.qty);
    if (!qty) return "1 이상의 정수를 입력해 주세요";
    const over = short.find((i) => i.sku === line.sku);
    return over ? `재고보다 많아요 (현재 ${comma(over.stock)}개)` : undefined;
  }

  return (
    <Modal title="주문 등록" onClose={onClose}>
      <form
        onKeyDown={ignoreComposingEnter}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && createOrder({ customer, lines: parsed })) onClose();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="거래처 (필수)" error={customer ? undefined : "거래처를 골라 주세요"}>
          <select autoFocus value={customer} onChange={(e) => setCustomer(e.target.value)} className={INPUT}>
            <option value="">거래처 선택</option>
            {CUSTOMERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col gap-3">
          {lines.map((line, i) => (
            <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_96px_36px] items-start gap-2">
              <Field label={`품목 ${i + 1} (필수)`} error={line.sku ? undefined : "품목을 골라 주세요"}>
                <select value={line.sku} onChange={(e) => patch(line.key, { sku: e.target.value })} className={INPUT}>
                  <option value="">품목 선택</option>
                  {items.map((item) => (
                    <option key={item.sku} value={item.sku} disabled={item.stock === 0}>
                      {item.name} (재고 {comma(item.stock)})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="수량" error={line.sku ? qtyError(line) : undefined}>
                <NumberInput value={line.qty} onChange={(qty) => patch(line.key, { qty })} />
              </Field>
              <button
                type="button"
                aria-label={`품목 ${i + 1} 삭제`}
                disabled={lines.length === 1}
                onClick={() => setLines((ls) => ls.filter((l) => l.key !== line.key))}
                className="mt-[26px] grid size-9 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setLines((ls) => [...ls, { key: nextKey, sku: "", qty: "1" }]);
              setNextKey((k) => k + 1);
            }}
            className="surface flex h-10 items-center justify-center gap-1.5 rounded-2xl text-[13.5px] font-medium hover:bg-white/15"
          >
            <Plus size={15} aria-hidden="true" />
            품목 추가
          </button>
        </div>

        <p className="flex items-center justify-between text-[15px] font-semibold">
          합계 금액
          <Money value={amount} />
        </p>
        <button type="submit" disabled={!valid} className={PRIMARY}>
          저장
        </button>
        {!valid && <p className="-mt-2 text-center text-[13px]">거래처와 품목, 수량을 모두 채우면 저장할 수 있어요.</p>}
      </form>
    </Modal>
  );
}

