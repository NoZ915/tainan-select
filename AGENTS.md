# Repository Instructions

- Keep edits minimal and scoped to the user's request. Do not reorder imports, rename existing identifiers, rewrite whole files, or change surrounding style unless required for the requested change or necessary to fix a related error.
- Use Traditional Chinese only in user-facing copy, comments, explanations, and newly added text. Do not introduce mojibake or garbled text.
- For UI or visual style work, prefer referencing the project's previous style-focused branches and existing in-repo visual patterns before introducing a new direction.
- Prefer clear, semantic variable names over shortened or opaque names, especially when extracting display logic from JSX.
- When the user asks `幫我生 pr`, generate a PR description in Traditional Chinese using this fixed section order: `## 標題`, `---`, `## 摘要`, `---`, `## 背景／問題`, `---`, `## 變更內容`, `---`, `## 測試方式`, `---`, `## 備註`. Base the content on the current branch changes, keep it concise, and include concrete file names and verification steps when applicable.
