import type { Page } from "../pages";

const REPO_RAW_BASE = "https://raw.githubusercontent.com/Mallen220/PedroPathingPlusDocumentation/main/src/content/docs";

export interface DocPage {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  category: string;
}

function mapUrlToDocPage(loc: string): DocPage | null {
  const url = new URL(loc);
  let pathname = url.pathname.replace(/\/$/, ""); // remove trailing slash
  if (pathname === "") return null; // root

  const parts = pathname.split("/").filter(Boolean);
  const category = parts[0];
  const slug = parts.length > 1 ? parts[parts.length - 1] : "index";
  const titleSlug = parts.length > 1 ? parts[parts.length - 1] : parts[0];

  const title = titleSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  let icon = "document";
  let desc = `Online Docs: ${title}`;
  if (category === "pedro-pathing-plus-visualizer") icon = "sparkles";
  else if (category === "pedro-pathing-plus") icon = "code";
  else if (category === "reference") icon = "book";
  else if (category === "guides") icon = "map";

  let githubPath = pathname;
  if (parts.length === 1) {
    githubPath = `/${pathname}/index`;
  }

  return {
    id: `online-${category}-${slug}`,
    title: title,
    description: desc,
    icon: icon,
    url: `${REPO_RAW_BASE}${githubPath}.mdx`,
    category: category,
  };
}

export async function fetchOnlineDocsCache(): Promise<Page[]> {
  try {
    const cachedData = await (window as any).electronAPI.readDocsCache();
    if (cachedData) {
      return JSON.parse(cachedData) as Page[];
    }
  } catch (err) {
    console.error("Error reading docs cache:", err);
  }
  return [];
}

export async function fetchOnlineDocContent(doc: DocPage): Promise<string> {
  try {
    const res = await fetch(doc.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${doc.url}: ${res.statusText}`);
    }
    const text = await res.text();
    // Strip frontmatter from MDX
    const cleaned = text.replace(/^---\n[\s\S]*?\n---\n/, '');
    return cleaned;
  } catch (err) {
    console.error("Error fetching doc content:", err);
    throw err;
  }
}

export async function fetchAllOnlineDocsAndCache(): Promise<Page[]> {
  const pages: Page[] = [];

  try {
    // 1. Fetch live sitemap for dynamic discovery
    const sitemapUrl = "https://pedropathingplus.com/sitemap-0.xml";
    const res = await fetch(sitemapUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch sitemap: ${res.statusText}`);
    }
    const text = await res.text();
    const matches = [...text.matchAll(/<loc>(.*?)<\/loc>/g)];
    const docs = matches.map(m => mapUrlToDocPage(m[1])).filter(Boolean) as DocPage[];

    // 2. Read existing cache to preserve already-downloaded content
    let existingCache: Page[] = [];
    try {
      const cachedData = await (window as any).electronAPI.readDocsCache();
      if (cachedData) {
        existingCache = JSON.parse(cachedData) as Page[];
      }
    } catch (e) {
      // Ignore cache read errors
    }
    const cacheMap = new Map(existingCache.map(p => [p.id, p]));

    // 3. Merge live sitemap with existing cache
    for (const doc of docs) {
      const cachedPage = cacheMap.get(doc.id);
      if (cachedPage && cachedPage.content !== "Loading...") {
        // Keep the already downloaded content
        pages.push(cachedPage);
      } else {
        // Placeholder for content we haven't fetched yet
        pages.push({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          icon: doc.icon,
          type: "page",
          content: "Loading...",
          url: doc.url
        });
      }
    }

    // 4. Write back the updated cache
    await (window as any).electronAPI.writeDocsCache(JSON.stringify(pages));

  } catch (err) {
    console.error("Error fetching or caching docs:", err);
  }

  return pages;
}
