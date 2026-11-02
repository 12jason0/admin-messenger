"use client";

import { useState, type ReactNode, type RefObject } from "react";
import { motion } from "motion/react";
import { Bell, BellOff, Hash, Mail, Phone, Plus, Search, X } from "lucide-react";
import { ME, WORKSPACE, type Attachment, type Conversation, type Person } from "@/lib/data";
import { shortTime } from "@/lib/format";
import { panelVariants, viewVariants } from "@/lib/motion";
import { Avatar, STATUS_DOT, STATUS_LABEL } from "../ui/Avatar";
import { Segmented } from "../ui/Segmented";
import { FILE_KIND } from "../ui/fileKinds";
import ChatPanel from "./ChatPanel";

type Props = {
  people: Record<string, Person>;
  conversations: Conversation[];
  activeId: string;
  typing: Record<string, string>;
  mobilePane: "list" | "chat";
  searchRef: RefObject<HTMLInputElement | null>;
  onOpen: (id: string) => void;
  onBack: () => void;
  onSend: (conversationId: string, content: { text?: string; file?: Attachment }) => void;
  onToggleMute: (id: string) => void;
  onNewChat: () => void;
};

/** 메시지 화면: 왼쪽 대화 목록 · 가운데 대화창 · 오른쪽 정보 (영상 속 Messages 화면 구조) */
export default function MessagesView(props: Props) {
  const { people, conversations, activeId, typing, mobilePane } = props;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [infoWide, setInfoWide] = useState(true); // 넓은 화면: 오른쪽 칸으로
  const [infoOverlay, setInfoOverlay] = useState(false); // 좁은 화면: 위에 덮어서

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const channelCount = conversations.filter((c) => c.kind === "channel").length;
  const dmCount = conversations.length - channelCount;

  const toggleInfo = () => {
    if (window.matchMedia("(min-width: 1280px)").matches) setInfoWide((v) => !v);
    else setInfoOverlay((v) => !v);
  };

  const infoClass = [
    infoOverlay ? "flex absolute inset-y-0 right-0 z-10 w-[min(320px,100%)]" : "hidden",
    infoWide ? "xl:static xl:flex xl:w-auto" : "xl:hidden",
  ].join(" ");

  return (
    <motion.section
      variants={viewVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="mx-auto flex h-full min-h-[560px] max-w-[1480px] flex-col"
    >
      <motion.div variants={panelVariants} className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">메시지</h1>
          <p className="mt-1 text-sm text-white/90">
            {WORKSPACE} · 채널 {channelCount}개 · 대화 {dmCount}개
          </p>
        </div>
        <button
          type="button"
          onClick={props.onNewChat}
          className="glass flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium transition hover:bg-white/15"
        >
          <Plus size={16} aria-hidden="true" />새 대화
        </button>
      </motion.div>

      <div
        className={`relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-4 md:grid-cols-[300px_minmax(0,1fr)] ${
          infoWide ? "xl:grid-cols-[300px_minmax(0,1fr)_300px]" : ""
        }`}
      >
        <ConversationList
          people={people}
          conversations={conversations}
          activeId={active.id}
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          searchRef={props.searchRef}
          onOpen={props.onOpen}
          className={mobilePane === "chat" ? "hidden md:flex" : "flex"}
        />
        <ChatPanel
          conv={active}
          people={people}
          typingId={typing[active.id]}
          infoOpen={infoWide || infoOverlay}
          className={mobilePane === "list" ? "hidden md:flex" : "flex"}
          onSend={(content) => props.onSend(active.id, content)}
          onBack={props.onBack}
          onToggleInfo={toggleInfo}
        />
        <InfoPanel
          conv={active}
          people={people}
          onToggleMute={props.onToggleMute}
          onClose={() => setInfoOverlay(false)}
          className={infoClass}
        />
      </div>
    </motion.section>
  );
}

/* ---------------- 왼쪽: 대화 목록 ---------------- */

type ListProps = {
  people: Record<string, Person>;
  conversations: Conversation[];
  activeId: string;
  query: string;
  onQuery: (q: string) => void;
  filter: "all" | "unread";
  onFilter: (f: "all" | "unread") => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onOpen: (id: string) => void;
  className: string;
};

function ConversationList({ people, conversations, activeId, query, onQuery, filter, onFilter, searchRef, onOpen, className }: ListProps) {
  const q = query.trim();
  const visible = conversations.filter(
    (c) => (filter === "all" || c.unread > 0) && (!q || c.name.includes(q) || c.messages.some((m) => m.text?.includes(q))),
  );
  const channels = visible.filter((c) => c.kind === "channel");
  const dms = visible.filter((c) => c.kind === "dm");
  const unreadCount = conversations.filter((c) => c.unread > 0).length;

  return (
    <motion.aside variants={panelVariants} aria-label="대화 목록" className={`glass min-h-0 flex-col rounded-[28px] p-3 ${className}`}>
      <label className="surface flex h-10 shrink-0 items-center gap-2 rounded-2xl px-3 focus-within:shadow-[inset_0_0_0_1px_rgb(106_166_255/0.7)]">
        <Search size={16} className="text-white/90" aria-hidden="true" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="대화 검색"
          aria-label="대화 검색"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-white/90"
        />
        {query && (
          <button type="button" onClick={() => onQuery("")} aria-label="검색어 지우기" className="text-white/90 hover:text-white">
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </label>

      <div className="mt-2.5 shrink-0">
        <Segmented
          variant="surface"
          label="대화 보기"
          value={filter}
          onChange={onFilter}
          options={[
            { value: "all", label: "전체" },
            { value: "unread", label: "안 읽음", count: unreadCount },
          ]}
        />
      </div>

      <div className="thin-scroll -mx-1 mt-2 min-h-0 flex-1 overflow-y-auto px-1">
        {channels.length > 0 && (
          <Group title="채널">
            {channels.map((c) => (
              <ConversationItem key={c.id} c={c} people={people} active={c.id === activeId} onOpen={onOpen} />
            ))}
          </Group>
        )}
        {dms.length > 0 && (
          <Group title="다이렉트 메시지">
            {dms.map((c) => (
              <ConversationItem key={c.id} c={c} people={people} active={c.id === activeId} onOpen={onOpen} />
            ))}
          </Group>
        )}
        {visible.length === 0 && (
          <p className="px-3 py-10 text-center text-[13px] text-white/90">
            {q ? `‘${q}’에 맞는 대화가 없어요.` : "안 읽은 대화가 없어요."}
          </p>
        )}
      </div>
    </motion.aside>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-3 first:mt-1">
      <h2 className="px-2.5 pb-1.5 text-[11.5px] font-semibold tracking-wide text-white/90">{title}</h2>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

function ConversationItem({ c, people, active, onOpen }: { c: Conversation; people: Record<string, Person>; active: boolean; onOpen: (id: string) => void }) {
  const last = c.messages[c.messages.length - 1];
  const person = c.personId ? people[c.personId] : undefined;
  const who = !last ? "" : last.authorId === ME ? "나: " : c.kind === "channel" ? `${people[last.authorId].name}: ` : "";
  const preview = last ? `${who}${last.text ?? `파일 ${last.file?.name}`}` : "아직 메시지가 없어요";

  return (
    <button
      type="button"
      onClick={() => onOpen(c.id)}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition ${
        active ? "surface" : "hover:bg-white/7"
      }`}
    >
      {person ? (
        <Avatar person={person} size={38} />
      ) : (
        <span className="grid size-[38px] shrink-0 place-items-center rounded-[13px] bg-white/10 text-white/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
          <Hash size={17} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className={`truncate text-[14px] ${c.unread ? "font-semibold text-white" : "font-medium text-white/90"}`}>{c.name}</span>
          {c.muted && (
            <>
              <BellOff size={12} className="shrink-0 self-center text-white/90" aria-hidden="true" />
              <span className="sr-only">알림 꺼짐</span>
            </>
          )}
          <span className="ml-auto shrink-0 text-[11px] text-white/90">{last ? shortTime(last.time) : ""}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={`truncate text-[12.5px] ${c.unread ? "text-white/90" : "text-white/90"}`}>{preview}</span>
          {c.unread > 0 && (
            <span className="ml-auto grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[10.5px] font-semibold text-white tabular-nums">
              {c.unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

/* ---------------- 오른쪽: 대화 정보 ---------------- */

function InfoPanel({
  conv,
  people,
  onToggleMute,
  onClose,
  className,
}: {
  conv: Conversation;
  people: Record<string, Person>;
  onToggleMute: (id: string) => void;
  onClose: () => void;
  className: string;
}) {
  const person = conv.personId ? people[conv.personId] : undefined;
  const members = conv.memberIds.map((id) => people[id]).filter(Boolean);
  const files = conv.messages.filter((m) => m.file);

  return (
    <motion.aside variants={panelVariants} aria-label="대화 정보" className={`glass thin-scroll min-h-0 flex-col overflow-y-auto rounded-[28px] p-4 ${className}`}>
      <div className="flex justify-end xl:hidden">
        <button type="button" onClick={onClose} aria-label="정보 닫기" className="grid size-8 place-items-center rounded-full hover:bg-white/10">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col items-center pt-2 text-center">
        {person ? (
          <Avatar person={person} size={72} />
        ) : (
          <span className="grid size-[72px] place-items-center rounded-[24px] bg-white/10 text-white/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
            <Hash size={30} aria-hidden="true" />
          </span>
        )}
        <h2 className="mt-3 text-[17px] font-semibold">{person ? person.name : `# ${conv.name}`}</h2>
        <p className="mt-1 text-[13px] text-white/90">{person ? `${person.role} · ${person.team}` : conv.topic}</p>
        {person && (
          <span className="surface mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px]">
            <span className={`size-2 rounded-full ${STATUS_DOT[person.status]}`} />
            {STATUS_LABEL[person.status]}
          </span>
        )}
      </div>

      <button
        type="button"
        aria-pressed={!!conv.muted}
        onClick={() => onToggleMute(conv.id)}
        className="surface mt-4 flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl text-[13px] font-medium transition hover:bg-white/12"
      >
        {conv.muted ? <Bell size={15} aria-hidden="true" /> : <BellOff size={15} aria-hidden="true" />}
        {conv.muted ? "알림 켜기" : "알림 끄기"}
      </button>

      {person ? (
        <InfoSection title="연락처">
          <p className="flex items-center gap-2.5 py-1 text-[13px]">
            <Mail size={15} className="text-white/90" aria-hidden="true" />
            <span className="sr-only">이메일</span>
            {person.email}
          </p>
          <p className="flex items-center gap-2.5 py-1 text-[13px]">
            <Phone size={15} className="text-white/90" aria-hidden="true" />
            <span className="sr-only">전화</span>
            {person.phone}
          </p>
        </InfoSection>
      ) : (
        <InfoSection title={`멤버 ${members.length}명`}>
          <ul className="flex flex-col gap-0.5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 py-1.5">
                <Avatar person={m} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {m.name}
                    {m.id === ME && <span className="text-white/90"> (나)</span>}
                  </span>
                  <span className="block truncate text-[11.5px] text-white/90">{m.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </InfoSection>
      )}

      <InfoSection title="공유된 파일">
        {files.length ? (
          <ul className="flex flex-col gap-1.5">
            {files.map((m) => {
              const kind = FILE_KIND[m.file!.kind];
              const Icon = kind.icon;
              return (
                <li key={m.id} className="flex items-center gap-2.5">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, hsl(${kind.hue} 70% 55%), hsl(${kind.hue + 30} 65% 38%))` }}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{m.file!.name}</span>
                    <span className="block text-[11.5px] text-white/90">
                      {m.file!.size} · {people[m.authorId]?.name}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[12.5px] text-white/90">아직 공유된 파일이 없어요.</p>
        )}
      </InfoSection>
    </motion.aside>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 border-t border-white/8 pt-4">
      <h3 className="mb-2 text-[11.5px] font-semibold tracking-wide text-white/90">{title}</h3>
      {children}
    </section>
  );
}
