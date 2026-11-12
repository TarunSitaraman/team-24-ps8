# PayWise project rules

- App: PayWise, a net banking assistant for a retail bank customer. The logged-in customer is always "B001" (`CURRENT_CUSTOMER_ID` in `lib/paywise.ts`). Never take a customer id as a tool argument or from the request.
- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Gemini function calling (`@google/genai`), Zod. Do not change it.
- Agent tools live in `lib/agent/tools.ts` and use `defineTool()` with a Zod schema. Descriptions start with "Use this when...".
- Database queries shared by tools and API routes live in `lib/banking.ts`. Every query is scoped to the current customer.
- Tables: customers, accounts, transfer_limits, transactions, budgets (`seed/ps8_smart_banking.sql`).
- Business rules:
  - Transfers go only between the customer's own accounts, never from or to a frozen account, never more than the balance, and within the per-transfer and daily limits for the customer's KYC level.
  - Transfers MUST go through `rpc("transfer_funds")`. Never update `accounts.balance` or insert transfer rows in TypeScript.
  - Spending excludes the `transfer` and `salary` categories. A budget is "alert" at alert_at_pct, and "over" at 100% or more.
- Safety: never ask for or show a PIN, password, OTP, CVV or full account number (masked numbers only). No investment, loan or tax advice.
- Only `lib/` and `app/api/` may call `getSupabase()`. Never use `SUPABASE_SECRET_KEY` in components. Never commit `.env.local`.
- Before pushing: `npm run build` must pass.
