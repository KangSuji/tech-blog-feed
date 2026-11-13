# 기술 블로그 모아보기 서비스 (개인 프로젝트)

이 파일은 이 저장소에서 일하는 Claude가 프로젝트의 목적과 설계를 이해하기 위한 문서예요.
저장소 루트에 `CLAUDE.md`로 두면 Claude Code가 자동으로 읽어요.

## 1. 프로젝트 개요

여러 기술 블로그의 새 글을 RSS로 모아 한곳에서 보여주고, 태그로 걸러 보고, 나중에 읽을 글을 저장하는 웹 서비스.

### 이 프로젝트의 목적
- **React·Next.js 실무 역량 증명**: 개발자는 Vue 3 + TypeScript 4년차 프론트엔드 개발자이고, React·Next.js 포지션으로 이직하려고 함.
- **실사용자 반응을 보고 개선하는 경험**: 배포 후 데이터와 피드백으로 무엇을 고쳤는지 기록하는 것이 핵심 결과물. 기능 수보다 "작게 배포하고 자주 고치는 과정"이 더 중요함.

## 2. 설계 원칙

| 원칙 | 이유 | 반영 방법 |
| --- | --- | --- |
| 개발자 본인이 첫 사용자 | 사용자가 0명이어도 개선할 거리가 생김 | 매일 직접 쓰며 불편한 점을 GitHub Issue로 기록 |
| 로그인 없이 바로 사용 | 가입 단계가 있으면 첫 방문자가 이탈함 | 글 보기·검색은 비로그인, 북마크는 처음엔 localStorage |
| 검색 유입 | 홍보 없이도 방문자가 생김 | 태그·블로그 페이지를 서버에서 미리 생성, 메타태그·사이트맵 제공 |
| 작게 내고 자주 고치기 | 완성 후 배포하면 반응을 볼 시간이 없음 | 2주 안에 첫 배포, 이후 주 1회 개선 배포 |
| 프론트엔드에 집중 | 백엔드 서버를 직접 만들 여력이 없음 | 백엔드는 Supabase(DB·로그인·권한)에 맡김 |

## 3. 기술 스택

- **프레임워크**: Next.js (App Router), TypeScript
- **스타일**: Tailwind CSS
- **서버 상태**: TanStack Query (무한 스크롤, 검색 결과)
- **화면 상태**: 필터·검색어는 URL 쿼리 파라미터에 저장 (결과 화면을 링크로 공유 가능)
- **DB·로그인**: Supabase (PostgreSQL, GitHub 로그인만 지원)
- **RSS 파싱**: `rss-parser`
- **배포·예약 작업**: Vercel, Vercel Cron
- **분석**: PostHog (이벤트), Vercel Speed Insights (LCP, INP)

별도 백엔드 서버는 만들지 않는다. 서버 로직은 Next.js 서버 컴포넌트, Route Handler, Server Action 안에서 처리한다.

## 4. 구조

```
기술 블로그 RSS ──▶ 수집 작업 (Vercel Cron, 매일 09:00 KST) ──▶ Supabase DB
                                                               │ 글 조회
PostHog 분석 ◀── 브라우저 (TanStack Query) ◀── Next.js 서버 (ISR, Route Handler)
```

- **수집**: Vercel Cron이 매일 1회(UTC 0시 = 한국 시간 9시) 수집 Route Handler를 호출 → `blogs` 테이블의 피드를 순회 → `rss-parser`로 읽기 → 처음 보는 링크만 `posts`에 저장 → 제목 키워드 규칙으로 태그 부여. 실패한 피드는 기록해 두고 다음 회차에 재시도. 새 글이 있으면 `revalidateTag("posts")`로 목록 캐시를 무효화.
  - 하루 1회인 이유: Vercel Hobby(무료) 플랜의 Cron은 하루 1회까지만 실행됨. 더 자주 수집할 필요가 확인되면 GitHub Actions `schedule` 등으로 옮긴다.
- **렌더링**:
  - 메인·태그·블로그 목록 페이지: ISR (미리 생성, 1시간마다 재생성 + 수집 후 태그로 무효화) → 빠르고 검색엔진에 노출됨
  - 검색, 무한 스크롤 다음 페이지: Route Handler + TanStack Query
  - 북마크·읽음 표시: 클라이언트 컴포넌트, 처음엔 localStorage
- **저작권**: 본문 전체를 저장·표시하지 않는다. 제목, 요약, 작성일, 원문 링크만 사용하고 클릭 시 원문으로 이동한다.

## 5. 데이터 모델 (초안)

```
blogs
  id            uuid  PK
  name          text            -- 블로그 이름
  site_url      text
  feed_url      text  unique    -- RSS 피드 주소
  last_fetched_at timestamptz
  last_error    text  null      -- 마지막 수집 실패 사유

posts
  id            uuid  PK
  blog_id       uuid  FK → blogs.id
  title         text
  link          text  unique    -- 중복 판단 기준
  summary       text  null
  published_at  timestamptz
  tags          text[]          -- 예: ['react', 'performance']
  click_count   int   default 0 -- 인기 글 정렬용
  created_at    timestamptz

bookmarks   (로그인 기능 추가 후)
  user_id       uuid  FK → auth.users.id
  post_id       uuid  FK → posts.id
  read_at       timestamptz null
  created_at    timestamptz
  PK (user_id, post_id)
```

