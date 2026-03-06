import type { FormHook, FormResolver } from "zform";

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

export interface FormValues extends Record<string, unknown> {
  name: string;
  email: string;
  category: Category | null;
  sections: Section[];
}

export const defaultValues: FormValues = {
  name: "",
  email: "",
  category: null,
  sections: [
    {
      title: "First section",
      items: [
        { label: "Item A" },
        { label: "Item B" },
      ],
    },
    {
      title: "Second section",
      items: [
        { label: "" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Resolver: FormResolver interface — validates one field at a time
// ---------------------------------------------------------------------------

export const resolver: FormResolver<FormValues> = {
  validateField(path: string, values: FormValues): string | undefined {
    if (path === "name" && !values.name?.trim()) return "Name required";
    if (path === "email" && !values.email?.trim()) return "Email required";
    if (path === "category" && !values.category) return "Category required";

    const sectionTitleMatch = path.match(/^sections\.(\d+)\.title$/);
    if (sectionTitleMatch) {
      const si = Number(sectionTitleMatch[1]);
      if (!values.sections?.[si]?.title?.trim()) return "Section title required";
    }

    const itemLabelMatch = path.match(/^sections\.(\d+)\.items\.(\d+)\.label$/);
    if (itemLabelMatch) {
      const si = Number(itemLabelMatch[1]);
      const ii = Number(itemLabelMatch[2]);
      if (!values.sections?.[si]?.items?.[ii]?.label?.trim()) return "Label required";
    }

    return undefined;
  },
};

// ---------------------------------------------------------------------------
// Field-level validators
// ---------------------------------------------------------------------------

export const validateEmailSync = (value: unknown): string | undefined => {
  if (!value) return;
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

export type FormStore = FormHook<FormValues>;
