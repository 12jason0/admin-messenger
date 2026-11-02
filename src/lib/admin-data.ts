// 주문·재고 가짜 데이터 (가상 회사 "노을상사").
// 시드와 기준 날짜를 고정해서 새로고침해도, 서버·브라우저 어디서 만들어도 값이 같습니다(하이드레이션 오류 방지).

export const TODAY = "2026-11-02";
export const TODAY_COMPACT = TODAY.replaceAll("-", "");
/** 페이지를 연 순간의 데모 시각. 시드 데이터는 모두 이 시각 이전입니다. */
export const DEMO_NOW = "17:30";

/**
 * 데모 시계(ms): 페이지를 연 뒤 실제로 흐른 시간만큼 기준 시각에서 나아갑니다.
 * 시간대의 영향을 받지 않도록 UTC 칸에 담아 두니, 꺼내 쓸 때도 UTC로 읽어야 합니다.
 */
export const demoNow = () => Date.parse(`${TODAY}T${DEMO_NOW}:00Z`) + performance.now();
/** 데모 시계를 주문·재고 기록의 "YYYY-MM-DDTHH:mm" 형식으로 */
export const demoAt = () => new Date(demoNow()).toISOString().slice(0, 16);

export const CATEGORIES = ["전자기기", "사무용품", "가구", "케이블"] as const;
export type Category = (typeof CATEGORIES)[number];

