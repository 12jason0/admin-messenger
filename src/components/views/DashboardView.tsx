"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowRight, CalendarDays, PackageX, TrendingUp, Truck, type LucideIcon } from "lucide-react";
import { CATEGORIES, ITEMS, TODAY, addDays, type Category } from "@/lib/admin-data";
import { comma, isLow, orderSummary, revenue, shortAt, stockStatus, won } from "@/lib/admin-logic";
import { LOW_FILTER, WAITING_FILTER, useAdmin, type Activity } from "@/lib/admin-store";
import { STOCK_CHANNEL, WORKSPACE, type Person } from "@/lib/data";
import { panelVariants, viewVariants } from "@/lib/motion";
import { Money, OrderPill, PageHeader, StockPill } from "../ui/admin";
import { Avatar } from "../ui/Avatar";
import { Segmented } from "../ui/Segmented";

const CATEGORY_COLOR: Record<Category, string> = { 전자기기: "#4c8ae6", 사무용품: "#d07a2c", 가구: "#1aa68f", 케이블: "#a06ee6" };
const CATEGORY_OF = new Map(ITEMS.map((i) => [i.sku, i.category]));
const FEED_SIZE = 6;

const manwon = (n: number) => `${comma(Math.round(n / 10000))}만원`;
/** 앞뒤 기간을 비교한 증감률 (앞 기간 매출이 없으면 null) */
const changeRate = (now: number, before: number) => (before ? ((now - before) / before) * 100 : null);

type Range = "7" | "30" | "90";

