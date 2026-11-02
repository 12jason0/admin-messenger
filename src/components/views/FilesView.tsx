"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { FILES, type Conversation, type FileKind, type Person, type SharedFile } from "@/lib/data";
import { panelVariants, viewVariants } from "@/lib/motion";
import { Avatar } from "../ui/Avatar";
import { Segmented } from "../ui/Segmented";
import { FILE_KIND } from "../ui/fileKinds";

type Props = {
  people: Record<string, Person>;
  conversations: Conversation[];
  onOpen: (conversationId: string) => void;
};

/** 파일 화면: 영상 속 Saved 화면처럼 색 있는 유리 카드 */
export default function FilesView({ people, conversations, onOpen }: Props) {
  const [kind, setKind] = useState<FileKind | "all">("all");

  // 이번에 대화창에서 올린 파일도 같이 보여주기
  const uploaded: SharedFile[] = conversations.flatMap((c) =>
    c.messages
      .filter((m) => m.file && m.id.startsWith("local-"))
      .map((m) => ({ ...m.file!, id: m.id, ownerId: m.authorId, conversationId: c.id, when: "방금" })),
  );
  const all = [...uploaded, ...FILES];
  const list = all.filter((f) => kind === "all" || f.kind === kind);
  const where = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (!c) return "";
    return c.kind === "channel" ? `#${c.name}` : `${c.name} 님과의 대화`;
  };

  return (
    <motion.section variants={viewVariants} initial="hidden" animate="show" exit="exit" className="mx-auto max-w-[1480px]">
      <motion.div variants={panelVariants} className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">파일</h1>
          <p className="mt-1 text-sm text-white/90">대화에서 공유된 파일 {all.length}개</p>
        </div>
        <Segmented
          label="파일 종류"
          value={kind}
          onChange={setKind}
          options={[
            { value: "all", label: "전체" },
            ...(Object.keys(FILE_KIND) as FileKind[]).map((k) => ({ value: k, label: FILE_KIND[k].label })),
          ]}
        />
      </motion.div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {list.map((f) => {
          const k = FILE_KIND[f.kind];
          const Icon = k.icon;
          const owner = people[f.ownerId];
          return (
            <motion.article key={f.id} variants={panelVariants} className="glass rounded-[26px] p-2.5">
              <div
                className="relative h-28 overflow-hidden rounded-[18px]"
                style={{
                  background: `linear-gradient(135deg, hsl(${k.hue} 75% 60% / 0.6), hsl(${k.hue + 35} 70% 40% / 0.4))`,
                  boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.35), inset 0 0 0 1px rgb(255 255 255 / 0.12)",
                }}
              >
                <span className="absolute top-3 left-3 grid size-9 place-items-center rounded-xl bg-white/20 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="absolute right-3 bottom-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-medium text-white">{k.label}</span>
              </div>
              <div className="px-2 pt-3 pb-1.5">
                <h2 className="truncate text-[15px] font-semibold" title={f.name}>
                  {f.name}
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-white/90">
                  {owner && <Avatar person={owner} size={20} status={false} />}
                  <span className="truncate">
                    {owner?.name} · {where(f.conversationId)}
                  </span>
                </p>
                <div className="mt-3 flex items-center justify-between text-[12px] text-white/90">
                  <span>
                    {f.size} · {f.when}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpen(f.conversationId)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-white/90 transition hover:bg-white/10 hover:text-white"
                  >
                    대화 보기
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
