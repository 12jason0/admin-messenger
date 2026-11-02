"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { Bell, Check, Moon, PanelLeft, Search, Sun } from "lucide-react";
import { useAdmin, type Role } from "@/lib/admin-store";
import { WORKSPACE, type Notice, type Person, type Status } from "@/lib/data";
import { NAV, type View } from "@/lib/nav";
import { Avatar, STATUS_DOT, STATUS_LABEL } from "./ui/Avatar";
import { RoundButton } from "./ui/RoundButton";
import type { Env } from "./Environment";

type Props = {
  view: View;
  onNavigate: (view: View) => void;
  railOpen: boolean;
  onToggleRail: () => void;
  env: Env;
  onToggleEnv: () => void;
  unreadTotal: number;
  notices: Notice[];
  onOpenNotice: (notice: Notice) => void;
  onReadAll: () => void;
  me: Person;
  onChangeStatus: (status: Status) => void;
  onSearch: () => void;
};

const ROLE_LABEL: Record<Role, string> = { admin: "관리자", staff: "직원" };
const ROLE_MENU: Record<Role, string> = { admin: "관리자로 보기", staff: "직원으로 보기" };

// 팝오버가 열리고 닫힐 때도 같은 "블러 → 선명" 효과
const popTransition: Transition = { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] };
const pop = {
  initial: { opacity: 0, y: -6, scale: 0.98, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, scale: 0.98, filter: "blur(6px)" },
  transition: popTransition,
};

function useDismiss(open: boolean, close: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, ref]);
}

export default function TopBar(props: Props) {
  const { view, onNavigate, railOpen, onToggleRail, env, onToggleEnv, unreadTotal, notices, me } = props;
  const { role, setRole, toast } = useAdmin();
  const roleLabel = ROLE_LABEL[role];
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [meOpen, setMeOpen] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);
  const meRef = useRef<HTMLDivElement>(null);
  useDismiss(noticeOpen, () => setNoticeOpen(false), noticeRef);
  useDismiss(meOpen, () => setMeOpen(false), meRef);

  const unreadNotices = notices.filter((n) => n.unread).length;

  return (
    <header className="relative z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 pt-4 pb-2 md:grid-cols-[1fr_auto_1fr] md:px-6">
      <div className="flex items-center gap-2">
        <RoundButton
          label={railOpen ? "사이드바 숨기기" : "사이드바 보이기"}
          onClick={onToggleRail}
          aria-pressed={railOpen}
          className="hidden md:grid"
        >
          <PanelLeft size={18} aria-hidden="true" />
        </RoundButton>
        <RoundButton label={env === "day" ? "밤으로 바꾸기" : "낮으로 바꾸기"} onClick={onToggleEnv}>
          {env === "day" ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        </RoundButton>
        <p className="hidden flex-col gap-1 text-[11.5px] font-medium whitespace-nowrap md:flex xl:flex-row">
          <span className="surface rounded-full px-2.5 py-0.5">데모 · 가상 데이터</span>
          <span className="surface w-fit rounded-full px-2.5 py-0.5">{roleLabel}</span>
        </p>
      </div>

      {/* 가운데 알약 메뉴: 선택된 칸이 미끄러지듯 이동 (layoutId) */}
      <nav aria-label="주요 메뉴" className="glass hidden items-center gap-1 rounded-full p-1.5 md:flex">
        {NAV.map((item) => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={`relative isolate flex h-9 items-center gap-2 rounded-full px-3 text-[13.5px] xl:px-4 font-medium transition-colors ${
                active ? "text-white" : "text-white/90 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="top-nav-active"
                  className="absolute inset-0 -z-10 rounded-full bg-white/18 shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_6px_16px_-8px_rgb(0_0_0/0.5)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={16} aria-hidden="true" />
              <span className="hidden lg:inline">{item.label}</span>
              {item.id === "messages" && unreadTotal > 0 && (
                <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10.5px] leading-none font-semibold text-white tabular-nums">
                  {unreadTotal}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <p className="min-w-0 text-center md:hidden">
        <span className="block truncate text-sm font-semibold">{WORKSPACE}</span>
        <span className="block truncate text-[11px]">데모 · 가상 데이터 · {roleLabel}</span>
      </p>

      <div className="flex items-center justify-end gap-2">
        <RoundButton label="대화 검색" onClick={props.onSearch}>
          <Search size={18} aria-hidden="true" />
        </RoundButton>

        <div ref={noticeRef} className="relative">
          <RoundButton
            label={unreadNotices ? `알림 ${unreadNotices}개` : "알림"}
            aria-expanded={noticeOpen}
            onClick={() => setNoticeOpen((o) => !o)}
          >
            <Bell size={18} aria-hidden="true" />
            {unreadNotices > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-alert text-[10px] font-bold text-white">
                {unreadNotices}
              </span>
            )}
          </RoundButton>
          <AnimatePresence>
            {noticeOpen && (
              <motion.div {...pop} className="glass glass-strong absolute top-12 right-0 z-40 w-[min(320px,calc(100vw-32px))] rounded-[24px] p-2">
                <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2">
                  <h2 className="text-sm font-semibold">알림</h2>
                  <button
                    type="button"
                    onClick={props.onReadAll}
                    disabled={!unreadNotices}
                    className="rounded-full px-2.5 py-1 text-xs text-white/90 hover:bg-white/10 hover:text-white disabled:opacity-40"
                  >
                    모두 읽음
                  </button>
                </div>
                <ul className="thin-scroll flex max-h-80 flex-col gap-1 overflow-y-auto">
                  {notices.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          props.onOpenNotice(n);
                          setNoticeOpen(false);
                        }}
                        className="flex w-full items-start gap-2.5 rounded-2xl px-2.5 py-2.5 text-left hover:bg-white/10"
                      >
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.unread ? "bg-accent-hi" : "bg-transparent"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] leading-snug ${n.unread ? "text-white" : "text-white/90"}`}>{n.text}</span>
                          <span className="mt-0.5 block text-[11px] text-white/90">{n.time}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={meRef} className="relative">
          <button
            type="button"
            aria-label="내 상태 바꾸기"
            aria-expanded={meOpen}
            onClick={() => setMeOpen((o) => !o)}
            className="rounded-full transition active:scale-95"
          >
            <Avatar person={me} size={40} />
          </button>
          <AnimatePresence>
            {meOpen && (
              <motion.div {...pop} className="glass glass-strong absolute top-12 right-0 z-40 w-60 rounded-[22px] p-2">
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar person={me} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{me.name}</p>
                    <p className="truncate text-xs text-white/90">{me.role}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-white/10" />
                {(["online", "away", "offline"] as Status[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={me.status === s}
                    onClick={() => {
                      props.onChangeStatus(s);
                      setMeOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] hover:bg-white/10"
                  >
                    <span className={`size-2.5 rounded-full ${STATUS_DOT[s]}`} />
                    {STATUS_LABEL[s]}
                    {me.status === s && <Check size={15} className="ml-auto text-accent-hi" aria-hidden="true" />}
                  </button>
                ))}
                <div className="my-1 h-px bg-white/10" />
                {(["admin", "staff"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={role === r}
                    onClick={() => {
                      setRole(r);
                      setMeOpen(false);
                      toast(`${ROLE_LABEL[r]} 보기로 바꿨어요`);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] hover:bg-white/10"
                  >
                    {ROLE_MENU[r]}
                    {role === r && <Check size={15} className="ml-auto text-accent-hi" aria-hidden="true" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
