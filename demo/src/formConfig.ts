import { standardSchemaResolver } from "zform";
import type { FormHook } from "zform/react";
import { z } from "zod";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export { sleep };

// ---------------------------------------------------------------------------
// Form values
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "cat-1", name: "Work", color: "#3b82f6" },
  { id: "cat-2", name: "Personal", color: "#22c55e" },
  { id: "cat-3", name: "Urgent", color: "#ef4444" },
  { id: "cat-4", name: "Archive", color: "#a855f7" },
];

export interface SectionItem {
  label: string;
}

export interface Section {
  title: string;
  items: SectionItem[];
}

export interface MetaTag {
  label: string;
  value: string;
}

export interface MetaSection {
  heading: string;
  tags: MetaTag[];
}

export interface Meta {
  title: string;
  enabled: boolean;
  sections: MetaSection[];
}

export interface FormValues extends Record<string, unknown> {
  name: string;
  email: string;
  category: Category | null;
  sections: Section[];
  meta: Meta;
}

export const defaultValues: FormValues = {
  name: "",
  email: "",
  category: null,
  sections: [],
  meta: {
    title: "",
    enabled: false,
    sections: [],
  },
};

// ---------------------------------------------------------------------------
// Resolver: Zod schema via Standard Schema protocol
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string(),
  category: z.object({ id: z.string(), name: z.string(), color: z.string() }, { error: "Category required" }),
  sections: z.array(
    z.object({
      title: z.string().min(1, "Section title required"),
      items: z.array(
        z.object({
          label: z.string().min(1, "Label required"),
        }),
      ),
    }),
  ),
  meta: z.object({
    title: z.string(),
    enabled: z.boolean(),
    sections: z.array(
      z.object({
        heading: z.string(),
        tags: z.array(z.object({ label: z.string(), value: z.string() })),
      }),
    ),
  }),
});

export const resolver = standardSchemaResolver<FormValues>(formSchema);

// ---------------------------------------------------------------------------
// Field-level validators
// ---------------------------------------------------------------------------

export const validateEmailSync = (value: unknown): string | undefined => {
  if (!value) return "Email required";
  if (typeof value !== "string") return "Email must be a string";
  if (!value.includes("@")) return "Email must contain @";
  return undefined;
};

export const checkEmailAvailability = async (email: string): Promise<string | undefined> => {
  await sleep(1500);
  if (email === "taken@example.com") return "Email already taken";
  return undefined;
};

export const checkSectionTitleUniqueness = async (title: string): Promise<string | undefined> => {
  await sleep(1000);
  if (title.toLowerCase() === "duplicate") return "A section with this title already exists";
  return undefined;
};

export const checkLabelUniqueness = async (label: string): Promise<string | undefined> => {
  await sleep(1200);
  if (label.toLowerCase() === "duplicate") return "This label already exists on the server";
  return undefined;
};

export const validateSectionsMinLength = (value: unknown): string | undefined => {
  if (!Array.isArray(value) || value.length < 1) return "At least 1 section required";
  return undefined;
};

export const checkSectionsMaxLength = async (value: unknown): Promise<string | undefined> => {
  // Only run async when sync passes (length > 1)
  if (!Array.isArray(value) || value.length < 1) return undefined;
  await sleep(1500);
  if (value.length > 3) return "Max 3 sections allowed (server)";
  return undefined;
};

export type FormStore = FormHook<FormValues>;
