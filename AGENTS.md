# Repository guidance

- Before editing, confirm the repository root and inspect `git status`; preserve existing user changes and avoid unrelated files.
- Use the package scripts `npm run typecheck`, `npm run lint`, `npm run build`, and the focused local notification suite `npm run test:telegram`. Keep tests offline with mocked external calls.
- Treat student, administrator, authentication, and financial data as sensitive. Do not place credentials, tokens, raw IPs, full emails, message bodies, or unnecessary personal/financial details in source, logs, or Telegram messages.
- Supabase SQL and migrations may be authored and reviewed locally, but never run SQL remotely, apply migrations to a hosted project, configure hosted secrets, or deploy functions without explicit user approval.
- Never send real Telegram messages or contact external services during local tests. Use mocks and verify that test code cannot reach Telegram.
- Do not commit, push, publish, or deploy unless the user explicitly asks. Do not overwrite unrelated work.
