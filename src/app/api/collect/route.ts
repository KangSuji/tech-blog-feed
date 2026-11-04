import { supabaseAdmin } from "@/lib/supabase/admin";
import { toPostRow } from "@/lib/feeds";
import Parser from "rss-parser";

//_는 숫자를 읽기 쉽게 끊어 주는 표기
const parser = new Parser({ timeout: 10_000 });

export async function GET() {
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
      continue;
    }

    const rows = result.value.items
      .map((item) => toPostRow(item, blog.id))
      .filter((row) => row !== null);

    // 1) rows가 비었으면 upsert 없이 inserted: 0
    if (rows.length < 1) {
      report.push({
        blog: blog.name,
        fetched: result.value.items.length,
        inserted: 0,
      });
      continue;
    }
    // 2) upsert (주석 코드 그대로, error 이름만 바꿔서)
    const { data, error: upsertError } = await supabaseAdmin
      .from("posts")
      .upsert(rows, { onConflict: "link", ignoreDuplicates: true })
      .select("id");
    // 3) upsertError 있으면 { blog, error } 추가
    if (upsertError) {
      report.push({ blog: blog.name, error: upsertError.message });
      continue;
    }
    // 없으면 { blog, fetched: items 수, inserted: data.length } 추가
    report.push({
      blog: blog.name,
      fetched: result.value.items.length,
      inserted: data.length,
    });
  }

  return Response.json(report);
}
