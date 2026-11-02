"use client";

import { motion } from "motion/react";
import { NAV, type View } from "@/lib/nav";

type Props = { view: View; onNavigate: (view: View) => void; open: boolean; unreadTotal: number };

/**
 * 왼쪽에 떠 있는 세로 메뉴 (영상 속 왼쪽 아이콘 줄).
 * 휴대폰 화면에서는 아래쪽 가로 메뉴로 바뀝니다.
 */
export default function Rail({ view, onNavigate, open, unreadTotal }: Props) {
  return (
    <nav
      aria-label="바로가기"
      className={`glass fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full p-1.5 transition-[opacity,translate] duration-500 md:top-1/2 md:bottom-auto md:left-5 md:-translate-y-1/2 md:flex-col ${
        open ? "md:translate-x-0 md:opacity-100" : "md:pointer-events-none md:-translate-x-6 md:opacity-0"
      }`}
    >
      {NAV.map((item) => {
        const active = view === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`group relative grid size-11 place-items-center rounded-full transition-colors ${
              active ? "text-[#1b1a1f]" : "text-white/90 hover:bg-white/10 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId="rail-active"
                className="absolute inset-0 rounded-full bg-ink shadow-[0_6px_16px_-6px_rgb(0_0_0/0.55)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon size={19} className="relative" aria-hidden="true" />
            {item.id === "messages" && unreadTotal > 0 && !active && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-accent-hi ring-2 ring-[#2a262d]" />
            )}
            {/* 마우스를 올리면 오른쪽에 이름표 */}
            <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 md:block">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
