import { demoNow } from "./admin-data";
import type { FileKind } from "./data";

/** 데모 시계의 지금 시각을 "오후 3:05" 형태로 */
export function nowLabel() {
  return new Date(demoNow()).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

/** 목록에 보여줄 짧은 시간: "어제 오후 5:40" → "어제" */
export function shortTime(time: string) {
  return time.startsWith("어제") ? "어제" : time;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function guessKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "heic", "svg"].includes(ext)) return "image";
  if (["fig", "sketch", "xd", "psd", "ai"].includes(ext)) return "design";
  if (["xls", "xlsx", "csv", "numbers"].includes(ext)) return "sheet";
  return "doc";
}
