import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getPage, getSectionContent, getSections } from "./wikipediaClient";

export const getPageTool = createTool({
  id: "wikipedia_get_page",
  description:
    "Get the full content of a Wikipedia article by title. Should be used when size of page lower than 20000",
  inputSchema: z.object({
    title: z.string().min(1, "Title is required"),
    language: z.string().default("en"),
  }),
  outputSchema: z.object({
    title: z.string(),
    content: z.string(),
    pageId: z.number().optional(),
  }),
  execute: async ({ context }) => {
    return await getPage({
      title: context.title,
      language: context.language,
      isSummary: false,
    });
  },
});

export const getSectionsTool = createTool({
  id: "wikipedia_get_sections",
  description:
    "Get the sections of a Wikipedia article by title. Should be used when size of page higher than 20000, then use wikipedia_get_section_content",
  inputSchema: z.object({
    title: z.string().min(1, "Title is required"),
    language: z.string().default("en"),
  }),
  outputSchema: z.object({
    sections: z.array(
      z.object({
        title: z.string(),
        index: z.number(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const sections = await getSections({
      title: context.title,
      language: context.language,
    });
    return {
      sections: sections.map((section, index) => ({
        title: section.title,
        index,
      })),
    };
  },
});

export const getSectionContentTool = createTool({
  id: "wikipedia_get_section_content",
  description:
    "Get the content of a section of a Wikipedia article by title and section index.",
  inputSchema: z.object({
    title: z.string().min(1, "Title is required"),
    sectionIndex: z.number().min(0, "Section index is required"),
    language: z.string().default("en"),
  }),
  outputSchema: z.object({
    content: z.string(),
  }),
  execute: async ({ context }) => {
    const content = await getSectionContent({
      title: context.title,
      sectionId: context.sectionIndex,
      language: context.language,
    });
    return content;
  },
});
