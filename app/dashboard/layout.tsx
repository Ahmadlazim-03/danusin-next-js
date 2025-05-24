import type React from "react";

import { AnimatedBackground } from "@/components/animated-background";
import { Header } from "@/components/newdashboard/Header";
import { Sidebar } from "@/components/newdashboard/Sidebar";


export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className=" min-h-screen bg-white text-zinc-900 dark:bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:text-white">
      <AnimatedBackground />
        <Header />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <aside className="hidden md:block w-56 shrink-0 fixed top-21 h-[calc(100vh-4rem)] overflow-y-auto pr-4">
              <Sidebar />
            </aside>
        <main className="w-full flex-1 md:ml-64 ">{children}</main>
      </div>
      </div>
    </div>
  )
}
