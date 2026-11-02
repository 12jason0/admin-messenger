// 가짜 데이터: 나중에 이 파일 대신 API(서버)에서 받아오면 됩니다.

export type Status = "online" | "away" | "offline";
export type Team = "영업" | "물류" | "구매" | "마케팅" | "경영지원";
export type FileKind = "doc" | "image" | "design" | "sheet";

export type Person = {
  id: string;
  name: string;
  role: string;
  team: Team;
  hue: number; // 아바타 색
  status: Status;
  email: string;
  phone: string;
  bot?: boolean; // 재고봇처럼 사람이 아닌 계정
};

export type Attachment = { name: string; size: string; kind: FileKind };

export type Message = {
  id: string;
  authorId: string;
  time: string;
  text?: string;
  file?: Attachment;
  itemSku?: string; // 있으면 "재고 화면에서 보기" 버튼이 붙습니다
};

export type Conversation = {
  id: string;
  kind: "channel" | "dm";
  name: string; // 채널 이름 또는 상대 이름
  topic?: string;
  personId?: string; // DM 상대
  memberIds: string[];
  unread: number;
  muted?: boolean;
  messages: Message[];
};

export type SharedFile = Attachment & {
  id: string;
  ownerId: string;
  conversationId: string;
  when: string;
};

export const WORKSPACE = "노을상사";
export const ME = "me";
export const BOT = "stockbot";
export const STOCK_CHANNEL = "stock";

export const PEOPLE: Record<string, Person> = {
  me: { id: "me", name: "임지우", role: "운영 매니저", team: "경영지원", hue: 22, status: "online", email: "jiwoo@example.com", phone: "010-0000-0101" },
  seoyeon: { id: "seoyeon", name: "김서연", role: "영업 팀장", team: "영업", hue: 214, status: "online", email: "seoyeon@example.com", phone: "010-0000-0102" },
  sua: { id: "sua", name: "윤수아", role: "영업 담당", team: "영업", hue: 285, status: "online", email: "sua@example.com", phone: "010-0000-0103" },
  jihoon: { id: "jihoon", name: "박지훈", role: "물류 팀장", team: "물류", hue: 160, status: "online", email: "jihoon@example.com", phone: "010-0000-0104" },
  doyun: { id: "doyun", name: "이도윤", role: "물류 담당", team: "물류", hue: 250, status: "away", email: "doyun@example.com", phone: "010-0000-0105" },
  minji: { id: "minji", name: "최민지", role: "마케팅 매니저", team: "마케팅", hue: 335, status: "online", email: "minji@example.com", phone: "010-0000-0106" },
  haeun: { id: "haeun", name: "정하은", role: "구매 담당", team: "구매", hue: 32, status: "offline", email: "haeun@example.com", phone: "010-0000-0107" },
  yujin: { id: "yujin", name: "한유진", role: "인사·총무", team: "경영지원", hue: 190, status: "online", email: "yujin@example.com", phone: "010-0000-0108" },
  taekyung: { id: "taekyung", name: "오태경", role: "대표", team: "경영지원", hue: 48, status: "away", email: "taekyung@example.com", phone: "010-0000-0109" },
};

// 메시지 작성자로만 쓰입니다. PEOPLE에 넣지 않아서 팀원 목록에는 나오지 않습니다.
export const STOCK_BOT: Person = { id: BOT, name: "재고봇", role: "재고 알림", team: "물류", hue: 200, status: "online", email: "", phone: "", bot: true };

export const TEAMS: Team[] = ["영업", "물류", "구매", "마케팅", "경영지원"];

const ALL = Object.keys(PEOPLE);

export const lowStockText = (name: string, sku: string, stock: number, safety: number) =>
  `[재고 부족] ${name}(${sku}) 남은 수량 ${stock}개 / 안전재고 ${safety}개`;

