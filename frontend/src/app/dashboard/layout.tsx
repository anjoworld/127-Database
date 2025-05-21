'use client';

import Image from "next/image";
import React from "react";
import Link from "next/link";

export default function HeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-200">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-sm px-6 py-2 flex items-center justify-between z-50 h-12">
        {/* Logo and Title */}
        <div className="flex items-center">
          <Image src="/Logo.png" alt="Logo" width={20} height={20} />
          <span className="ml-4 text-normal font-semibold">CarenDaBase</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/dashboard" className="hover:text-black transition underline">Dashboard</Link>
          <Link href="/ingredients" className="hover:text-black transition">Ingredients</Link>
          <Link href="/history" className="hover:text-black transition">History</Link>
          <Link href="/new-order" className="flex items-center gap-1 hover:text-black transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Order
          </Link>
        </nav>
      </header>

      {/* Main content with top padding to offset fixed header */}
      <main className="pt-12 p-3">
        {children}
      </main>
    </div>
  );
}