export const ORDER_STATUSES = ["접수", "출고대기", "출고완료", "취소"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STOCK_REASONS = ["입고", "출고", "파손", "실사조정"] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

export type Item = {
  sku: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  safety: number;
  lastInbound: string; // YYYY-MM-DD
};

export type OrderLine = { sku: string; name: string; qty: number; price: number };

export type Order = {
  id: string;
  at: string; // YYYY-MM-DDTHH:mm
  customer: string;
  lines: OrderLine[];
  amount: number;
  status: OrderStatus;
  assigneeId: string;
  memo: string;
};

export type StockLog = {
  id: string;
  sku: string;
  at: string; // YYYY-MM-DDTHH:mm
  by: string; // 사람 id
  reason: StockReason;
  before: number;
  after: number;
  memo: string;
};

export const CUSTOMERS = [
  "가람누리오피스",
  "나래숲문구유통",
  "다솜길사무기기",
  "라온뜰비즈",
  "마루별상사",
  "바른결오피스",
  "새솔빛유통",
  "아라뫼테크",
  "여울목상회",
  "자람터교육원",
  "차오름물산",
  "푸른들학원",
  "하늬바람디자인",
  "한울타리병원",
  "해오름건설",
];

export const ASSIGNEES = ["seoyeon", "sua", "jihoon", "doyun", "me"];

type Row = [name: string, category: Category, price: number, stock: number, safety: number];

// SKU는 1001번부터 순서대로 붙습니다. 부족·품절 6개, 안전재고 바로 위 4개가 시연용입니다.
const ROWS: Row[] = [
  ["A4 복사용지 500매", "사무용품", 5900, 420, 100],
  ["A3 복사용지 500매", "사무용품", 11500, 86, 40],
  ["0.5mm 볼펜 12입", "사무용품", 6800, 210, 60],
  ["수성 사인펜 세트", "사무용품", 9500, 64, 30],
  ["형광펜 5색 세트", "사무용품", 4800, 150, 40],
  ["3공 바인더 A4", "사무용품", 3200, 180, 50],
  ["클리어 파일 40매", "사무용품", 4500, 44, 40],
  ["스테이플러 중형", "사무용품", 8900, 72, 25],
  ["스테이플 심 10갑", "사무용품", 3800, 130, 40],
  ["사무용 가위", "사무용품", 3500, 7, 20],
  ["접착 메모지 10패드", "사무용품", 7200, 96, 40],
  ["수정 테이프 6입", "사무용품", 8400, 58, 25],
  ["라벨 스티커 A4 100매", "사무용품", 15800, 34, 20],
  ["탁상 달력 2027", "사무용품", 4900, 120, 30],
  ["서류 보관함 5단", "사무용품", 18900, 26, 15],
  ["화이트보드 마커 12입", "사무용품", 13500, 18, 20],
  ["사무용 메쉬 의자", "가구", 129000, 38, 10],
  ["높이조절 책상 1200", "가구", 289000, 14, 6],
  ["3단 이동 서랍", "가구", 79000, 21, 8],
  ["회의 테이블 1800", "가구", 219000, 5, 4],
  ["4단 철제 책장", "가구", 99000, 0, 5],
  ["모니터 받침대", "가구", 32000, 46, 15],
  ["무선 마우스", "전자기기", 18900, 12, 10],
  ["무선 키보드", "전자기기", 34900, 33, 15],
  ["27인치 QHD 모니터", "전자기기", 269000, 17, 8],
  ["USB 허브 7포트", "전자기기", 28000, 8, 15],
  ["노트북 거치대", "전자기기", 24500, 39, 15],
  ["FHD 웹캠", "전자기기", 46000, 25, 10],
  ["유선 헤드셋", "전자기기", 39000, 19, 10],
  ["흑백 레이저 프린터", "전자기기", 189000, 9, 5],
  ["복합기 토너 검정", "전자기기", 72000, 6, 12],
  ["휴대용 SSD 1TB", "전자기기", 119000, 28, 10],
  ["보조배터리 20000mAh", "전자기기", 36000, 52, 20],
  ["HDMI 케이블 2m", "케이블", 12900, 140, 40],
  ["USB-C 충전 케이블 1m", "케이블", 8500, 3, 30],
  ["랜 케이블 CAT6 5m", "케이블", 6900, 88, 30],
  ["DP 케이블 1.8m", "케이블", 14500, 41, 20],
  ["멀티탭 6구 3m", "케이블", 17900, 63, 25],
  ["USB-A 연장 케이블 2m", "케이블", 5500, 72, 25],
  ["오디오 케이블 1.5m", "케이블", 4900, 30, 25],
];

/** 시드를 고정한 난수 (mulberry32) */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "2026-11-02"에서 며칠 전후 날짜. 시간대 영향을 받지 않도록 UTC로만 계산합니다. */
export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function weekday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const pad = (n: number) => String(n).padStart(2, "0");

export const ITEMS: Item[] = (() => {
  const rand = seeded(1023);
  return ROWS.map(([name, category, price, stock, safety], i) => ({
    sku: `SKU-${1001 + i}`,
    name,
    category,
    price,
    stock,
    safety,
    lastInbound: addDays(TODAY, -(2 + Math.floor(rand() * 40))),
  }));
})();

export const ORDERS: Order[] = (() => {
  const rand = seeded(20261102);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const orders: Order[] = [];

  for (let ago = 89; ago >= 0; ago--) {
    const date = addDays(TODAY, -ago);
    const day = weekday(date);
    const weekend = day === 0 || day === 6;
    const count = ago === 0 ? 12 : weekend ? Math.floor(rand() * 2) : 3 + Math.floor(rand() * 4);
    const dayStamp = date.slice(2).replaceAll("-", "");

    const times = Array.from({ length: count }, () => 9 * 60 + Math.floor(rand() * 8.5 * 60)).sort((a, b) => a - b);
    times.forEach((minutes, n) => {
      const chosen = new Set<Item>();
      const wanted = 1 + Math.floor(rand() * 3.4);
      while (chosen.size < wanted) chosen.add(pick(ITEMS));
      const lines: OrderLine[] = [...chosen].map((item) => {
        const qty = item.price >= 100000 ? 1 + Math.floor(rand() * 3) : item.price >= 20000 ? 2 + Math.floor(rand() * 8) : 5 + Math.floor(rand() * 30);
        return { sku: item.sku, name: item.name, qty, price: item.price };
      });

      const roll = rand();
      let status: OrderStatus;
      if (ago <= 1) status = roll < 0.45 ? "접수" : roll < 0.85 ? "출고대기" : "출고완료";
      else if (ago <= 5) status = roll < 0.1 ? "접수" : roll < 0.5 ? "출고대기" : roll < 0.95 ? "출고완료" : "취소";
      else status = roll < 0.94 ? "출고완료" : "취소";

      orders.push({
        id: `ORD-${dayStamp}-${pad(n + 1)}`,
        at: `${date}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
        customer: pick(CUSTOMERS),
        lines,
        amount: lines.reduce((sum, l) => sum + l.qty * l.price, 0),
        status,
        assigneeId: pick(ASSIGNEES),
        memo: "",
      });
    });
  }
  return orders;
})();

export const STOCK_LOGS: StockLog[] = (() => {
  const rand = seeded(77);
  return ITEMS.map((item, i) => {
    // 마지막 기록의 "후" 값이 현재 재고와 맞아야 합니다. 품절 품목은 출고로 바닥난 기록을 둡니다.
    const moved = 10 + Math.floor(rand() * 40);
    const soldOut = item.stock === 0;
    return {
      id: `seed-${i}`,
      sku: item.sku,
      at: `${item.lastInbound}T10:30`,
      by: "doyun",
      reason: soldOut ? ("출고" as const) : ("입고" as const),
      before: soldOut ? moved : Math.max(0, item.stock - moved),
      after: item.stock,
      memo: soldOut ? "거래처 출고" : "정기 입고",
    };
  });
})();
