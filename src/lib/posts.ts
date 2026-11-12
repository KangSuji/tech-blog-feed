import { cacheLife } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";

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

  const { data, error } = await supabasePublic
    .from("posts")
    .select("id, title, link, summary, published_at, blogs(name)")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(30)
    .overrideTypes<Post[], { merge: false }>(); // 체인 맨 끝

  if (error) throw new Error(`글 조회 실패: ${error.message}`);

  return data;
}
