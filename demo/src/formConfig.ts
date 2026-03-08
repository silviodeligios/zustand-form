import type { FormResolver } from "zform";
import type { FormHook } from "zform/react";

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
  sections: [],
};

// ---------------------------------------------------------------------------
// Resolver: FormResolver interface — validates all fields at once
// ---------------------------------------------------------------------------

export const resolver: FormResolver<FormValues> = {
  validate(values: FormValues): Record<string, string | undefined> {
    const errors: Record<string, string | undefined> = {};

    if (!values.name?.trim()) errors.name = "Name required";
    if (!values.category) errors.category = "Category required";

    values.sections?.forEach((section, si) => {
      if (!section.title?.trim())
        errors[`sections.${si}.title`] = "Section title required";
      section.items?.forEach((item, ii) => {
        if (!item.label?.trim())
          errors[`sections.${si}.items.${ii}.label`] = "Label required";
      });
    });

    return errors;
  },
};

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
