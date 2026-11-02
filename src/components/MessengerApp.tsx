"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  AUTO_REPLIES,
  CONVERSATIONS,
  BOT,
  ME,
  NOTICES,
  PEOPLE,
  STOCK_BOT,
  STOCK_CHANNEL,
  lowStockText,
  type Attachment,
  type Conversation,
  type Message,
  type Notice,
  type Status,
} from "@/lib/data";
import type { Item } from "@/lib/admin-data";
import { AdminContext, useAdminState } from "@/lib/admin-store";
import { nowLabel } from "@/lib/format";
import type { View } from "@/lib/nav";
import Environment, { envAt, type Env } from "./Environment";
import TopBar from "./TopBar";
import Rail from "./Rail";
import { Toaster } from "./ui/admin";
import DashboardView from "./views/DashboardView";
import InventoryView from "./views/InventoryView";
import MessagesView from "./views/MessagesView";
import OrdersView from "./views/OrdersView";
import MembersView from "./views/MembersView";
import FilesView from "./views/FilesView";

/**
 * 앱 전체 상태를 들고 있는 곳.
 * 지금은 가짜 데이터(lib/data.ts)로 돌아가고,
 * 나중에 send()·openConversation() 안을 서버 호출(소켓/API)로 바꾸면 됩니다.
 */
