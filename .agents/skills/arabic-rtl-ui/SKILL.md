---
name: arabic-rtl-ui
description: Build or review React/Tailwind UI for Arabic RTL and English LTR with accessible contrast. Use for any change in src/pages or src/components.
---
- Text comes from src/lib/translations.ts (both ar and en). Never hardcode visible strings. Follow docs/UI_TERMINOLOGY.md.
- Use logical Tailwind classes (ms-, me-, ps-, pe-, text-start, text-end) instead of left/right. Check icons that imply direction (arrows, chevrons) flip in RTL.
- Contrast at least 4.5:1 for body text, including small grey footer text.
- Forms: visible labels, clear error messages, Enter submits, no prefilled real-looking emails, loading and disabled states.
- Numbers, dates and currency go through src/lib/format.ts.
- Check both languages at mobile width (360px) before finishing.
