import type { Variants } from "motion/react";

// 화면(뷰) 전체: 자식 패널들을 순서대로 띄우기만 하고, 자기 자신은 투명도·필터를 바꾸지 않습니다.
// 부모에 opacity나 filter를 걸면 안쪽 유리 패널의 블러가 꺼지기 때문이에요.
export const viewVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.018, staggerDirection: -1 } },
};

// 패널 하나하나: 블러 속에서 선명해지며 떠오르기 (영상 속 효과)
export const panelVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(14px)", y: 16, scale: 0.985 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
    // blur(0px)도 필터라서, 남아 있으면 안쪽 유리 버튼의 블러가 꺼집니다.
    transitionEnd: { filter: "none" },
  },
  exit: {
    opacity: 0,
    filter: "blur(12px)",
    scale: 0.985,
    transition: { duration: 0.17, ease: "easeIn" },
  },
};
