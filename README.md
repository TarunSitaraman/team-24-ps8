# PayWise: Smart Banking Assistant

Team PayWise | PS8 | SRM Agentic AI Hackathon

## The problem
Retail bank customers frequently call phone support and visit local branches for repetitive inquiries: checking account balances, finding out where their money went, moving funds between their accounts, and setting budget limits. PayWise automates these actions via an autonomous, natural-language agent with a clean, minimalism UI.

## What our app does
- **Autonomous Banking Assistant**: Uses Google Gemini Function Calling to inspect balances, analyze category spending, execute fund transfers, and configure budget limits.
- **Minimalist Aesthetic**: Clean, clutter-free Nordic typography, muted neutral palette, monospaced numeric accents, and responsive layout.
- **Proactive Budget Warnings**: Real-time progress bars with threshold alert pins and top banners when expenses exceed defined limits (e.g. Food budget 89.8% > 80% threshold).
- **Safe Transfers & KYC Compliance**: Atomic fund transfers between verified accounts with strict checks (no overdrafts, no frozen accounts, ₹50,000 per-txn and ₹100,000 daily limits).
- **Dual-Engine Architecture**: Operates with live Supabase PostgreSQL database or an offline in-memory store for 100% demo uptime.

## Live demo
- Vercel link: `https://paywise-banking-assistant.vercel.app` (or localhost:3000)
- Passcode: `paywise2026`
- Try this prompt: *"How much did I spend on food this month, and am I over my budget?"*

## Agent tools
| Tool | What it does | Reads or writes |
| --- | --- | --- |
| `getMyAccounts` | Fetches customer accounts, masked numbers, balances, and active/frozen status | Reads |
| `getTransactions` | Queries debit/credit history with category, account, and limit filters | Reads |
| `getSpendSummary` | Aggregates category spending, inflow vs outflow, and month-over-month comparisons | Reads |
| `getBudgetStatus` | Computes current budget utilization, percentage spent, and alert triggers | Reads |
| `transferFunds` | Atomically transfers money between verified accounts enforcing KYC limits | Writes |
| `setBudgetAlert` | Configures monthly category budget targets and alert percentage thresholds | Writes |

## Database tables
- `customers`: Stores user profiles, KYC levels (`basic` / `full`), cities, and contact details
- `accounts`: Stores customer accounts (`salary`, `savings`), masked numbers (`XXXX 4821`), balances, and frozen flags
- `transfer_limits`: KYC-governed daily limits and per-transaction limits
- `transactions`: Immutable financial transaction records with category, direction (`debit` / `credit`), timestamp, amount
- `budgets`: Category budget targets and customizable alert percentage thresholds (e.g. 80%)

## Tech stack
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase PostgreSQL, Google Gemini API (`@google/genai`), Zod, Lucide Icons, Vercel

## Team
| Name | Role |
| --- | --- |
| Rohan Iyer | Team Lead & Strategy |
| Yasotha A. | Frontend & Minimalism UI |
| Sathish Dev | Backend / API & Zod Schemas |
| Supabase Admin | Database & SQL Migrations |
| Agent Architect | AI / Gemini Function Calling |

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env.local` (fill in `GEMINI_API_KEY` and `SUPABASE_URL` if connecting live)
3. `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) and enter passcode `paywise2026` (or click one-click demo login).
