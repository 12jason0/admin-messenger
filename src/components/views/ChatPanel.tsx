"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ChevronLeft, Hash, Info, Paperclip, SendHorizontal } from "lucide-react";
import { ME, type Attachment, type Conversation, type Message, type Person } from "@/lib/data";
import { useAdmin } from "@/lib/admin-store";
import { formatSize, guessKind } from "@/lib/format";
import { panelVariants } from "@/lib/motion";
import { Avatar, STATUS_LABEL } from "../ui/Avatar";
import { FILE_KIND } from "../ui/fileKinds";

type Props = {
  conv: Conversation;
  people: Record<string, Person>;
  typingId?: string;
  infoOpen: boolean;
  className: string;
  onSend: (content: { text?: string; file?: Attachment }) => void;
  onBack: () => void;
  onToggleInfo: () => void;
};

/** 가운데 대화창: 글을 오래 읽는 곳이라 유리를 더 진하게(glass-strong) */
export default function ChatPanel({ conv, people, typingId, infoOpen, className, onSend, onBack, onToggleInfo }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);
  const prevId = useRef(conv.id);
  const person = conv.personId ? people[conv.personId] : undefined;
  const count = conv.messages.length;

  // 새 메시지·입력 중 표시가 생기면 맨 아래로 (대화를 바꿨을 땐 바로 이동)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const jump = firstRun.current || prevId.current !== conv.id;
    firstRun.current = false;
    prevId.current = conv.id;
    el.scrollTo({ top: el.scrollHeight, behavior: jump ? "auto" : "smooth" });
  }, [conv.id, count, typingId]);

  return (
    <motion.section variants={panelVariants} aria-label="대화" className={`glass glass-strong min-h-0 flex-col rounded-[28px] ${className}`}>
      <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="대화 목록으로"
          className="grid size-9 place-items-center rounded-full text-white/90 hover:bg-white/10 md:hidden"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        {person ? (
          <Avatar person={person} size={38} />
        ) : (
          <span className="grid size-[38px] shrink-0 place-items-center rounded-[13px] bg-white/10 text-white/90">
            <Hash size={17} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold">{person ? person.name : `# ${conv.name}`}</h2>
          <p className="truncate text-[12px] text-white/90">
            {person ? `${STATUS_LABEL[person.status]} · ${person.role}` : `멤버 ${conv.memberIds.length}명 · ${conv.topic ?? ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleInfo}
          aria-label="대화 정보"
          aria-pressed={infoOpen}
          className={`grid size-9 place-items-center rounded-full transition ${infoOpen ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10"}`}
        >
          <Info size={18} aria-hidden="true" />
        </button>
      </header>

      <div ref={scrollRef} className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-5">
        <div className="mb-6 flex flex-col items-start gap-2 border-b border-white/8 pb-5">
          {person ? (
            <Avatar person={person} size={52} status={false} />
          ) : (
            <span className="grid size-[52px] place-items-center rounded-[18px] bg-white/10 text-white/90">
              <Hash size={24} aria-hidden="true" />
            </span>
          )}
          <h3 className="text-[17px] font-semibold">{person ? `${person.name} 님과의 대화` : `#${conv.name} 채널의 시작이에요`}</h3>
          <p className="text-[13px] text-white/90">{person ? `${person.role} · ${person.team}` : conv.topic}</p>
        </div>

        <div className="flex flex-col gap-1">
          {conv.messages.map((m, i) => {
            const prev = conv.messages[i - 1];
            const next = conv.messages[i + 1];
            return (
              <MessageRow
                key={m.id}
                m={m}
                author={people[m.authorId]}
                mine={m.authorId === ME}
                first={!prev || prev.authorId !== m.authorId}
                showTime={!next || next.authorId !== m.authorId || next.time !== m.time}
              />
            );
          })}
          {typingId && <TypingRow person={people[typingId]} />}
        </div>
      </div>

      <Composer
        key={conv.id}
        placeholder={person ? `${person.name} 님에게 메시지 보내기` : `#${conv.name}에 메시지 보내기`}
        onSend={onSend}
      />
    </motion.section>
  );
}

function MessageRow({ m, author, mine, first, showTime }: { m: Message; author: Person; mine: boolean; first: boolean; showTime: boolean }) {
  // 이번에 새로 보낸/받은 메시지만 살짝 떠오르며 등장
  const isNew = m.id.startsWith("local-");
  const { openItem } = useAdmin();
  const corner = first ? (mine ? "rounded-tr-md" : "rounded-tl-md") : "";
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 8, filter: "blur(4px)" } : false}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2.5 ${first ? "mt-3 first:mt-0" : ""} ${mine ? "justify-end" : ""}`}
    >
      {!mine && <div className="w-9 shrink-0">{first && <Avatar person={author} size={36} status={false} />}</div>}
      <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`}>
        {!mine && first && <span className="mb-1 text-[12.5px] font-medium text-white/90">{author.name}</span>}
        <div className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
          {m.file ? (
            <FileBubble file={m.file} mine={mine} corner={corner} />
          ) : (
            <p
              className={`max-w-[min(520px,72vw)] rounded-[18px] px-3.5 py-2.5 text-[14px] leading-relaxed break-words whitespace-pre-wrap ${corner} ${
                mine ? "bg-accent text-white" : "surface text-white"
              }`}
            >
              {m.text}
            </p>
          )}
          {showTime && <time className="shrink-0 pb-0.5 text-[11px] whitespace-nowrap text-white/90">{m.time}</time>}
        </div>
        {m.itemSku && (
          <button
            type="button"
            onClick={() => openItem(m.itemSku!)}
            className="surface mt-1.5 flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition hover:bg-white/15"
          >
            재고 화면에서 보기
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function FileBubble({ file, mine, corner }: { file: Attachment; mine: boolean; corner: string }) {
  const kind = FILE_KIND[file.kind];
  const Icon = kind.icon;
  return (
    <div className={`flex w-[min(280px,68vw)] items-center gap-3 rounded-[18px] p-2.5 ${corner} ${mine ? "bg-accent" : "surface"}`}>
      <span
        className="grid size-11 shrink-0 place-items-center rounded-[14px] text-white"
        style={{ background: `linear-gradient(135deg, hsl(${kind.hue} 70% 55%), hsl(${kind.hue + 30} 65% 38%))` }}
      >
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-medium">{file.name}</span>
        <span className="block text-[11.5px] text-white/90">
          {kind.label} · {file.size}
        </span>
      </span>
    </div>
  );
}

function TypingRow({ person }: { person: Person }) {
  return (
    <div className="mt-3 flex items-end gap-2.5" aria-live="polite">
      <Avatar person={person} size={36} status={false} />
      <div className="flex items-center rounded-[18px] rounded-tl-md bg-white/12 px-3.5 py-3">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="typing-dot size-1.5 rounded-full bg-white/80" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      </div>
      <span className="pb-1 text-[11.5px] text-white/90">{person.name} 님이 입력 중</span>
    </div>
  );
}

function Composer({ placeholder, onSend }: { placeholder: string; onSend: Props["onSend"] }) {
  const [text, setText] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resize = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend({ text: t });
    setText("");
    requestAnimationFrame(resize);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="px-3 pt-2 pb-3"
    >
      <div className="surface flex items-end gap-1.5 rounded-[22px] p-1.5 focus-within:shadow-[inset_0_0_0_1px_rgb(106_166_255/0.7)]">
        <button
          type="button"
          aria-label="파일 첨부"
          onClick={() => fileRef.current?.click()}
          className="grid size-9 shrink-0 place-items-center rounded-full text-white/90 hover:bg-white/10 hover:text-white"
        >
          <Paperclip size={18} aria-hidden="true" />
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSend({ file: { name: f.name, size: formatSize(f.size), kind: guessKind(f.name) } });
            e.target.value = "";
          }}
        />
        <textarea
          ref={areaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            // 한글 조합 중 Enter는 무시: 안 그러면 마지막 글자가 한 번 더 전송돼요
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label="메시지 입력"
          className="max-h-36 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-[14px] leading-5 outline-none placeholder:text-white/90"
        />
        <button
          type="submit"
          aria-label="보내기"
          disabled={!text.trim()}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_6px_16px_-6px_rgb(47_111_237/0.8)] transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          <SendHorizontal size={17} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1.5 hidden px-3 text-[11px] text-white/90 md:block">Enter로 보내기 · Shift+Enter로 줄바꿈</p>
    </form>
  );
}
