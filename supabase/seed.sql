insert into public.blogs (name, site_url, feed_url)
values
  ('토스', 'https://toss.tech', 'https://toss.tech/rss.xml'),
  ('올리브영', 'https://oliveyoung.tech/', 'https://oliveyoung.tech/rss.xml'),
  ('잡코리아', 'https://techblog.jobkorea.co.kr/all?topic=tech', 'https://techblog.jobkorea.co.kr/feed'),
  ('백팩커스', 'https://medium.com/idus-tech', 'https://medium.com/feed/idus-tech'),
  ('우아한 형제들', 'https://techblog.woowahan.com/', 'https://techblog.woowahan.com/feed/'),
  ('마켓 컬리', 'https://helloworld.kurly.com/', 'https://helloworld.kurly.com/rss.xml'),
  ('무신사', 'https://techblog.musinsa.com/', 'https://techblog.musinsa.com/feed'),
  ('리디', 'https://ridicorp.com/story-category/tech-blog/', 'https://ridicorp.com/story-category/tech-blog/feed/'),
  ('뱅크샐러드', 'https://blog.banksalad.com/tech/', 'https://blog.banksalad.com/rss.xml'),
  ('에이블리', 'https://brunch.co.kr/@ably-team', 'https://brunch.co.kr/rss/@@fqtR'),
  ('삼쩜삼', 'https://blog.3o3.co.kr/tag/tech/', 'https://blog.3o3.co.kr/tag/tech/rss/')  
on conflict (feed_url) do nothing;


update blogs set feed_url = 'https://corp.banksalad.com/blog/rss.xml'
where name = '뱅크샐러드';


