import { Boxes, ClipboardList, Folder, LayoutDashboard, MessageCircle, Users, type LucideIcon } from "lucide-react";

export type View = "dashboard" | "orders" | "inventory" | "messages" | "members" | "files";

export const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "orders", label: "주문", icon: ClipboardList },
  { id: "inventory", label: "재고", icon: Boxes },
  { id: "messages", label: "메시지", icon: MessageCircle },
  { id: "members", label: "팀원", icon: Users },
  { id: "files", label: "파일", icon: Folder },
];
