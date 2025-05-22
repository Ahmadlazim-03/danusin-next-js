// File: @/components/theme-toggle.tsx (atau path yang sesuai)
"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button" // Asumsi dari shadcn/ui
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu" // Asumsi dari shadcn/ui

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Kelas Button ini sudah diatur agar theme-aware dari interaksi sebelumnya */}
        <Button 
          variant="outline" 
          size="icon" 
          className="border-emerald-600/50 text-emerald-700 hover:bg-emerald-400/20 
                     dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700/50
                     focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 
                     focus-visible:ring-offset-background" // Tambahan untuk focus state yang lebih jelas
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 
                   shadow-lg rounded-md py-1 min-w-[8rem]" // Perbaikan styling dropdown
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className="text-neutral-700 dark:text-neutral-200 
                     hover:!bg-neutral-100 dark:hover:!bg-zinc-700 
                     focus:!bg-neutral-100 dark:focus:!bg-zinc-700 
                     cursor-pointer px-3 py-1.5 text-sm" // Perbaikan styling item
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className="text-neutral-700 dark:text-neutral-200 
                     hover:!bg-neutral-100 dark:hover:!bg-zinc-700 
                     focus:!bg-neutral-100 dark:focus:!bg-zinc-700 
                     cursor-pointer px-3 py-1.5 text-sm"
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className="text-neutral-700 dark:text-neutral-200 
                     hover:!bg-neutral-100 dark:hover:!bg-zinc-700 
                     focus:!bg-neutral-100 dark:focus:!bg-zinc-700 
                     cursor-pointer px-3 py-1.5 text-sm"
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}