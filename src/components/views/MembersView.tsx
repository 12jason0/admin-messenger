"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { ME, TEAMS, WORKSPACE, type Person, type Status, type Team } from "@/lib/data";
import { panelVariants, viewVariants } from "@/lib/motion";
import { Avatar, STATUS_LABEL } from "../ui/Avatar";
import { Segmented } from "../ui/Segmented";

const STATUS_PILL: Record<Status, string> = {
  online: "bg-good/15 text-[#8af0bb]",
  away: "bg-warn/15 text-[#ffd58a]",
  offline: "bg-white/10 text-white/90",
};

/** 팀원 화면: 카드를 고르면 바로 1:1 대화로 이동 */
export default function MembersView({ people, onMessage }: { people: Record<string, Person>; onMessage: (personId: string) => void }) {
  const [team, setTeam] = useState<Team | "all">("all");
  const all = Object.values(people).filter((p) => !p.bot);
  const list = all.filter((p) => team === "all" || p.team === team);
  const online = all.filter((p) => p.status === "online").length;

  return (
    <motion.section variants={viewVariants} initial="hidden" animate="show" exit="exit" className="mx-auto max-w-[1480px]">
      <motion.div variants={panelVariants} className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">팀원</h1>
          <p className="mt-1 text-sm text-white/90">
            {WORKSPACE} · {all.length}명 중 {online}명 접속 중
          </p>
        </div>
        <Segmented
          label="팀 고르기"
          value={team}
          onChange={setTeam}
          options={[{ value: "all", label: "전체" }, ...TEAMS.map((t) => ({ value: t, label: t }))]}
        />
      </motion.div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {list.map((p) => (
          <motion.article key={p.id} variants={panelVariants} className="glass flex flex-col rounded-[28px] p-5">
            <div className="flex items-start justify-between">
              <Avatar person={p} size={56} />
              <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${STATUS_PILL[p.status]}`}>{STATUS_LABEL[p.status]}</span>
            </div>
            <h2 className="mt-4 text-[17px] font-semibold">
              {p.name}
              {p.id === ME && <span className="ml-1.5 text-xs font-normal text-white/90">나</span>}
            </h2>
            <p className="text-[13px] text-white/90">{p.role}</p>
            <span className="surface mt-3 w-fit rounded-full px-2.5 py-1 text-[11.5px]">{p.team}</span>
            <div className="mt-4 flex flex-col gap-1.5 text-[12.5px] text-white/90">
              <p className="flex items-center gap-2">
                <Mail size={14} aria-hidden="true" />
                <span className="sr-only">이메일</span>
                {p.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} aria-hidden="true" />
                <span className="sr-only">전화</span>
                {p.phone}
              </p>
            </div>
            {p.id !== ME && (
              <button
                type="button"
                onClick={() => onMessage(p.id)}
                className="mt-5 flex h-10 items-center justify-center gap-2 rounded-2xl bg-white/12 text-[13.5px] font-medium transition hover:bg-white/20"
              >
                <MessageCircle size={16} aria-hidden="true" />
                메시지 보내기
              </button>
            )}
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
