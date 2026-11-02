// 재고·입력·CSV 규칙 검사. 실행: npm run check:admin
import assert from "node:assert/strict";
import { DEMO_NOW, ITEMS, ORDERS, TODAY, addDays } from "../src/lib/admin-data.ts";
import { commaInput, crossedBelow, orderSummary, parseWhole, shortages, stockAfter, stockStatus, toCsv, won } from "../src/lib/admin-logic.ts";

assert.equal(ITEMS.length, 40);
assert.ok(ORDERS.length >= 270 && ORDERS.length <= 330, `주문 ${ORDERS.length}건`);
assert.ok(ORDERS.every((o) => o.at.slice(0, 10) >= addDays(TODAY, -89) && o.at.slice(0, 10) <= TODAY));
assert.equal(new Set(ORDERS.map((o) => o.id)).size, ORDERS.length);
assert.ok(ORDERS.every((o) => o.at <= `${TODAY}T${DEMO_NOW}`), "시드 주문은 데모 기준 시각 이전");
assert.equal(ITEMS.find((i) => i.sku === "SKU-1023").name, "무선 마우스");
assert.equal(ITEMS.filter((i) => i.stock < i.safety).length, 6);

assert.equal(stockStatus({ stock: 0, safety: 5 }), "품절");
assert.equal(stockStatus({ stock: 4, safety: 5 }), "부족");
assert.equal(stockStatus({ stock: 5, safety: 5 }), "정상");

assert.equal(crossedBelow(12, 4, 10), true);
assert.equal(crossedBelow(10, 9, 10), true);
assert.equal(crossedBelow(9, 3, 10), false, "부족이 이어지면 다시 알리지 않음");
assert.equal(crossedBelow(4, 12, 10), false);

assert.equal(stockAfter(10, "입고", 5), 15);
assert.equal(stockAfter(10, "출고", 4), 6);
assert.equal(stockAfter(10, "파손", 11), null);
assert.equal(stockAfter(10, "실사조정", 0), 0);

const item = (sku, stock) => ({ sku, stock });
assert.deepEqual(shortages([{ sku: "A", qty: 3 }, { sku: "A", qty: 3 }], [item("A", 5)]).map((i) => i.sku), ["A"], "같은 품목 줄은 합산");
assert.equal(shortages([{ sku: "A", qty: 5 }], [item("A", 5)]).length, 0);

assert.equal(parseWhole("1,234"), 1234);
for (const bad of ["-1", "1.5", "abc", "", "1e3"]) assert.equal(parseWhole(bad), null, bad);
assert.equal(commaInput("1234567"), "1,234,567");
assert.equal(commaInput("-3"), "-3");

assert.equal(won(1234000), "1,234,000원");
assert.equal(orderSummary([{ name: "무선 마우스" }, { name: "b" }, { name: "c" }]), "무선 마우스 외 2건");

const csv = toCsv([["이름", "금액"], ['쉼표,"따옴표"', 1234000], ["=SUM(A1)", 0]]);
assert.ok(csv.startsWith("﻿"));
assert.ok(csv.includes('"쉼표,""따옴표"""'));
assert.ok(csv.includes(",1234000\r\n"));
assert.ok(csv.includes("'=SUM(A1)"));

console.log(`통과: 품목 ${ITEMS.length}개, 주문 ${ORDERS.length}건`);
