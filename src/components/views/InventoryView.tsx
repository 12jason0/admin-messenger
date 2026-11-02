"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, SlidersHorizontal } from "lucide-react";
import { CATEGORIES, STOCK_REASONS, TODAY_COMPACT, type Category, type Item, type StockReason } from "@/lib/admin-data";
import { comma, fullAt, isLow, pageCount, parseWhole, stockAfter, stockStatus } from "@/lib/admin-logic";
import { LOW_FILTER, useAdmin } from "@/lib/admin-store";
import type { Person } from "@/lib/data";
import { panelVariants, viewVariants } from "@/lib/motion";
import { AdminButton, DetailPanel, Field, GLASS_BUTTON, INPUT, Modal, Money, NumberInput, PRIMARY, PageHeader, Pagination, SearchBox, SortHeader, StockPill, downloadCsv, ignoreComposingEnter, type Sort } from "../ui/admin";
import { Segmented } from "../ui/Segmented";

const PAGE_SIZE = 20;
type SortKey = "sku" | "name" | "price" | "stock" | "safety" | "lastInbound";

export default function InventoryView({ people, focusSku }: { people: Record<string, Person>; focusSku: string | null }) {
  const { items, isAdmin, toast } = useAdmin();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [lowOnly, setLowOnly] = useState(focusSku === LOW_FILTER);
  const [sort, setSort] = useState<Sort<SortKey>>({ key: "sku", desc: false });
  // 다른 화면에서 찾아왔다면 그 행이 있는 페이지부터 보여 줍니다 (기본 정렬이 SKU순이라 위치 계산이 간단합니다).
  const [page, setPage] = useState(() => Math.floor(Math.max(0, items.findIndex((i) => i.sku === focusSku)) / PAGE_SIZE) + 1);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const focusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const activeSort: Sort<SortKey> = !isAdmin && sort.key === "price" ? { key: "sku", desc: false } : sort;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = items.filter(
      (i) => (category === "all" || i.category === category) && (!lowOnly || isLow(i)) && (!q || i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)),
    );
    const sign = activeSort.desc ? -1 : 1;
    return found.sort((a, b) => {
      const x = a[activeSort.key];
      const y = b[activeSort.key];
      return sign * (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ko"));
    });
  }, [items, query, category, lowOnly, activeSort.key, activeSort.desc]);

  const pages = pageCount(list.length, PAGE_SIZE);
  const current = Math.min(page, pages);
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = items.find((i) => i.sku === selectedSku);
  const adjustTarget = items.find((i) => i.sku === adjusting);

  const filtered = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };
  const toggleSort = (key: SortKey) => {
    setSort((s) => ({ key, desc: s.key === key ? !s.desc : false }));
    setPage(1);
  };

  function exportCsv() {
    downloadCsv(`재고목록_${TODAY_COMPACT}.csv`, [
      ["SKU", "품목명", "카테고리", "단가", "현재 재고", "안전재고", "상태", "최근 입고일"],
      ...list.map((i) => [i.sku, i.name, i.category, i.price, i.stock, i.safety, stockStatus(i), i.lastInbound]),
    ]);
    toast(`품목 ${comma(list.length)}개를 내려받았어요`);
  }

  const lowCount = items.filter(isLow).length;

  return (
    <motion.section variants={viewVariants} initial="hidden" animate="show" exit="exit" className="mx-auto max-w-[1480px]">
      <PageHeader title="재고" sub={`품목 ${items.length}개 · 부족 ${lowCount}개`}>
        <AdminButton onClick={exportCsv} className={GLASS_BUTTON}>
          <Download size={16} aria-hidden="true" />
          엑셀 다운로드
        </AdminButton>
      </PageHeader>

      <div className={`grid grid-cols-[minmax(0,1fr)] items-start gap-4 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
        <motion.div variants={panelVariants} className="glass glass-strong min-w-0 rounded-[28px] p-3 md:p-4">
          <div className="mb-3 flex flex-col gap-2.5">
            <SearchBox label="품목 검색" placeholder="SKU·품목명 검색" value={query} onChange={filtered(setQuery)} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Segmented
                label="카테고리 필터"
                variant="surface"
                value={category}
                onChange={filtered(setCategory)}
                options={[{ value: "all" as const, label: "전체" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
              />
              <button
                type="button"
                aria-pressed={lowOnly}
                onClick={() => filtered(setLowOnly)(!lowOnly)}
                className={`h-10 rounded-full px-4 text-[13.5px] font-medium transition ${lowOnly ? "bg-ink text-[#1b1a1f]" : "surface hover:bg-white/15"}`}
              >
                부족만 보기
              </button>
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
                <option value="sku-asc">SKU순</option>
                <option value="name-asc">품목명순</option>
                <option value="stock-asc">재고 적은순</option>
                <option value="stock-desc">재고 많은순</option>
                <option value="lastInbound-desc">최근 입고순</option>
                {isAdmin && <option value="price-desc">단가 높은순</option>}
              </select>
            </div>
          </div>

          <table className="hidden w-full table-fixed text-[14px] lg:table">
            <colgroup>
              <col className="w-[11%]" />
              <col />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead className="border-b border-white/10 text-left">
              <tr>
                <SortHeader label="SKU" name="sku" sort={activeSort} onSort={toggleSort} />
                <SortHeader label="품목명" name="name" sort={activeSort} onSort={toggleSort} />
                <th scope="col" className="px-3 py-2.5 font-semibold">분류</th>
                <SortHeader label="단가" name="price" sort={activeSort} onSort={toggleSort} right disabled={!isAdmin} />
                <SortHeader label="재고" name="stock" sort={activeSort} onSort={toggleSort} right />
                <SortHeader label="안전" name="safety" sort={activeSort} onSort={toggleSort} right />
                <th scope="col" className="px-3 py-2.5 font-semibold">상태</th>
                <SortHeader label="최근 입고일" name="lastInbound" sort={activeSort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.sku}
                  ref={item.sku === focusSku ? (el) => { focusRef.current = el; } : undefined}
                  onClick={() => setSelectedSku(item.sku)}
                  className={`cursor-pointer border-b border-white/6 transition-colors ${
                    item.sku === focusSku ? "row-focus" : item.sku === selectedSku ? "bg-white/12" : "hover:bg-white/7"
                  }`}
                >
                  <td className="truncate px-3 py-2.5 tabular-nums">
                    <button type="button" className="font-medium hover:underline">
                      {item.sku}
                    </button>
                  </td>
                  <td className="truncate px-3 py-2.5">{item.name}</td>
                  <td className="truncate px-3 py-2.5">{item.category}</td>
                  <td className="truncate px-3 py-2.5 text-right">
                    <Money value={item.price} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{comma(item.stock)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{comma(item.safety)}</td>
                  <td className="px-3 py-2.5">
                    <StockPill status={stockStatus(item)} />
                  </td>
                  <td className="truncate px-3 py-2.5 tabular-nums">{item.lastInbound}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="flex flex-col gap-2 lg:hidden">
            {rows.map((item) => (
              <li key={item.sku}>
                <button
                  type="button"
                  ref={item.sku === focusSku ? (el) => { if (el?.offsetParent) focusRef.current = el; } : undefined}
                  onClick={() => setSelectedSku(item.sku)}
                  className={`surface flex w-full flex-col gap-1 rounded-2xl p-3 text-left text-[14px] ${item.sku === focusSku ? "row-focus" : ""}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium">{item.name}</span>
                    <StockPill status={stockStatus(item)} />
                  </span>
                  <span className="tabular-nums">{item.sku} · {item.category}</span>
                  <span className="flex items-center justify-between gap-2 tabular-nums">
                    <span>재고 {comma(item.stock)} / 안전 {comma(item.safety)}</span>
                    <Money value={item.price} />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {rows.length === 0 && <p className="py-10 text-center text-[14px]">조건에 맞는 품목이 없어요.</p>}
          <Pagination page={current} pages={pages} total={list.length} onPage={setPage} />
        </motion.div>

        <AnimatePresence>
          {selected && <ItemDetail key={selected.sku} item={selected} people={people} onAdjust={() => setAdjusting(selected.sku)} onClose={() => setSelectedSku(null)} />}
        </AnimatePresence>
      </div>

      {adjustTarget && <AdjustForm item={adjustTarget} onClose={() => setAdjusting(null)} />}
    </motion.section>
  );
}

