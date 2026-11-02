type Option<T extends string> = { value: T; label: string; count?: number };

type Props<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  /** glass: 배경 위에 바로 놓일 때 / surface: 유리 패널 안에 놓일 때 */
  variant?: "glass" | "surface";
  disabled?: boolean;
};

/** 알약 모양 탭 (선택된 칸이 흰색) */
export function Segmented<T extends string>({ label, value, options, onChange, variant = "glass", disabled }: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`${variant === "glass" ? "glass" : "surface"} inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full p-1`}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap transition disabled:cursor-not-allowed ${
              on ? "bg-ink text-[#1b1a1f] shadow-[0_4px_12px_-4px_rgb(0_0_0/0.45)]" : "text-white/90 hover:bg-white/10 hover:text-white"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className="ml-1 tabular-nums opacity-70">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
