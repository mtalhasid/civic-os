"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  Search,
  Bell,
  Plus,
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react";

type NavbarProps = {
  user: {
    id: string;
    name?: string | null;
    role: "CITIZEN" | "AUTHORITY";
    avatar?: string | null;
  } | null;
};

export default function Navbar({ user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
      <div className="h-14 lg:h-16 pl-14 pr-3 lg:pl-0 lg:px-8 flex items-center justify-between gap-2 min-w-0">
        <div className="hidden lg:flex flex-1 max-w-lg min-w-0">
          <div className="relative group w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search reports, areas, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-green-50 border-transparent focus:border-green-200 focus:bg-white border rounded-xl outline-none transition-all text-[13px] font-medium"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 lg:hidden" />

        <div className="flex items-center gap-1.5 lg:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="lg:hidden p-2.5 text-gray-500 hover:text-green-600 bg-green-50 rounded-xl transition-all"
            aria-label="Search"
            title="Search"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          <Link
            href="/notifications"
            className="p-2.5 text-gray-400 hover:text-green-600 bg-green-50 rounded-xl transition-all relative"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </Link>

          <Link
            href="/report-issue"
            className="flex items-center justify-center gap-2 p-2.5 lg:px-4 lg:py-2 bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-600/10 hover:scale-105 active:scale-95 transition-all text-xs no-underline"
            aria-label="New Report"
            title="New Report"
          >
            <Plus size={18} />
            <span className="hidden lg:inline">New Report</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-1 lg:gap-3 lg:ml-2 lg:border-l lg:border-gray-100 lg:pl-4">
              <Link
                href="/profile"
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-green-50 border border-green-100 overflow-hidden cursor-pointer hover:border-green-300 transition-all flex items-center justify-center"
                aria-label="Profile"
                title="Profile"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="text-green-600" size={18} />
                )}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="p-2.5 lg:px-4 lg:py-2 bg-gray-900 text-white font-bold rounded-xl text-xs no-underline lg:ml-2"
              aria-label="Login"
              title="Login"
            >
              <UserIcon size={18} className="lg:hidden" />
              <span className="hidden lg:inline">Login</span>
            </Link>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="lg:hidden px-3 pb-3 border-t border-gray-100/80 bg-white/95">
          <div className="relative group pt-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search reports, areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-green-50 border border-green-100 focus:border-green-200 focus:bg-white rounded-xl outline-none transition-all text-[13px] font-medium"
            />
          </div>
        </div>
      )}
    </header>
  );
}