function ItemDetail({ item, people, onAdjust, onClose }: { item: Item; people: Record<string, Person>; onAdjust: () => void; onClose: () => void }) {
  const { logs } = useAdmin();
  const history = logs.filter((l) => l.sku === item.sku);

  return (
    <DetailPanel label="품목 상세" title={item.name} onClose={onClose}>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[14px]">
        <dt>SKU</dt>
        <dd className="text-right tabular-nums">{item.sku}</dd>
        <dt>카테고리</dt>
        <dd className="text-right">{item.category}</dd>
        <dt>단가</dt>
        <dd className="text-right">
          <Money value={item.price} />
        </dd>
        <dt>현재 재고</dt>
        <dd className="text-right font-semibold tabular-nums">{comma(item.stock)}개</dd>
        <dt>안전재고</dt>
        <dd className="text-right tabular-nums">{comma(item.safety)}개</dd>
        <dt>상태</dt>
        <dd className="text-right">
          <StockPill status={stockStatus(item)} />
        </dd>
        <dt>최근 입고일</dt>
        <dd className="text-right tabular-nums">{item.lastInbound}</dd>
      </dl>

      <div className="mt-4 flex justify-end">
        <AdminButton onClick={onAdjust} className={PRIMARY}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          재고 조정
        </AdminButton>
      </div>

      <h3 className="mt-5 mb-2 text-[14px] font-semibold">변경 기록</h3>
      <ol className="flex flex-col gap-1.5">
        {history.map((log) => (
          <li key={log.id} className="surface rounded-2xl px-3 py-2 text-[14px]">
            <p className="flex items-center justify-between gap-2 font-medium">
              <span>{log.reason}</span>
              <span className="tabular-nums">
                {comma(log.before)} → {comma(log.after)}
              </span>
            </p>
            <p className="tabular-nums">
              {people[log.by]?.name} · {fullAt(log.at)}
            </p>
            {log.memo && <p className="break-words">{log.memo}</p>}
          </li>
        ))}
      </ol>
    </DetailPanel>
  );
}

