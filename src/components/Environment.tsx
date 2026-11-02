"use client";

import { motion } from "motion/react";

export type Env = "day" | "night";

/** 18시~다음 날 6시는 밤, 나머지는 낮 (사용자 기기 시각 기준) */
export const envAt = (hour: number): Env => (hour >= 18 || hour < 6 ? "night" : "day");

/**
 * 유리 뒤에 깔리는 배경.
 * 화면이 바뀌는 순간(shifting) 배경 전체를 잠깐 흐리게 해서 "초점이 이동하는" 느낌을 냅니다.
 * 사진은 public/bg/room.jpg 한 장이고, 낮/밤은 어두운 막의 진하기(globals.css의 --scrim-*)로만 구분합니다.
 */
export default function Environment({ env, shifting }: { env: Env; shifting: boolean }) {
  return (
    <div aria-hidden="true" className="fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -inset-[3%]"
        animate={
          shifting
            ? { filter: "blur(18px) brightness(0.88)", scale: 1.04 }
            : { filter: "blur(0px) brightness(1)", scale: 1 }
        }
        transition={{ duration: shifting ? 0.25 : 0.65, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/bg/room.jpg)" }} />
      </motion.div>
      {/* 낮/밤 전환: 사진 전체를 덮는 막의 진하기만 바뀝니다 */}
      <div className="absolute inset-0 bg-black transition-opacity duration-1000" style={{ opacity: `var(--scrim-${env})` }} />
      {/* 위·아래를 어둡게: 상단 바와 하단 입력창 글자가 잘 보이도록 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(0 0 0 / var(--scrim-top)), rgb(0 0 0 / 0.05), rgb(0 0 0 / var(--scrim-bottom)))",
        }}
      />
    </div>
  );
}
