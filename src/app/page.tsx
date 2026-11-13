import { getLatestPosts } from "@/lib/posts";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});
export default async function Home() {
  const posts = await getLatestPosts();

  if (posts.length === 0) {
    return (
      <main className="mx-auto max-w-2xl p-4">아직 수집된 글이 없습니다.</main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <ul className="space-y-6">
        {posts.map((post) => {
          return (
            <li key={post.id}>
              <div className="text-sm text-gray-950">
                <a
                  href={post.link}
                  rel="noopener"
                  target="_blank"
                  className="font-semibold"
                >
                  {post.title}
                </a>

                <p className="text-sm text-gray-500">
                  {post.blogs?.name ?? ""} {" · "}
                  {post.published_at && (
                    <time dateTime={post.published_at}>
                      {dateFormatter.format(new Date(post.published_at))}
                    </time>
                  )}
                </p>
              </div>
              {post.summary && <p className="text-sm">{post.summary}</p>}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
