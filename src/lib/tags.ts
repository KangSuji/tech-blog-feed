/**
 * 글 제목의 키워드로 태그를 붙이는 규칙.
 *
 * - en: 영어 키워드. 앞뒤가 영문·숫자가 아닐 때만 일치한다 ("go"가 "Google"에 걸리지 않게).
 * - ko: 한국어 키워드. 조사가 바로 붙어 단어 경계를 나누기 어려워 포함 여부로 검사한다.
 *
 * 키워드는 수집된 글 510개의 제목을 보고 정함 (2026-11-13).
 * 넓은 단어는 오탐이 생겨 좁힘: "후기"(상품 후기 서비스) → "참가 후기",
 * "최적화"(배송·물류 최적화) → "이미지 최적화", "lambda"(Lambda Calculus) 제외.
 */
const TAG_RULES = {
  ai: {
    en: ["ai", "llm", "sllm", "rag", "mcp", "claude", "gemini", "gpt", "bedrock", "text2sql", "vibe coding", "ax", "agent"],
    ko: ["에이전트", "생성형", "바이브 코딩", "프롬프트", "클로드", "인공지능"],
  },
  ml: {
    en: ["ml", "mlops", "sagemaker", "machine learning", "embedding"],
    ko: ["머신러닝", "추천", "임베딩", "예측모델", "예측 모델", "객체 탐지", "탐지 시스템", "데이터사이언스", "데이터 사이언스", "언어 모델", "유사도"],
  },
  frontend: {
    en: ["frontend", "front-end", "fe", "react", "next.js", "nextjs", "typescript", "javascript", "webpack", "vite", "nx", "storybook", "msw", "useinfinitequery", "app router", "esm", "seo", "gatsby", "gatsbyjs", "iframe", "web worker", "css", "web", "graphql", "bff"],
    ko: ["프론트엔드", "타입스크립트", "자바스크립트", "마이크로프론트엔드", "모듈 페더레이션", "웹폰트", "스크롤", "드래그"],
  },
  backend: {
    en: ["spring", "java", "jpa", "go", "golang", "grpc", "php", "msa", "ddd", "webclient", "redisson", "kafka", "rabbitmq", "sqs", "msk", "eda", "outbox", "circuitbreaker", "pl/sql", "oauth2", "api", "batch", "modernization"],
    ko: ["백엔드", "마이크로서비스", "트랜잭션", "하이버네이트", "분산락", "카프카", "비동기", "동시성", "서버 개발", "레거시", "배치"],
  },
  mobile: {
    en: ["ios", "android", "swift", "reactorkit", "react native", "reactnative", "hilt", "koin", "docc", "stateflow", "kotlin"],
    ko: ["안드로이드", "스위프트", "모바일 앱", "하이브리드 앱", "네이티브"],
  },
  data: {
    en: ["bigquery", "spark", "airflow", "dataflow", "cdc", "debezium", "athena", "data engineer", "data", "quicksight"],
    ko: ["데이터 엔지니어", "데이터 파이프라인", "데이터 분석", "분석가", "시계열", "데이터를"],
  },
  database: {
    en: ["db", "database", "mysql", "postgresql", "mongodb", "redis", "dynamodb", "opensearch", "documentdb", "rdb", "rds", "sql"],
    ko: ["데이터베이스", "커넥션", "데드락"],
  },
  infra: {
    en: ["aws", "kubernetes", "terraform", "devops", "serverless", "docker", "cdn", "nginx", "ecr", "gpu", "ci", "cd", "github action", "github actions", "teamcity", "codebuild", "cloud", "edge functions", "efk"],
    ko: ["쿠버네티스", "서버리스", "도커", "배포", "클라우드", "클러스터", "스케일링", "망분리", "폐쇄망"],
  },
  test: {
    en: ["qa", "test", "tdd", "bdd", "testcontainers", "testfixture"],
    ko: ["테스트", "카오스 엔지니어링", "품질"],
  },
  performance: {
    en: ["performance", "c10k"],
    ko: ["성능", "이미지 최적화", "웹사이트 최적화", "속도", "경량화", "병목", "캐시", "대규모 트래픽", "트래픽"],
  },
  monitoring: {
    en: ["datadog", "monitoring", "on call", "incident"],
    ko: ["모니터링", "데이터독", "장애", "인시던트", "온콜", "에러로그", "에러 분석", "관제", "알람"],
  },
  design: {
    en: ["ux", "bx", "design", "figma"],
    ko: ["디자인", "디자이너", "아이콘", "피그마", "접근성"],
  },
  culture: {
    en: ["pm", "po", "re:invent", "dash", "conference", "pycon", "hackathon", "all hands", "pit stop"],
    ko: ["채용", "회고", "온보딩", "문화", "스크럼", "애자일", "주니어", "컨퍼런스", "콘퍼런스", "방문기", "참가 후기", "발표 후기", "의 하루", "무엇이든 물어보세요", "워크숍", "인턴", "입사", "면접", "성장기", "해커톤", "밋업", "안식휴가", "오피스 투어", "리더십", "팀 빌딩", "스터디", "웨비나", "취미", "과자", "협업", "일하는 방식", "일하는 법"],
  },
} satisfies Record<string, { en: string[]; ko: string[] }>;

export type Tag = keyof typeof TAG_RULES;

export const TAGS = Object.keys(TAG_RULES) as Tag[];

// 정규식 특수문자(. / : 등)를 글자 그대로 검사하도록 이스케이프
const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// 모듈을 처음 불러올 때 한 번만 정규식을 만든다
const compiledRules = TAGS.map((tag) => ({
  tag,
  en: TAG_RULES[tag].en.map(
    (word) => new RegExp(`(?<![a-z0-9])${escapeRegExp(word)}(?![a-z0-9])`, "i"),
  ),
  ko: TAG_RULES[tag].ko,
}));

/** 제목에 맞는 태그를 TAG_RULES에 적힌 순서대로 돌려준다. 없으면 빈 배열. */
export const getTags = (title: string): Tag[] =>
  compiledRules
    .filter(
      ({ en, ko }) =>
        en.some((pattern) => pattern.test(title)) ||
        ko.some((word) => title.includes(word)),
    )
    .map(({ tag }) => tag);
