'use client';

import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import NewOrderModal from "@/components/modals/newOrderModal";

export default function HeaderLayout({ children }: { children: React.ReactNode }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700 relative">
          <Link href="/dashboard" className="hover:text-black transition">Dashboard</Link>
          <Link href="/ingredients" className="hover:text-black transition">Ingredients</Link>

          {/* Orders Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(prev => !prev)}
              className="flex items-center gap-1 hover:text-black transition"
            >
              Orders
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-md rounded-md z-50">
                <button
                  onClick={() => {
                    setShowModal(true);
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition"
                >
                  New Order
                </button>
                <Link
                  href="/view-orders"
                  className="block px-4 py-2 text-sm hover:bg-gray-100 transition underline"
                  onClick={() => setShowDropdown(false)}
                >
                  View Orders
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main content with top padding to offset fixed header */}
      <main className="pt-12 p-3">
        {children}
      </main>

      {/* Modal */}
      {showModal && <NewOrderModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
