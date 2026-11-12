insert into public.blogs (name, site_url, feed_url)
values
  ('토스', 'https://toss.tech', 'https://toss.tech/rss.xml'),
  ('올리브영', 'https://oliveyoung.tech/', 'https://oliveyoung.tech/rss.xml'),
  ('잡코리아', 'https://techblog.jobkorea.co.kr/all?topic=tech', 'https://techblog.jobkorea.co.kr/feed'),
  ('백팩커스', 'https://medium.com/idus-tech', 'https://medium.com/feed/idus-tech'),
  ('마켓 컬리', 'https://helloworld.kurly.com/', 'https://helloworld.kurly.com/rss.xml'),
  ('무신사', 'https://techblog.musinsa.com/', 'https://techblog.musinsa.com/feed'),  
  ('뱅크샐러드', 'https://corp.banksalad.com/blog/', 'https://corp.banksalad.com/blog/rss.xml'),
  ('에이블리', 'https://brunch.co.kr/@ably-team', 'https://brunch.co.kr/rss/@@fqtR'),
  ('삼쩜삼', 'https://blog.3o3.co.kr/tag/tech/', 'https://blog.3o3.co.kr/tag/tech/rss/')  
on conflict (feed_url) do nothing;

