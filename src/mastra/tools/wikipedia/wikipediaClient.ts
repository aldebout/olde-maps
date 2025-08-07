// Wikipedia API client for Mastra tools

interface SearchContent {
  pageid: number;
  title: string;
  size: number;
  snippet: string;
  titlesnippet: string;
  index: number;
}

export async function searchWikipedia(
  query: string,
  limit: number = 5,
  language: string = "en"
) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);

  // base params
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("redirects", "resolve");

  // search
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrlimit", limit.toString());
  url.searchParams.set("gsrprop", "size|snippet|titles");

  // summary
  url.searchParams.set("prop", "extracts");
  url.searchParams.set("explaintext", "true");
  url.searchParams.set("exintro", "true");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "mastra-olde-maps-template/1.0",
    },
  });
  if (!res.ok) throw new Error(`Failed to search Wikipedia: ${res.status}`);
  const data = (await res.json()) as
    | QueryResponse<SearchContent & PageSummaryContent>
    | {};

  if (!isQueryResponse(data)) {
    return [];
  }
  if (!data?.query?.pages) {
    return [];
  }
  const results = Object.values(data.query.pages ?? {}).sort(
    (a, b) => a.index - b.index
  );

  return results;
}

interface PageSummaryContent {
  extract: string;
}

interface PageSizeContent {
  revisions: { size: number }[];
}

interface QueryResponse<T> {
  query: {
    pages?: {
      [key: string]: { title: string; pageid: string } & T;
    };
  };
}

const isQueryResponse = <T = unknown>(
  data: QueryResponse<T> | {}
): data is QueryResponse<T> => {
  return (
    typeof data === "object" &&
    data !== null &&
    "query" in data &&
    "pages" in (data as any).query
  );
};

const reindexByTitle = <T>(data: QueryResponse<T>) => {
  return Object.values(data.query.pages ?? {}).reduce(
    (acc, page) => {
      acc[page.title] = page;
      return acc;
    },
    {} as Record<string, { title: string; pageid: string } & T>
  );
};

export async function fetchPageSummariesAndSizes(
  titles: string[],
  language: string
) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);

  // base params
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("redirects", "resolve");

  // titles
  url.searchParams.set("titles", titles.join("|"));

  // get both summary and size
  url.searchParams.set("prop", "extracts|revisions");

  // summary params
  url.searchParams.set("explaintext", "true");
  url.searchParams.set("exintro", "true");

  // size params
  url.searchParams.set("rvprop", "size");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "mastra-olde-maps-template/1.0",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch page summary: ${res.status}`);
  const data = (await res.json()) as QueryResponse<
    PageSummaryContent & PageSizeContent
  >;

  return reindexByTitle(data);
}

interface PageContent {
  extract: string;
}

interface PageResult {
  query: {
    pages: {
      [key: string]: { title: string; pageid: string } & PageContent;
    };
  };
}

export async function getPage({
  title,
  language = "en",
  isSummary = false,
}: {
  title: string;
  language: string;
  isSummary: boolean;
}) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "extracts");
  url.searchParams.set("titles", title);
  url.searchParams.set("format", "json");
  url.searchParams.set("explaintext", "true");
  url.searchParams.set("disabletoc", "true");
  if (isSummary) {
    url.searchParams.set("exintro", "true");
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent": "mastra-olde-maps-template/1.0",
    },
  });
  if (res.status === 404) throw new Error(`Page not found: ${title}`);
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
  const data = (await res.json()) as QueryResponse<PageContent>;
  const page = Object.values(data.query.pages ?? {})[0];
  return {
    title: page.title,
    content: page.extract,
  };
}

interface ParseResponse<T> {
  parse: {
    title: string;
    pageid: number;
  } & T;
}

interface SectionContent {
  sections: {
    toclevel: number;
    level: string;
    line: string;
    number: string;
    index: string;
    fromtitle: string;
    byteoffset: number;
    anchor: string;
    linkAnchor: string;
  }[];
}

export async function getSections({
  title,
  language = "en",
}: {
  title: string;
  language?: string;
}) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("format", "json");
  url.searchParams.set("disabletoc", "true");
  url.searchParams.set("prop", "sections");
  const res = await fetch(url, {
    headers: {
      "User-Agent": "mastra-olde-maps-template/1.0",
    },
  });
  if (res.status === 404) throw new Error(`Sections not found: ${title}`);
  if (!res.ok) throw new Error(`Failed to fetch sections for ${title}`);

  const data = (await res.json()) as ParseResponse<SectionContent>;

  return data.parse.sections.map((section) => ({
    title: section.line,
    index: section.index,
  }));
}

interface WikitextContent {
  wikitext: {
    "*": string;
  };
}

export async function getSectionContent({
  title,
  sectionId,
  language = "en",
}: {
  title: string;
  sectionId: number;
  language?: string;
}) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("format", "json");
  url.searchParams.set("disabletoc", "true");
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("section", sectionId.toString());
  const res = await fetch(url, {
    headers: {
      "User-Agent": "mastra-olde-maps-template/1.0",
    },
  });
  if (res.status === 404) throw new Error(`Links not found: ${title}`);
  if (!res.ok) throw new Error(`Failed to fetch links for ${title}`);
  const data = (await res.json()) as ParseResponse<WikitextContent>;
  return { content: data.parse.wikitext["*"] };
}
