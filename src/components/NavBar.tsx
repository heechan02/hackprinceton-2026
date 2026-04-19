"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, CreditCard, LayoutDashboard, Pill, ShoppingBasket } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cam/pill", label: "Pill Cam", icon: Pill },
  { href: "/cam/pantry", label: "Pantry Cam", icon: ShoppingBasket },
  { href: "/knot", label: "Bill Protector", icon: CreditCard },
];

export default function NavBar() {
  const pathname = usePathname();

  // Hide on onboarding
  if (pathname.startsWith("/onboarding")) return null;

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-stone-900 font-semibold text-lg"
        >
          <Camera size={20} strokeWidth={1.75} />
          NannyCam
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-stone-100 text-stone-900 font-medium"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
