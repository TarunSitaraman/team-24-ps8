"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Assistant" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
];

export default function NavBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-extrabold text-ink-950">
            ₹
          </span>
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight">PayWise</span>
            <span className="block text-[11px] text-ink-400">Smart banking assistant</span>
          </span>
        </Link>

        <button
          onClick={logout}
          className="ml-auto rounded-md px-2 py-1 text-xs text-ink-400 hover:bg-ink-800 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-500 md:order-last"
        >
          Log out
        </button>

        <nav aria-label="Main" className="-mx-1 flex w-full gap-1 overflow-x-auto md:w-auto">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-500/15 font-semibold text-brand-100 ring-1 ring-brand-500/40"
                    : "text-ink-200 hover:bg-ink-800 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
