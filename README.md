# PayWise: Smart Banking Assistant

Team 24 | PS8 | SRM Agentic AI Hackathon

## The problem
Retail bank customers call the bank or visit the branch for simple things: checking a balance, finding out where their money went, moving money between their own accounts and setting a spending limit. The call centre is overloaded with these requests.

## What our app does
- Shows balances for all of the customer's accounts, with frozen accounts clearly marked
- Explains spending by category ("How much did I spend on food this month?") and lists transactions with filters
- Moves money between the customer's **own** accounts. The bank's rules are checked in the database: no frozen accounts, no overdraft, and per-transfer and daily KYC limits
- Sets monthly budgets with an alert level, and warns when a budget passes it
- Shows every step the agent takes in the chat, so the customer can see what was read and what was changed

Logged-in demo customer: **B001 (Rohan Iyer)**. The agent never takes a customer id from the chat.

## Live demo
- Vercel link: _TODO_
- Passcode: _TODO (share in the submission form only)_
- Try this prompt: "How much did I spend on food this month, and am I over my budget?"

More prompts:
- "Move 20,000 from savings to my salary account."
- "Set a 4,000 rupee monthly budget for shopping and alert me at 75%."
- "Move 5,000 from my old savings to salary." (blocked: the account is frozen)

## Agent tools
| Tool | What it does | Reads or writes |
| --- | --- | --- |
| `getMyAccounts` | Accounts, balances, masked numbers, transfer limits and how much is left today | Reads |
| `getTransactions` | Transactions filtered by category, account, direction, dates or a search word | Reads |
| `getSpendSummary` | Spending by category for this month, last month or a date range | Reads |
| `getBudgetStatus` | Each budget's limit, spend this month, % used and status (ok / alert / over) | Reads |
| `transferFunds` | Moves money between the customer's own accounts via the `transfer_funds()` DB function | **Writes** |
| `setBudgetAlert` | Creates or updates a monthly budget and its alert % for a category | **Writes** |

How the agent works: the user asks in plain English → `/api/agent` sends the chat and the tool list to Gemini → Gemini picks a tool and its arguments → Zod checks the arguments → our code runs the tool against Supabase → the result goes back to Gemini. This repeats for up to 8 rounds until Gemini gives the final answer (`lib/agent/runAgent.ts`).

Safety: the agent never asks for or shows a PIN, password, OTP or full account number (only masked numbers like `XXXX 7730` are stored and shown), and it declines investment advice.

## Database tables
- `customers`: customer name, city and KYC level (`basic` / `full`)
- `accounts`: each customer's accounts with type, nickname, masked number, balance and frozen flag
- `transfer_limits`: per-transfer and daily transfer limits for each KYC level
- `transactions`: debits and credits with date, description and category
- `budgets`: a monthly limit and alert % per customer and category
- `transfer_funds()`: a database function that checks every transfer rule and updates both balances in one transaction

Seed: `seed/ps8_smart_banking.sql`

## Tech stack
Next.js, React, TypeScript, Tailwind CSS, Supabase, Gemini API (function calling), Zod, Vercel

## Team
| Name | Role |
| --- | --- |
| _TODO_ | Team Lead |
| _TODO_ | Frontend |
| _TODO_ | Backend / API |
| _TODO_ | Database |
| _TODO_ | AI / Agent |

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the keys (`GEMINI_API_KEY`, `GEMINI_MODEL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_PASSCODE`)
3. In the Supabase SQL Editor, run `seed/00_starter_example.sql`, then `seed/ps8_smart_banking.sql`
4. `npm run dev` and open http://localhost:3000

Open `/api/health` to see which settings are missing.

## Project layout
```
app/
  page.tsx                Banking chat + live balances + budget alert banner
  accounts/ transactions/ budgets/   Pages
  api/agent               POST: runs the agent
  api/accounts, api/transactions, api/budgets, api/spend-summary   GET: data for the pages
components/               AgentChat, NavBar, AccountsSummary, BudgetAlertBanner, ...
lib/
  agent/tools.ts          The 6 agent tools
  agent/systemPrompt.ts   PayWise instructions for Gemini
  banking.ts              Supabase queries shared by tools and API routes
  paywise.ts              Customer id, categories, money and date helpers
seed/ps8_smart_banking.sql
```

## Remaining work checklist
Code freeze is at 3:30. Judges look at the last commit before then.

**Build**
- [x] Data layer, 6 agent tools (2 write), system prompt, MAX_ROUNDS = 8
- [x] API routes: accounts, transactions, budgets, spend-summary
- [x] Theme, nav bar, banking chat home with live balances and budget alert banner
- [x] Accounts page with balance cards, frozen badge and transfer limits
- [x] Transactions page with category and account filters
- [x] Budgets page with progress bars and alert marker
- [x] Monthly spend chart by category (stretch)
- [x] `GEMINI_MODEL=gemini-3.8-flash` in `.env.example`
- [x] `AGENTS.md` project rules file
- [x] `npm run build` passes locally

**Set up and deploy**
- [ ] Supabase project (Mumbai), with `00_starter_example.sql` and `ps8_smart_banking.sql` run
- [ ] `.env.local` filled in, and `/api/health` shows all `true`
- [x] Vercel project imported, with env vars added
- [ ] Vercel link added above, and `/api/health` on Vercel shows all `true`
- [ ] Passcode set on Vercel and written in the submission form

**Test (on the Vercel link)**
- [ ] Food spend + budget question calls `getSpendSummary` and `getBudgetStatus`
- [ ] "Move 20,000 from savings to my salary account" works, and the balances update on screen
- [ ] "Set a 4,000 rupee monthly budget for shopping and alert me at 75%" saves it, and the alert banner shows
- [ ] Rule errors are explained: frozen account, over Rs 50,000 per transfer, transfer to someone else's account (A200)
- [ ] "What's my PIN?" and "Should I buy shares?" are declined
- [ ] An unclear request ("move some money") gets one short question back
- [ ] Every page works on a 360px phone screen

**Submit**
- [ ] Team names and roles filled in above
- [ ] Every team member has at least one commit
- [ ] No keys anywhere in the repo (`git grep -i "key="`)
- [ ] 5 slides: title and team, problem, solution and demo, how the agent works, results and links
- [ ] Google Form submitted between 3:30 and 4:00: slides, GitHub link, Vercel link, passcode
- [ ] Backup: the app also runs on localhost
