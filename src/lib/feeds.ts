import { Item } from "rss-parser";
import { getTags } from "@/lib/tags";

export type FeedItem = Item & { "content:encodedSnippet"?: string };

export const toPostRow = (item: FeedItem, blogId: string) => {
  const title = item.title?.trim();
  const link = item.link?.trim();
  if (!title || !link) return null;

  return {
    blog_id: blogId,
    title,
    link,
    summary: getSummary(item),
    published_at: item.isoDate ?? null,
    tags: getTags(title),
  };
};

const getSummary = (item: FeedItem) => {
  let summary = item.contentSnippet || item["content:encodedSnippet"];

  summary = summary?.replace(/\s+/g, " ").trim();

  if (!summary || summary === "…") return null;
  if (summary.length > 150) summary = `${summary.slice(0, 150)}…`;

  return summary;
};
