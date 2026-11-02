"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { OrderStatus } from "@/lib/admin-data";
import { commaInput, toCsv, won, type StockStatus } from "@/lib/admin-logic";
import { useAdmin } from "@/lib/admin-store";
import { panelVariants } from "@/lib/motion";

export const INPUT =
  "surface h-10 w-full min-w-0 rounded-2xl bg-transparent px-3 text-[14px] outline-none placeholder:text-white/90 focus:shadow-[inset_0_0_0_1px_rgb(106_166_255/0.7)]";
export const PRIMARY =
  "flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-[13.5px] font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
export const GLASS_BUTTON =
  "glass flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50";

/** 금액: 직원 권한이면 숨깁니다 (화면에서만, 실제 서비스는 서버에서 막아야 함) */
export function Money({ value }: { value: number }) {
  const { isAdmin } = useAdmin();
  return <span className="tabular-nums">{isAdmin ? won(value) : "비공개"}</span>;
}

const TONE = {
  good: "bg-good/15 text-[#8af0bb]",
  warn: "bg-warn/15 text-[#ffd58a]",
  bad: "bg-bad/15 text-[#ffb3bc]",
  info: "bg-accent-hi/15 text-[#b5d2ff]",
  mute: "bg-white/10 text-white/90",
};

function Pill({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[14px] font-medium whitespace-nowrap ${TONE[tone]}`}>{children}</span>;
}

const STOCK_TONE = { 정상: "good", 부족: "warn", 품절: "bad" } as const;
export const StockPill = ({ status }: { status: StockStatus }) => <Pill tone={STOCK_TONE[status]}>{status}</Pill>;

const ORDER_TONE = { 접수: "info", 출고대기: "warn", 출고완료: "good", 취소: "mute" } as const;
export const OrderPill = ({ status }: { status: OrderStatus }) => <Pill tone={ORDER_TONE[status]}>{status}</Pill>;

/** 관리자 전용 버튼: 직원이면 비활성 + "관리자만 가능" 툴팁 */
export function AdminButton({ children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isAdmin } = useAdmin();
  if (isAdmin) {
    return (
      <button type="button" className={className} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <span className="group relative inline-flex" tabIndex={0} title="관리자만 가능">
      <button type="button" disabled className={className}>
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-20 mt-1.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100"
      >
        관리자만 가능
      </span>
    </span>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <motion.div variants={panelVariants} className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">{title}</h1>
        <p className="mt-1 text-sm text-white/90">{sub}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </motion.div>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="surface flex h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 focus-within:shadow-[inset_0_0_0_1px_rgb(106_166_255/0.7)] md:max-w-xs">
      <Search size={16} className="shrink-0 text-white/90" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-white/90" />
    </label>
  );
}

export type Sort<K extends string> = { key: K; desc: boolean };

/** 표 머리글: 누르면 정렬. 금액처럼 직원에게 숨기는 칸은 disabled로 둡니다. */
export function SortHeader<K extends string>({
  label,
  name,
  sort,
  onSort,
  right,
  disabled,
}: {
  label: string;
  name: K;
  sort: Sort<K>;
  onSort: (key: K) => void;
  right?: boolean;
  disabled?: boolean;
}) {
  const on = sort.key === name;
  const Icon = sort.desc ? ArrowDown : ArrowUp;
  return (
    <th scope="col" aria-sort={on ? (sort.desc ? "descending" : "ascending") : "none"} className="px-3 py-2.5 font-semibold">
      <button type="button" onClick={() => onSort(name)} disabled={disabled} className={`inline-flex items-center gap-1 ${right ? "w-full justify-end" : ""} enabled:hover:text-white`}>
        {label}
        {on && <Icon size={14} aria-hidden="true" />}
      </button>
    </th>
  );
}

export function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  return (
    <nav aria-label="페이지" className="mt-3 flex items-center justify-between gap-3 px-1 text-[14px]">
      <span className="tabular-nums">총 {total.toLocaleString("ko-KR")}건</span>
      <span className="flex items-center gap-1">
        <button type="button" aria-label="이전 페이지" disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid size-9 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40">
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span className="min-w-14 text-center tabular-nums">
          {page} / {pages}
        </span>
        <button type="button" aria-label="다음 페이지" disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid size-9 place-items-center rounded-full hover:bg-white/10 disabled:opacity-40">
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </span>
    </nav>
  );
}

/** 입력칸 + 라벨 + 빨간 안내. 손대기 전에는 안내를 숨겨서 폼을 열자마자 빨갛지 않게 합니다. */
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const [touched, setTouched] = useState(false);
  return (
    <div className="min-w-0" onBlur={() => setTouched(true)} onChange={() => setTouched(true)}>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
        {children}
      </label>
      {touched && error && <p className="mt-1 text-[13px] text-bad">{error}</p>}
    </div>
  );
}

export function NumberInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return <input inputMode="numeric" aria-label={label} value={value} onChange={(e) => onChange(commaInput(e.target.value))} className={`${INPUT} text-right tabular-nums`} />;
}

/** 한글 조합 중 Enter는 무시: 안 그러면 조합 중인 글자로 폼이 제출됩니다 */
export function ignoreComposingEnter(e: KeyboardEvent) {
  if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
}

/** 오른쪽 상세 패널: 넓은 화면은 표 옆 칸, 좁은 화면은 위에 덮어서 */
export function DetailPanel({ label, title, onClose, children }: { label: string; title: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <motion.aside
      aria-label={label}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className="glass glass-strong thin-scroll fixed inset-y-4 right-4 z-40 w-[min(400px,calc(100vw-32px))] overflow-y-auto rounded-[28px] p-5 xl:sticky xl:inset-auto xl:top-2 xl:z-auto xl:max-h-[calc(100dvh-112px)] xl:w-auto xl:self-start"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-[17px] font-semibold break-words">{title}</h2>
        <button type="button" onClick={onClose} aria-label={`${label} 닫기`} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/10">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {children}
    </motion.aside>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="glass glass-strong thin-scroll relative max-h-[calc(100dvh-32px)] w-[min(560px,100%)] overflow-y-auto rounded-[28px] p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="grid size-8 place-items-center rounded-full hover:bg-white/10">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useAdmin();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.p
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`glass glass-strong max-w-[min(420px,100%)] rounded-2xl px-4 py-2.5 text-[14px] font-medium ${t.error ? "text-[#ffb3bc]" : ""}`}
          >
            {t.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
