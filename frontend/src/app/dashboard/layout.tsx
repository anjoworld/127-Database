'use client';

import Image from "next/image";
import React from "react";

export default function HeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-200">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-sm px-6 py-2 flex items-center z-50 h-12">
        <Image src="/Logo.png" alt="Logo" width={20} height={20} />
        <span className="ml-4 text-normal font-semibold">CarenDaBase</span>
      </header>

      {/* Main content with top padding to offset fixed header */}
      <main className="pt-12 p-3">
        {children}
      </main>
    </div>
  );
}
