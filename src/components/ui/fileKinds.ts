import { FileSpreadsheet, FileText, ImageIcon, PenTool, type LucideIcon } from "lucide-react";
import type { FileKind } from "@/lib/data";

export const FILE_KIND: Record<FileKind, { label: string; hue: number; icon: LucideIcon }> = {
  doc: { label: "문서", hue: 214, icon: FileText },
  image: { label: "이미지", hue: 152, icon: ImageIcon },
  design: { label: "디자인", hue: 268, icon: PenTool },
  sheet: { label: "시트", hue: 38, icon: FileSpreadsheet },
};
