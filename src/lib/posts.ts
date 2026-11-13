import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";

// 수집 후 이 태그로 글 목록 캐시를 무효화한다 (api/collect)
export const POSTS_CACHE_TAG = "posts";

export type Post = {
  id: string;
  title: string;
  link: string;
  summary: string | null;
  published_at: string | null;
  blogs: { name: string } | null;
};

export async function getLatestPosts(): Promise<Post[]> {
  "use cache";
  // 캐시 유지 기간
  cacheLife("hours");
  cacheTag(POSTS_CACHE_TAG);

  const { data, error } = await supabasePublic
    .from("posts")
    .select("id, title, link, summary, published_at, blogs(name)")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(30)
    .overrideTypes<Post[], { merge: false }>(); // 체인 맨 끝

  if (error) throw new Error(`글 조회 실패: ${error.message}`);

  return data;
}