export default function DashboardView({ people }: { people: Record<string, Person> }) {
  const { orders, items, openOrder, openItem, openChannel } = useAdmin();
  const [range, setRange] = useState<Range>("30");

  const daily = useMemo(
    () => Array.from({ length: 90 }, (_, i) => addDays(TODAY, i - 89)).map((date) => ({ date, value: revenue(orders, date, date) })),
    [orders],
  );

  const stats = useMemo(() => {
    const sum = (ago: number, days: number) => revenue(orders, addDays(TODAY, -(ago + days - 1)), addDays(TODAY, -ago));
    const today = sum(0, 1);
    const month = sum(0, 30);
    return {
      today,
      todayChange: changeRate(today, sum(7, 1)),
      month,
      monthChange: changeRate(month, sum(30, 30)),
      todaySpark: daily.slice(-14).map((d) => d.value),
      // 날마다의 "그날까지 30일 합계"라서, 오늘 매출 추이선과 다른 흐름을 보여 줍니다.
      monthSpark: Array.from({ length: 14 }, (_, i) => sum(13 - i, 30)),
      waiting: orders.filter((o) => o.status === "출고대기").length,
      late: orders.filter((o) => o.status === "출고대기" && o.at.slice(0, 10) <= addDays(TODAY, -2)).length,
    };
  }, [orders, daily]);

  const byCategory = useMemo(() => {
    const from = addDays(TODAY, -29);
    const total = new Map<Category, number>(CATEGORIES.map((c) => [c, 0]));
    for (const o of orders) {
      if (o.status === "취소" || o.at.slice(0, 10) < from) continue;
      for (const l of o.lines) {
        const category = CATEGORY_OF.get(l.sku);
        if (category) total.set(category, (total.get(category) ?? 0) + l.qty * l.price);
      }
    }
    return CATEGORIES.map((category) => ({ category, value: total.get(category) ?? 0 }));
  }, [orders]);

  const top = useMemo(() => {
    const from = addDays(TODAY, -29);
    const sold = new Map<string, { sku: string; name: string; qty: number; amount: number }>();
    for (const o of orders) {
      if (o.status !== "출고완료" || o.at.slice(0, 10) < from) continue;
      for (const l of o.lines) {
        const row = sold.get(l.sku) ?? { sku: l.sku, name: l.name, qty: 0, amount: 0 };
        row.qty += l.qty;
        row.amount += l.qty * l.price;
        sold.set(l.sku, row);
      }
    }
    return [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const recent = useMemo(() => [...orders].sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id)).slice(0, 5), [orders]);
  const low = useMemo(() => items.filter(isLow).sort((a, b) => a.stock / a.safety - b.stock / b.safety), [items]);
  const soldOut = low.filter((i) => i.stock === 0).length;

  return (
    <motion.section variants={viewVariants} initial="hidden" animate="show" exit="exit" className="mx-auto flex max-w-[1480px] flex-col gap-4">
      <PageHeader title="대시보드" sub={`${WORKSPACE} · ${TODAY} 기준`} />

      <div className="-mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))] xl:gap-4">
        <Kpi icon={CalendarDays} label="오늘 매출" onOpen={() => openOrder("")} spark={stats.todaySpark} change={stats.todayChange} changeLabel="지난주 같은 요일 대비">
          <Money value={stats.today} />
        </Kpi>
        <Kpi icon={TrendingUp} label="최근 30일 매출" onOpen={() => openOrder("")} spark={stats.monthSpark} change={stats.monthChange} changeLabel="직전 30일 대비">
          <Money value={stats.month} />
        </Kpi>
        <Kpi icon={Truck} label="출고 대기 주문" onOpen={() => openOrder(WAITING_FILTER)} detail={`그중 2일 이상 지연 ${stats.late}건`}>
          <span className="tabular-nums">{stats.waiting}건</span>
        </Kpi>
        <Kpi icon={PackageX} label="재고 부족 품목" onOpen={() => openItem(LOW_FILTER)} detail={`품절 ${soldOut} · 부족 ${low.length - soldOut}`}>
          <span className="tabular-nums">{low.length}개</span>
        </Kpi>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))] xl:h-[clamp(430px,calc(100dvh-390px),510px)] xl:grid-cols-[minmax(0,1fr)_300px_340px]">
        <motion.section variants={panelVariants} aria-label="매출 추이" className="glass flex min-h-0 flex-col rounded-[28px] p-5 md:col-span-2 xl:col-span-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold">매출 추이</h2>
            <Segmented
              label="기간"
              variant="surface"
              value={range}
              onChange={setRange}
              options={[
                { value: "7", label: "7일" },
                { value: "30", label: "30일" },
                { value: "90", label: "90일" },
              ]}
            />
          </div>
          <BarChart days={daily.slice(-Number(range))} />
        </motion.section>

        <motion.section variants={panelVariants} aria-label="카테고리별 매출" className="glass flex min-h-0 flex-col rounded-[28px] p-5">
          <h2 className="text-[15px] font-semibold">카테고리별 매출 · 30일</h2>
          <Donut data={byCategory} />
        </motion.section>

        <motion.section variants={panelVariants} aria-label="팀 소식" className="glass glass-strong flex min-h-0 flex-col rounded-[28px] p-3">
          <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-1.5">
            <h2 className="text-[15px] font-semibold">팀 소식</h2>
            <button type="button" onClick={() => openChannel(STOCK_CHANNEL)} className="surface flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium transition hover:bg-white/15">
              메신저에서 보기
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <TeamFeed people={people} />
        </motion.section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(3,minmax(0,1fr))]">
        <motion.section variants={panelVariants} aria-label="많이 팔린 품목" className="glass glass-strong rounded-[28px] p-5 lg:col-span-2 xl:col-span-1">
          <h2 className="mb-3 text-[15px] font-semibold">많이 팔린 품목 TOP 5 · 30일</h2>
          <ol className="flex flex-col gap-3">
            {top.map((row) => (
              <li key={row.sku} className="text-[14px]">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{row.name}</span>
                  <span className="shrink-0 tabular-nums">{comma(row.qty)}개</span>
                </p>
                <div className="my-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#4c8ae6]" style={{ width: `${(row.qty / top[0].qty) * 100}%` }} />
                </div>
                <p className="text-right">
                  <Money value={row.amount} />
                </p>
              </li>
            ))}
          </ol>
        </motion.section>

        <motion.section variants={panelVariants} aria-label="최근 주문" className="glass glass-strong rounded-[28px] p-3">
          <h2 className="px-2 pt-1 pb-2 text-[15px] font-semibold">최근 주문</h2>
          <ul>
            {recent.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => openOrder(o.id)} className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-[14px] transition hover:bg-white/8">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{o.customer}</span>
                    <span className="block truncate text-white/90">
                      {shortAt(o.at)} · {orderSummary(o.lines)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Money value={o.amount} />
                    <OrderPill status={o.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section variants={panelVariants} aria-label="재고 부족 품목" className="glass glass-strong rounded-[28px] p-3">
          <h2 className="px-2 pt-1 pb-2 text-[15px] font-semibold">재고 부족 품목</h2>
          {low.length === 0 && <p className="px-2.5 py-6 text-[14px]">부족한 품목이 없어요.</p>}
          <ul>
            {low.slice(0, 6).map((item) => (
              <li key={item.sku}>
                <button type="button" onClick={() => openItem(item.sku)} className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-[14px] transition hover:bg-white/8">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.name}</span>
                    <span className="block text-white/90">{item.sku}</span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    {item.stock} / {item.safety}
                  </span>
                  <StockPill status={stockStatus(item)} />
                </button>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </motion.section>
  );
}

type KpiProps = {
  icon: LucideIcon;
  label: string;
  onOpen: () => void;
  spark?: number[];
  change?: number | null;
  changeLabel?: string;
  detail?: string;
  children: ReactNode;
};

function Kpi({ icon: Icon, label, onOpen, spark, change, changeLabel, detail, children }: KpiProps) {
  const { isAdmin } = useAdmin();
  const up = (change ?? 0) >= 0;
  return (
    <motion.button
      type="button"
      variants={panelVariants}
      onClick={onOpen}
      className="glass flex min-w-0 flex-col rounded-[24px] p-4 text-left transition-colors hover:bg-white/10"
    >
      <span className="flex items-center gap-2 text-[13.5px] font-medium">
        <Icon size={16} className="shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span className="mt-1.5 flex items-end justify-between gap-3">
        <span className="min-w-0 text-[20px] font-semibold tracking-tight break-all md:text-[26px]">{children}</span>
        {spark && <Sparkline values={spark} />}
      </span>
      {detail && <span className="mt-1 text-[13px] tabular-nums">{detail}</span>}
      {changeLabel && (
        <span className={`mt-1 text-[13px] tabular-nums ${!isAdmin ? "" : up ? "text-[#8af0bb]" : "text-[#ffb3bc]"}`}>
          {!isAdmin || change === null || change === undefined ? `${changeLabel} 비공개` : `${changeLabel} ${up ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}%`}
        </span>
      )}
    </motion.button>
  );
}

/** 카드 안의 작은 추이선 (최근 14일) */
function Sparkline({ values }: { values: number[] }) {
  const [w, h, pad] = [84, 30, 3];
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((v, i) => [(i / (values.length - 1)) * (w - pad * 2) + pad, h - pad - ((v - min) / span) * (h - pad * 2)]);
  const [lastX, lastY] = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" className="hidden shrink-0 sm:block">
      <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgb(255 255 255 / 0.75)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="3" className="fill-accent-hi" />
    </svg>
  );
}

/** 요소의 실제 크기: 눈금 글자가 늘어나지 않도록 SVG를 화면 크기 그대로 그립니다. */
function useBoxSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 300 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/** 위 눈금이 깔끔한 만원 단위가 되도록 눈금 간격을 고릅니다 */
function tickStep(max: number) {
  const steps = [10, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750, 1000, 2000, 5000].map((man) => man * 10000);
  return steps.find((step) => step * 4 >= max) ?? max / 4;
}

function BarChart({ days }: { days: { date: string; value: number }[] }) {
  const { isAdmin } = useAdmin();
  const [ref, { width, height }] = useBoxSize();
  const [hover, setHover] = useState<number | null>(null);

  const margin = { left: isAdmin ? 58 : 8, right: 4, top: 10, bottom: 24 };
  const plotW = Math.max(1, width - margin.left - margin.right);
  const plotH = Math.max(1, height - margin.top - margin.bottom);
  const step = tickStep(Math.max(1, ...days.map((d) => d.value)));
  const ticks = [0, 1, 2, 3, 4].map((n) => n * step);
  const y = (value: number) => margin.top + plotH - (value / ticks[4]) * plotH;
  const slot = plotW / days.length;
  const bar = Math.min(28, Math.max(2, slot * 0.68));
  const active = hover === null ? null : days[hover];
  const axisY = height - margin.bottom;

  return (
    <div ref={ref} className="relative mt-2 h-[230px] flex-none md:h-[260px] xl:h-auto xl:min-h-0 xl:flex-1">
      <svg width={width} height={height} role="img" aria-label="일별 매출 막대 차트. 오늘 막대가 강조되어 있습니다." className="absolute inset-0" onPointerLeave={() => setHover(null)}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={y(tick) + 0.5} y2={y(tick) + 0.5} stroke={`rgb(255 255 255 / ${tick ? 0.1 : 0.3})`} />
            {isAdmin && (
              <text x={margin.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-white/90 text-[12px] tabular-nums">
                {tick ? manwon(tick) : "0"}
              </text>
            )}
          </g>
        ))}
        {days.map((d, i) => {
          const h = d.value ? Math.max(3, y(0) - y(d.value)) : 0;
          const x = margin.left + i * slot + (slot - bar) / 2;
          const top = axisY - h;
          const r = Math.min(4, h, bar / 2);
          const today = i === days.length - 1;
          return (
            <g key={d.date} onPointerEnter={() => setHover(i)}>
              {/* 막대보다 넓은 투명 영역: 낮은 막대도 쉽게 집히도록 */}
              <rect x={margin.left + i * slot} y={margin.top} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x} ${axisY}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + bar - r}Q${x + bar} ${top} ${x + bar} ${top + r}V${axisY}Z`}
                  className={today ? "fill-accent" : hover === i ? "fill-white/70" : "fill-white/40"}
                />
              )}
            </g>
          );
        })}
        <text x={margin.left} y={height - 6} className="fill-white/90 text-[12.5px] tabular-nums">{days[0].date.slice(5)}</text>
        <text x={margin.left + plotW / 2} y={height - 6} textAnchor="middle" className="fill-white/90 text-[12.5px] tabular-nums">{days[Math.floor(days.length / 2)].date.slice(5)}</text>
        <text x={width - margin.right} y={height - 6} textAnchor="end" className="fill-white/90 text-[12.5px]">오늘</text>
      </svg>
      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl bg-black/80 px-3 py-1.5 text-[13px] whitespace-nowrap text-white"
          style={{ left: Math.min(width - 62, Math.max(62, margin.left + (hover + 0.5) * slot)) }}
        >
          <span className="block">{active.date}</span>
          <span className="block font-semibold tabular-nums">{isAdmin ? won(active.value) : "금액 비공개"}</span>
        </div>
      )}
      {isAdmin && (
        <table className="sr-only">
          <caption>일별 매출</caption>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <th scope="row">{d.date}</th>
                <td>{won(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Donut({ data }: { data: { category: Category; value: number }[] }) {
  const { isAdmin } = useAdmin();
  const [hover, setHover] = useState<Category | null>(null);
  const sum = data.reduce((total, d) => total + d.value, 0);
  const total = sum || 1;
  const r = 52;
  const round = 2 * Math.PI * r;
  const active = data.find((d) => d.category === hover);
  const share = (v: number) => `${((v / total) * 100).toFixed(1)}%`;

  // 조각마다 시작 위치를 앞 조각들의 합으로 계산합니다.
  const slices = data.map((d, i) => ({ ...d, start: data.slice(0, i).reduce((acc, x) => acc + x.value, 0) }));

  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
      <div className="relative size-[156px] shrink-0">
        <svg viewBox="0 0 140 140" role="img" aria-label="카테고리별 매출 비중 도넛 차트" className="size-full -rotate-90" onPointerLeave={() => setHover(null)}>
          {slices.map((d) => {
            const length = (d.value / total) * round;
            return (
              <circle
                key={d.category}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={CATEGORY_COLOR[d.category]}
                strokeWidth={hover === d.category ? 20 : 17}
                strokeDasharray={`${Math.max(0, length - 2)} ${round}`}
                strokeDashoffset={-((d.start / total) * round)}
                onPointerEnter={() => setHover(d.category)}
                className="transition-[stroke-width]"
              />
            );
          })}
        </svg>
        <p className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="block text-[12.5px]">{active ? active.category : "합계"}</span>
          <span className="block text-[15px] font-semibold tabular-nums">{active ? share(active.value) : isAdmin ? manwon(sum) : "비공개"}</span>
        </p>
      </div>
      <ul className="w-full text-[14px]">
        {data.map((d) => (
          <li key={d.category} className="flex items-center gap-2 py-0.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[d.category] }} />
            <span className="flex-1">{d.category}</span>
            {isAdmin && <span className="tabular-nums">{manwon(d.value)}</span>}
            <span className="min-w-[50px] text-right tabular-nums">{share(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function agoLabel(activity: Activity, now: number) {
  if (activity.ago) return activity.ago;
  const minutes = Math.floor((now - (activity.stamp ?? now)) / 60000);
  if (minutes < 1) return "방금";
  return minutes < 60 ? `${minutes}분 전` : `${Math.floor(minutes / 60)}시간 전`;
}

/** 재고봇 알림과 팀원 활동을 최신순으로. 메신저와 관리 시스템이 이어져 있다는 걸 보여 주는 위젯 */
function TeamFeed({ people }: { people: Record<string, Person> }) {
  const { activities, openOrder, openItem, openChannel } = useAdmin();
  const [now, setNow] = useState(0); // 시각은 화면이 뜬 뒤에 읽습니다 (미리 렌더링할 때 값이 고정되지 않도록)

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const open = (a: Activity) => {
    if (a.orderId) openOrder(a.orderId);
    else if (a.sku) openItem(a.sku);
    else if (a.channelId) openChannel(a.channelId);
  };

  return (
    <ul className="thin-scroll min-h-0 flex-1 overflow-y-auto">
      {activities.slice(0, FEED_SIZE).map((a) => {
        const actor = people[a.actorId];
        return (
          <li key={a.id}>
            <button type="button" onClick={() => open(a)} className="flex w-full items-center gap-2.5 rounded-2xl px-2 py-2 text-left text-[14px] transition hover:bg-white/8">
              <Avatar person={actor} size={34} status={false} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{actor.name}</span>
                  <span className="shrink-0 text-[12.5px]">{agoLabel(a, now)}</span>
                </span>
                <span className="block truncate">{a.text}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
