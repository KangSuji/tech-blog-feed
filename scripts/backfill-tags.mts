import { createClient } from "@supabase/supabase-js";
import { getTags } from "../src/lib/tags.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error(
    "Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY)가 없습니다.",
  );
}

const client = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await client.from("posts").select("id, title, tags");

if (error) throw new Error(`태그 조회 실패: ${error.message}`);

const changes = data
  .map(({ id, title, tags }) => {
    return { id, title, tags, next: getTags(title) };
  })
  .filter(({ tags, next }) => tags.join(",") !== next.join(","));

const apply = process.argv.includes("--apply");
if (apply) {
  for (let i = 0; i < changes.length; i += 20) {
    const chunk = changes.slice(i, i + 20);
    await Promise.all(
      chunk.map((change) =>
        client.from("posts").update({ tags: change.next }).eq("id", change.id),
      ),
    );
  }
}
