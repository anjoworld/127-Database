'use client';

import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, ChefHat } from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-200">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white z-20 shadow-md border-r transition-all duration-300 ${
          hovered ? "w-48" : "w-14"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex flex-col justify-between h-full">
          <div>
            {/* Logo */}
            <div className="flex items-center w-full h-15 px-4 py-10">
              <Image src="/Logo.png" alt="Logo" width={48} height={48} />
              {hovered && (
                <span className="ml-2 font-semibold text-lg">CarenDaBase</span>
              )}
            </div>

            {/* Nav Items */}
            <div className="flex flex-col items-start px-2 pt-2 space-y-2">
              <Link
                href="/dashboard"
                className="group flex items-center justify-between w-full p-2 rounded hover:bg-[#5932EA] hover:text-white cursor-pointer"
                title="Dashboard"
              >
                <div className="flex items-center">
                  <LayoutDashboard
                    size={40}
                    className="w-5 h-5 text-gray-700 group-hover:text-white"
                  />
                  {hovered && <span className="ml-3 text-sm">Dashboard</span>}
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                  &gt;
                </span>
              </Link>

              <Link
                href="/ingredients"
                className="group flex items-center justify-between w-full p-2 rounded hover:bg-[#5932EA] hover:text-white cursor-pointer"
                title="Ingredients"
              >
                <div className="flex items-center">
                  <ChefHat
                    size={40}
                    className="w-5 h-5 text-gray-700 group-hover:text-white"
                  />
                  {hovered && <span className="ml-3 text-sm">Ingredients</span>}
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                  &gt;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${hovered ? 'ml-48' : 'ml-14'} flex-1 p-10`}>
        {children}
        </div>
    </div>
  );
}
