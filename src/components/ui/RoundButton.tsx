import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>;

/** 동그란 유리 버튼 (상단 바 아이콘들) */
export function RoundButton({ label, children, className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`glass grid size-10 place-items-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
