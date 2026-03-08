#!/usr/bin/env bash
set -euo pipefail

# Rename useZ* hooks and UseZ* interfaces to use*/Use*
# Run from the project root: bash scripts/rename-hooks.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Renaming files (git mv)..."
git mv src/react/useZForm.ts           src/react/useForm.ts
git mv src/react/useZField.ts          src/react/useField.ts
git mv src/react/useZFieldArray.ts     src/react/useFieldArray.ts
git mv src/react/useZFieldValidation.ts src/react/useFieldValidation.ts

# All files that may contain references
FILES=(
  src/react/index.ts
  src/react/types.ts
  src/react/useForm.ts
  src/react/useField.ts
  src/react/useFieldArray.ts
  src/react/useFieldValidation.ts
  src/react/context.ts
  README.md
  demo/src/App.tsx
  demo/src/components/TextField.tsx
  demo/src/components/AsyncTextField.tsx
  demo/src/components/EntitySelect.tsx
  demo/src/examples/NestedArrayExample.tsx
)

# Substitutions ordered longest-first to avoid partial matches
SUBS=(
  "useZFieldValidation:useFieldValidation"
  "useZFieldArray:useFieldArray"
  "useZField:useField"
  "useZForm:useForm"
  "UseZFieldArrayReturn:UseFieldArrayReturn"
  "UseZFieldReturn:UseFieldReturn"
  "UseZFieldOptions:UseFieldOptions"
  "UseZFormConfig:UseFormConfig"
)

echo "==> Replacing identifiers in files..."
for file in "${FILES[@]}"; do
  [ -f "$file" ] || continue
  for sub in "${SUBS[@]}"; do
    old="${sub%%:*}"
    new="${sub##*:}"
    sed -i '' "s/${old}/${new}/g" "$file"
  done
done

echo "==> Done. Run 'npx tsc --noEmit && npm run build' to verify."
