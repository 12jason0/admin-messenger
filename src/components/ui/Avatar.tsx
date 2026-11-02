import { Bot } from "lucide-react";
import type { Person, Status } from "@/lib/data";

export const STATUS_LABEL: Record<Status, string> = {
  online: "온라인",
  away: "자리 비움",
  offline: "오프라인",
};

export const STATUS_DOT: Record<Status, string> = {
  online: "bg-good",
  away: "bg-warn",
  offline: "bg-white/35",
};

export function Avatar({ person, size = 36, status = true }: { person: Person; size?: number; status?: boolean }) {
  const dot = Math.max(8, Math.round(size * 0.27));
  return (
    <span
      aria-hidden="true"
      className="relative inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.32),
        background: `linear-gradient(135deg, hsl(${person.hue} 58% 50%), hsl(${person.hue + 28} 62% 34%))`,
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.3), 0 2px 8px rgb(0 0 0 / 0.22)",
      }}
    >
      {person.bot ? <Bot size={Math.round(size * 0.55)} aria-hidden="true" /> : person.name.slice(-2)}
      {status && (
        <span
          className={`absolute right-0 bottom-0 rounded-full ${STATUS_DOT[person.status]}`}
          style={{ width: dot, height: dot, boxShadow: "0 0 0 2px rgb(32 29 34)" }}
        />
      )}
    </span>
  );
}
