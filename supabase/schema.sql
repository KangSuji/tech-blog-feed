create table public.blogs (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  site_url        text not null,
  feed_url        text not null unique,
  last_fetched_at timestamptz,
  last_error      text
);

create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  blog_id       uuid not null references public.blogs(id) on delete cascade,
  title         text not null,
  link          text  unique not null,
  summary       text,
  published_at  timestamptz,
  tags          text[] not null default '{}',
  click_count   int not null default 0,
  created_at    timestamptz not null default now()
);

create index posts_published_at_idx on public.posts (published_at desc nulls last);

alter table public.blogs enable row level security;

create policy "누구나 블로그 목록을 읽을 수 있음"
  on public.blogs for select
  to anon, authenticated
  using (true);

alter table public.posts enable row level security;

create policy "누구나 블로그 글을 읽을 수 있음"
  on public.posts for select
  to anon, authenticated
  using (true);