export const CONVERSATIONS: Conversation[] = [
  {
    id: "notice",
    kind: "channel",
    name: "공지사항",
    topic: "회사 공지는 여기에만 올려요",
    memberIds: ALL,
    unread: 1,
    messages: [
      { id: "n1", authorId: "taekyung", time: "어제 오후 5:40", text: "11월 전사 회의는 6일(금) 오후 4시, 3층 회의실에서 해요." },
      { id: "n2", authorId: "yujin", time: "오전 8:52", text: "이번 주부터 금요일은 오후 5시 퇴근이에요. 모두 참고해 주세요." },
    ],
  },
  {
    id: "sales",
    kind: "channel",
    name: "영업",
    topic: "거래처 미팅과 수주 현황",
    memberIds: ["seoyeon", "sua", "minji", "taekyung", "me"],
    unread: 0,
    messages: [
      { id: "s1", authorId: "seoyeon", time: "오전 9:12", text: "연말 사무용품 묶음 견적 초안 올렸어요. 단가 한 번 봐주세요." },
      { id: "s2", authorId: "seoyeon", time: "오전 9:12", file: { name: "연말_묶음_견적서_v3.xlsx", size: "84KB", kind: "sheet" } },
      { id: "s3", authorId: "sua", time: "오전 9:20", text: "자람터교육원에서 모니터 받침대 추가 문의가 왔어요." },
      { id: "s4", authorId: "taekyung", time: "오전 9:26", text: "대량 건은 납기부터 물류팀과 맞춰 보고 답변 주세요." },
      { id: "s5", authorId: "me", time: "오전 9:34", text: "네, 오후 2시 회의 때 같이 볼게요." },
    ],
  },
  {
    id: "logistics",
    kind: "channel",
    name: "물류",
    topic: "입출고 일정과 배송 이슈",
    memberIds: ["jihoon", "doyun", "haeun", "me"],
    unread: 3,
    messages: [
      { id: "v1", authorId: "doyun", time: "오전 10:05", text: "오전 출고분 상차 끝났어요." },
      { id: "v2", authorId: "jihoon", time: "오전 10:08", text: "수고했어요. 오후 입고 차량은 몇 시 도착이에요?" },
      { id: "v3", authorId: "doyun", time: "오전 10:09", text: "3시쯤이요. 케이블류가 주로 들어와요." },
    ],
  },
  {
    id: STOCK_CHANNEL,
    kind: "channel",
    name: "재고알림",
    topic: "안전재고 아래로 내려간 품목을 재고봇이 알려줘요",
    memberIds: ["jihoon", "doyun", "haeun", "me"],
    unread: 2,
    messages: [
      { id: "k1", authorId: BOT, time: "오후 4:32", text: lowStockText("USB-C 충전 케이블 1m", "SKU-1035", 3, 30), itemSku: "SKU-1035" },
      { id: "k2", authorId: BOT, time: "오후 4:32", text: lowStockText("복합기 토너 검정", "SKU-1031", 6, 12), itemSku: "SKU-1031" },
    ],
  },
  {
    id: "random",
    kind: "channel",
    name: "잡담",
    topic: "점심 메뉴부터 아무 얘기나",
    memberIds: ALL,
    unread: 0,
    messages: [
      { id: "r1", authorId: "yujin", time: "오전 11:40", text: "오늘 점심 김치찌개 어때요?" },
      { id: "r2", authorId: "sua", time: "오전 11:41", text: "좋아요! 12시에 1층에서 봬요." },
    ],
  },
  {
    id: "dm-seoyeon",
    kind: "dm",
    name: "김서연",
    personId: "seoyeon",
    memberIds: ["seoyeon", "me"],
    unread: 0,
    messages: [
      { id: "a1", authorId: "seoyeon", time: "오전 9:40", text: "2시 회의 전에 5분만 먼저 얘기할 수 있을까요?" },
      { id: "a2", authorId: "me", time: "오전 9:41", text: "네, 1시 50분에 볼게요." },
    ],
  },
  {
    id: "dm-jihoon",
    kind: "dm",
    name: "박지훈",
    personId: "jihoon",
    memberIds: ["jihoon", "me"],
    unread: 2,
    messages: [
      { id: "b1", authorId: "jihoon", time: "오전 10:30", text: "철제 책장이 품절이라 입고 일정 확인이 필요해요." },
      { id: "b2", authorId: "jihoon", time: "오전 10:31", text: "구매팀에 먼저 물어보고 다시 말씀드릴게요." },
    ],
  },
  {
    id: "dm-minji",
    kind: "dm",
    name: "최민지",
    personId: "minji",
    memberIds: ["minji", "me"],
    unread: 0,
    messages: [
      { id: "c1", authorId: "minji", time: "어제 오후 6:02", text: "연말 카탈로그 표지 시안 올려둘게요." },
      { id: "c2", authorId: "minji", time: "어제 오후 6:03", file: { name: "연말_카탈로그_표지.png", size: "2.1MB", kind: "image" } },
    ],
  },
  {
    id: "dm-taekyung",
    kind: "dm",
    name: "오태경",
    personId: "taekyung",
    memberIds: ["taekyung", "me"],
    unread: 0,
    messages: [{ id: "e1", authorId: "taekyung", time: "월요일", text: "수고했어요. 금요일에 결과 공유해 줘요." }],
  },
];

export const FILES: SharedFile[] = [
  { id: "f1", name: "연말_묶음_견적서_v3.xlsx", kind: "sheet", size: "84KB", ownerId: "seoyeon", conversationId: "sales", when: "오늘" },
  { id: "f2", name: "11월_입고_일정표.xlsx", kind: "sheet", size: "48KB", ownerId: "doyun", conversationId: "logistics", when: "어제" },
  { id: "f3", name: "연말_카탈로그_표지.png", kind: "image", size: "2.1MB", ownerId: "minji", conversationId: "dm-minji", when: "어제" },
  { id: "f4", name: "11월_전사회의_안건.pdf", kind: "doc", size: "380KB", ownerId: "taekyung", conversationId: "notice", when: "어제" },
  { id: "f5", name: "출고_작업_매뉴얼.pdf", kind: "doc", size: "1.2MB", ownerId: "jihoon", conversationId: "logistics", when: "오늘" },
  { id: "f6", name: "4분기_판촉물_시안.fig", kind: "design", size: "8.4MB", ownerId: "minji", conversationId: "sales", when: "3일 전" },
  { id: "f7", name: "거래처_단가표_4분기.xlsx", kind: "sheet", size: "96KB", ownerId: "sua", conversationId: "sales", when: "4일 전" },
  { id: "f8", name: "창고_배치도.png", kind: "image", size: "1.3MB", ownerId: "yujin", conversationId: "notice", when: "지난주" },
];

// 상대가 자동으로 답장하는 흉내 (서버 붙이면 지우면 됨)
export const AUTO_REPLIES = [
  "확인했어요!",
  "좋아요, 그렇게 해요.",
  "잠시만요, 보고 다시 말씀드릴게요.",
  "넵 알겠습니다.",
  "오 좋네요. 바로 반영해 볼게요.",
];

export type Notice = { id: string; text: string; time: string; conversationId: string; unread: boolean };

export const NOTICES: Notice[] = [
  { id: "t1", text: "[재고 부족] USB-C 충전 케이블 1m 외 1건", time: "오후 4:32", conversationId: STOCK_CHANNEL, unread: true },
  { id: "t2", text: "#물류에 새 메시지 3개", time: "오전 10:09", conversationId: "logistics", unread: true },
  { id: "t3", text: "#공지사항: 금요일 퇴근 시간 안내", time: "오전 8:52", conversationId: "notice", unread: false },
];