const QTY_LABEL: Record<StockReason, string> = { 입고: "입고 수량", 출고: "출고 수량", 파손: "파손 수량", 실사조정: "실제 세어 본 수량" };

function AdjustForm({ item, onClose }: { item: Item; onClose: () => void }) {
  const { adjustStock } = useAdmin();
  const [reason, setReason] = useState<StockReason>("입고");
  const [qtyText, setQtyText] = useState("");
  const [memo, setMemo] = useState("");

  const qty = parseWhole(qtyText);
  const min = reason === "실사조정" ? 0 : 1;
  const after = qty === null ? null : stockAfter(item.stock, reason, qty);
  const error =
    qty === null || qty < min ? `${min} 이상의 정수를 입력해 주세요` : after === null ? `현재 재고(${comma(item.stock)}개)보다 많아요` : undefined;

  return (
    <Modal title={`재고 조정 · ${item.name}`} onClose={onClose}>
      <form
        onKeyDown={ignoreComposingEnter}
        onSubmit={(e) => {
          e.preventDefault();
          if (!error && qty !== null && adjustStock(item.sku, reason, qty, memo.trim())) onClose();
        }}
        className="flex flex-col gap-4"
      >
        <Segmented label="조정 사유" variant="surface" value={reason} onChange={setReason} options={STOCK_REASONS.map((r) => ({ value: r, label: r }))} />
        <Field label={`${QTY_LABEL[reason]} (필수)`} error={error}>
          <NumberInput value={qtyText} onChange={setQtyText} />
        </Field>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">메모</span>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} className={INPUT} />
        </label>
        <p className="flex justify-between text-[15px] font-semibold tabular-nums">
          <span>조정 후 재고</span>
          <span>
            {comma(item.stock)} → {!error && after !== null ? comma(after) : "-"}
          </span>
        </p>
        <button type="submit" disabled={!!error} className={PRIMARY}>
          저장
        </button>
      </form>
    </Modal>
  );
}
