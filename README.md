# Glass Messenger (화면 스타터)

유리(글래스) 느낌의 사내 메신저 **화면**입니다.
서버 없이 가짜 데이터로 돌아가서, 화면부터 보면서 고쳐갈 수 있어요.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 됩니다.

## 무엇을 바꾸려면 어디를 고치나

| 바꾸고 싶은 것 | 파일 |
| --- | --- |
| 유리 진하기, 블러, 테두리 빛 | `src/app/globals.css` 맨 위 `:root`의 숫자 |
| 배경 사진 | `public/bg/room-dusk.jpg`, `room-night.jpg`를 같은 이름으로 교체 |
| 화면 전환 효과 (블러 속에서 떠오르기) | `src/lib/motion.ts` |
| 메뉴 (메시지·팀원·파일) | `src/lib/nav.ts` |
| 사람, 채널, 메시지 데이터 | `src/lib/data.ts` |
| 메시지 보내기, 읽음 처리 | `src/components/MessengerApp.tsx`의 `send()`, `openConversation()` |

## 폴더 구조

```
src/
  app/
    globals.css          유리 재질(.glass) 정의
    layout.tsx           Pretendard 폰트
    page.tsx
  components/
    MessengerApp.tsx     앱 전체 상태 (지금 화면, 대화, 안 읽은 개수…)
    Environment.tsx      유리 뒤 배경 + 화면 바뀔 때 배경 흐림
    TopBar.tsx           상단 알약 메뉴, 알림, 내 상태
    Rail.tsx             왼쪽 세로 메뉴 (휴대폰에선 아래쪽)
    views/
      MessagesView.tsx   대화 목록 · 정보 패널
      ChatPanel.tsx      대화창 · 입력창
      MembersView.tsx    팀원
      FilesView.tsx      파일
    ui/                  아바타, 탭, 버튼
  lib/
    data.ts              가짜 데이터 (나중에 API로 교체)
    motion.ts            전환 애니메이션 값
    nav.ts               메뉴 목록
```

## 알아두면 좋은 것

- **유리 효과 = 반투명 배경 + `backdrop-filter: blur()` + 1px 밝은 테두리 + 그림자.** `.glass` 클래스 하나에 다 들어 있어요.
- **전환 애니메이션은 패널 하나하나에 걸려 있어요.** 패널을 감싼 부모에 `opacity`나 `filter`를 걸면 안쪽 유리 블러가 꺼집니다.
- **대화창은 `glass-strong`(더 진한 유리)** 을 써요. 하루 종일 글을 읽는 곳이라 글자 대비가 우선이에요.
- **블러는 무거워요.** 큰 패널에만 쓰고, 말풍선 같은 작은 요소엔 쓰지 않았어요.
- **한글 입력 중 Enter는 무시**하도록 처리돼 있어요 (`isComposing`). 안 하면 마지막 글자가 한 번 더 전송돼요.
- 배경 그림은 임시로 그린 거예요. 실제 서비스에선 직접 찍은 사진이나 상업적 사용이 허락된 사진으로 바꾸세요.

## 다음 단계

1. 로그인 + 워크스페이스(회사) 만들기 + 초대 링크
2. NestJS + Socket.io로 실시간 메시지: `send()` 안을 소켓 전송으로 교체
3. PostgreSQL(Prisma)에 저장: 읽음 표시는 `ChannelMember.lastReadMessageId` 하나로 계산
4. 파일은 S3 presigned URL로 브라우저에서 바로 업로드