export default function MessengerApp() {
  const [view, setView] = useState<View>("dashboard");
  const [env, setEnv] = useState<Env>("day");
  const [shifting, setShifting] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState("sales");
  const [typing, setTyping] = useState<Record<string, string>>({});
  const [myStatus, setMyStatus] = useState<Status>("online");
  const [notices, setNotices] = useState<Notice[]>(NOTICES);
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
  const [focus, setFocus] = useState<string | null>(null); // 다른 화면에서 눌러 찾아간 주문번호·SKU

  const searchRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const replyTurn = useRef(0);
  const shiftTimer = useRef<number | undefined>(undefined);
  // 타이머 안에서 "지금 보고 있는 화면"을 알기 위한 ref
  const live = useRef({ view, activeId });
  useEffect(() => {
    live.current = { view, activeId };
  }, [view, activeId]);

  // 시간대가 바뀌는 순간에만 배경을 바꿔서, 그 사이 버튼으로 고른 배경은 유지됩니다.
  useEffect(() => {
    let last: Env | undefined;
    const sync = () => {
      const next = envAt(new Date().getHours());
      if (next === last) return;
      last = next;
      setEnv(next);
    };
    sync();
    const id = window.setInterval(sync, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const people = useMemo(() => ({ ...PEOPLE, [BOT]: STOCK_BOT, [ME]: { ...PEOPLE[ME], status: myStatus } }), [myStatus]);
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.muted ? 0 : c.unread), 0);

  // 화면 전환: 배경을 잠깐 흐리게 → 새 화면 패널들이 블러 속에서 떠오름
  function navigate(next: View, target: string | null = null) {
    setFocus(target);
    if (next === view) return;
    setShifting(true);
    window.clearTimeout(shiftTimer.current);
    shiftTimer.current = window.setTimeout(() => setShifting(false), 360);
    setView(next);
  }

  function openConversation(id: string) {
    setActiveId(id);
    setConversations((cs) => cs.map((c) => (c.id === id && c.unread ? { ...c, unread: 0 } : c)));
    setMobilePane("chat");
  }

  function send(conversationId: string, content: { text?: string; file?: Attachment }) {
    const message: Message = { id: `local-${++seq.current}`, authorId: ME, time: nowLabel(), ...content };
    setConversations((cs) => cs.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c)));

    // ---- 아래는 상대가 답장하는 흉내. 서버를 붙이면 지우면 됩니다. ----
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const others = conv.memberIds.filter((id) => id !== ME);
    const online = others.filter((id) => PEOPLE[id]?.status === "online");
    const responder = conv.kind === "dm" ? conv.personId : online[replyTurn.current % Math.max(online.length, 1)] ?? others[0];
    if (!responder) return;

    window.setTimeout(() => setTyping((t) => ({ ...t, [conversationId]: responder })), 700);
    window.setTimeout(() => {
      setTyping((t) => {
        const next = { ...t };
        delete next[conversationId];
        return next;
      });
      const reply: Message = {
        id: `local-${++seq.current}`,
        authorId: responder,
        time: nowLabel(),
        text: AUTO_REPLIES[replyTurn.current++ % AUTO_REPLIES.length],
      };
      const seen = live.current.view === "messages" && live.current.activeId === conversationId;
      setConversations((cs) =>
        cs.map((c) =>
          c.id === conversationId ? { ...c, messages: [...c.messages, reply], unread: seen ? 0 : c.unread + 1 } : c,
        ),
      );
    }, 2300);
  }

  // 재고가 안전재고 아래로 내려간 순간: #재고알림 메시지 + 안 읽음 숫자 + 상단 벨
  function alertLowStock(items: Item[]) {
    const time = nowLabel();
    const messages: Message[] = items.map((item) => ({
      id: `local-${++seq.current}`,
      authorId: BOT,
      time,
      text: lowStockText(item.name, item.sku, item.stock, item.safety),
      itemSku: item.sku,
    }));
    const seen = live.current.view === "messages" && live.current.activeId === STOCK_CHANNEL;
    setConversations((cs) =>
      cs.map((c) =>
        c.id === STOCK_CHANNEL ? { ...c, messages: [...c.messages, ...messages], unread: seen ? 0 : c.unread + messages.length } : c,
      ),
    );
    setNotices((ns) => [
      ...messages.map((m) => ({ id: m.id, text: m.text ?? "", time, conversationId: STOCK_CHANNEL, unread: true })),
      ...ns,
    ]);
  }

  const admin = useAdminState(alertLowStock);

  function toggleMute(id: string) {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)));
  }

  // 팀원 화면에서 "메시지 보내기": 기존 DM이 없으면 새로 만듭니다.
  function startDm(personId: string) {
    const existing = conversations.find((c) => c.kind === "dm" && c.personId === personId);
    const id = existing?.id ?? `dm-${personId}`;
    if (!existing) {
      const p = PEOPLE[personId];
      setConversations((cs) => [
        ...cs,
        { id, kind: "dm", name: p.name, personId, memberIds: [personId, ME], unread: 0, messages: [] },
      ]);
    }
    openConversation(id);
    navigate("messages");
  }

  function openFromNotice(notice: Notice) {
    setNotices((ns) => ns.map((n) => (n.id === notice.id ? { ...n, unread: false } : n)));
    openConversation(notice.conversationId);
    navigate("messages");
  }

  function openStockChannel(id: string) {
    openConversation(id);
    navigate("messages");
  }

  function focusSearch() {
    setMobilePane("list");
    if (view !== "messages") {
      navigate("messages");
      window.setTimeout(() => searchRef.current?.focus(), 800);
    } else {
      searchRef.current?.focus();
    }
  }

  return (
    <AdminContext.Provider value={{ ...admin, openItem: (sku) => navigate("inventory", sku), openOrder: (id) => navigate("orders", id), openChannel: openStockChannel }}>
    <div className="relative h-dvh overflow-hidden text-ink">
      <Environment env={env} shifting={shifting} />

      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]">
        <TopBar
          view={view}
          onNavigate={navigate}
          railOpen={railOpen}
          onToggleRail={() => setRailOpen((o) => !o)}
          env={env}
          onToggleEnv={() => setEnv((e) => (e === "day" ? "night" : "day"))}
          unreadTotal={unreadTotal}
          notices={notices}
          onOpenNotice={openFromNotice}
          onReadAll={() => setNotices((ns) => ns.map((n) => ({ ...n, unread: false })))}
          me={people[ME]}
          onChangeStatus={setMyStatus}
          onSearch={focusSearch}
        />

        <div className="relative min-h-0">
          <Rail view={view} onNavigate={navigate} open={railOpen} unreadTotal={unreadTotal} />

          <main
            className={`thin-scroll h-full overflow-y-auto px-4 pt-2 pb-28 transition-[padding] duration-500 md:pr-8 md:pb-8 ${
              railOpen ? "md:pl-[104px]" : "md:pl-8"
            }`}
          >
            {/* mode="wait": 이전 화면이 블러로 사라진 뒤 다음 화면이 떠오름 */}
            <AnimatePresence mode="wait">
              {view === "dashboard" && <DashboardView key="dashboard" people={people} />}
              {view === "orders" && <OrdersView key="orders" people={people} focusId={focus} />}
              {view === "inventory" && <InventoryView key="inventory" people={people} focusSku={focus} />}
              {view === "messages" && (
                <MessagesView
                  key="messages"
                  people={people}
                  conversations={conversations}
                  activeId={activeId}
                  typing={typing}
                  mobilePane={mobilePane}
                  searchRef={searchRef}
                  onOpen={openConversation}
                  onBack={() => setMobilePane("list")}
                  onSend={send}
                  onToggleMute={toggleMute}
                  onNewChat={() => navigate("members")}
                />
              )}
              {view === "members" && <MembersView key="members" people={people} onMessage={startDm} />}
              {view === "files" && (
                <FilesView
                  key="files"
                  people={people}
                  conversations={conversations}
                  onOpen={(id) => {
                    openConversation(id);
                    navigate("messages");
                  }}
                />
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
    </AdminContext.Provider>
  );
}