처음 블로그 목록(10~20곳)은 개발자가 직접 `blogs`에 넣는다 (Supabase 화면 또는 시드 파일).

## 6. 기능 범위

### 첫 배포 (MVP)
1. **피드 보기**: 최신순 글 목록 (제목, 블로그, 작성일, 요약), 무한 스크롤
2. **걸러 보기**: 태그·블로그 필터, 키워드 검색
3. **저장하기**: 북마크와 "읽음" 표시 (localStorage)
4. **원문 이동**: 클릭 시 원문으로 이동, 클릭 수 집계

### 배포 후 근거가 생기면 추가할 후보
- 주간 인기 글
- 관심 태그 구독, 이메일 다이제스트
- GitHub 로그인 후 북마크를 계정으로 옮기기
- "블로그 추천하기" 폼
- 블로그 주소만 넣으면 피드 주소를 자동으로 찾는 기능 (HTML head의 RSS link 태그 읽기)
- 다크모드, PWA 설치

후보 기능은 데이터나 피드백으로 필요성이 확인된 뒤에 만든다. 미리 만들지 않는다.

## 7. 측정과 피드백

- **PostHog 이벤트**: `search`, `filter_tag`, `filter_blog`, `bookmark_add`, `post_click`, 방문·7일 재방문
- **피드백 채널**: 화면 구석의 "의견 보내기" 버튼, 커뮤니티 공유 글의 댓글
- **개선 기록**: GitHub Issue에 "발견 → 가설 → 변경 → 결과" 순으로 작성하고, README에 개선 로그 표를 유지
- **리듬**: 주 1회 지표를 보고 가장 큰 불편 하나만 고친다

## 8. 할 일 (로드맵)

### 1주차: 뼈대 만들고 일단 배포
- [ ] 자주 읽는 기술 블로그 10~20곳을 고르고 피드 주소 확인
- [ ] Next.js(App Router) + TypeScript + Tailwind 프로젝트 시작
- [ ] Supabase 프로젝트 생성, `blogs`·`posts` 테이블 생성
- [ ] 블로그 목록을 `blogs`에 넣기
- [ ] `rss-parser`로 새 글만 `posts`에 저장하는 수집 코드 (같은 링크는 건너뛰기)
- [ ] 최신순 글 목록 페이지를 서버 컴포넌트로 만들기
- [ ] Vercel에 연결해 첫 배포 (화면이 엉성해도 배포 우선)

### 2주차: 핵심 흐름 완성
- [ ] Vercel Cron으로 매일 1회 수집 자동 실행 (Hobby 플랜 제약)
- [ ] 제목 키워드로 태그 붙이기, 태그·블로그 필터 (URL 쿼리에 저장)
- [ ] TanStack Query로 무한 스크롤
- [ ] 키워드 검색
- [ ] 북마크·읽음 표시를 localStorage에 저장
- [ ] 모바일 화면 점검
- [ ] PostHog 설치, 이벤트 심기
- [ ] "의견 보내기" 버튼
- [ ] README에 소개, 기술 선택 이유, 개선 로그 표

### 3주차부터: 써 보고 고치기
- [ ] 매일 직접 쓰며 불편한 점을 GitHub Issue로 기록
- [ ] 지인과 개발자 커뮤니티(GeekNews, 디스콰이엇, OKKY)에 공유
- [ ] 주 1회 지표·피드백 확인 → 가장 큰 불편 하나 개선
- [ ] 고친 내용을 README 개선 로그에 기록
- [ ] 개선 사례가 1~2개 쌓이면 이력서·포트폴리오에 반영

## 9. Claude에게 부탁하는 작업 방식

- **설명은 한국어로** 해 주세요.
- 개발자는 **Vue 3 (Composition API, Pinia) 경험자**예요. React 개념을 설명할 때 Vue와 비교해 주면 이해가 빨라요. (예: `ref`/`computed` ↔ `useState`/`useMemo`, Pinia ↔ TanStack Query + URL 상태)
- 코드를 대신 다 짜기보다, **왜 이렇게 하는지**를 함께 설명해 주세요. 면접에서 직접 설명해야 하는 프로젝트예요.
- 렌더링 방식(서버 컴포넌트, 클라이언트 컴포넌트, ISR)을 고를 때는 **선택 이유를 한두 줄로 남겨** 주세요. README와 면접 소재로 써요.
- **범위를 넓히지 마세요.** 위 MVP 밖의 기능은 제안만 하고, 만들기 전에 확인해 주세요.
- 백엔드 서버를 새로 만들지 말고 Supabase와 Next.js 서버 기능 안에서 해결해 주세요.
- 비밀 키(Supabase service role key 등)는 `.env.local`에 두고 커밋하지 않게 해 주세요.
