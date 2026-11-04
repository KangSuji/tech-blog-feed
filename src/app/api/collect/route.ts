import { supabaseAdmin } from "@/lib/supabase/admin";
import { toPostRow } from "@/lib/feeds";
import Parser from "rss-parser";

//_는 숫자를 읽기 쉽게 끊어 주는 표기
const parser = new Parser({ timeout: 10_000 });

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET이 설정되지 않았습니다");
    return Response.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: blogs, error } = await supabaseAdmin
    .from("blogs")
    .select("id, name, feed_url")
    .order("name");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  //	Promise.allSettled: 각자 독립적인 작업
  const results = await Promise.allSettled(
    blogs.map((blog) => parser.parseURL(blog.feed_url)),
  );

  const report = [];

  for (const [index, result] of results.entries()) {
    const blog = blogs[index];

    if (result.status === "rejected") {
      report.push({ blog: blog.name, error: String(result.reason) });
      await updateBlog(blog.id, String(result.reason));
      continue;
    }

    const rows = result.value.items
      .map((item) => toPostRow(item, blog.id))
      .filter((row) => row !== null);

    if (rows.length < 1) {
      report.push({
        blog: blog.name,
        fetched: result.value.items.length,
        inserted: 0,
      });
      await updateBlog(blog.id, null);

      continue;
    }

    const { data, error: upsertError } = await supabaseAdmin
      .from("posts")
      .upsert(rows, { onConflict: "link", ignoreDuplicates: true })
      .select("id");

    if (upsertError) {
      report.push({ blog: blog.name, error: upsertError.message });
      await updateBlog(blog.id, upsertError.message);

      continue;
    }

    report.push({
      blog: blog.name,
      fetched: result.value.items.length,
      inserted: data.length,
    });
    await updateBlog(blog.id, null);
  }

  return Response.json(report);
}

/**
 * Blog 업데이트
 * @param {string} id
 * @param {string | null} errorMsg
 */
const updateBlog = async (id: string, errorMsg: string | null) => {
  const values =
    errorMsg === null
      ? { last_fetched_at: new Date().toISOString(), last_error: null }
      : { last_error: errorMsg };

  const { error } = await supabaseAdmin
    .from("blogs")
    .update(values)
    .eq("id", id);

  if (error) console.error(`blogs 업데이트 실패 (${id}):`, error.message);
};
