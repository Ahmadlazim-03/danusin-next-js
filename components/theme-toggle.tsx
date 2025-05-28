// File: @/components/theme-toggle.tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="p-2 rounded-full 
                     text-white hover:bg-white/15  /* Ikon putih solid, hover bg lebih jelas */
                     dark:text-zinc-100 dark:hover:text-white dark:hover:bg-zinc-700/60
                     focus-visible:ring-2 focus-visible:ring-offset-2 
                     focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-zinc-900 dark:focus-visible:ring-emerald-500"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-150 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="min-w-[8rem] overflow-hidden rounded-lg mt-2 shadow-xl
                   border border-emerald-400/30 bg-emerald-500/90 backdrop-blur-md  /* Latar dropdown light mode: emerald */
                   dark:border-zinc-700/70 dark:bg-zinc-800/90 dark:backdrop-blur-md" /* Latar dropdown dark mode: zinc */
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="text-white hover:!bg-emerald-400/50 focus:!bg-emerald-400/60 /* Teks item light mode: putih */
                     dark:text-zinc-200 dark:hover:!bg-zinc-700/80 dark:focus:!bg-zinc-700
                     cursor-pointer py-1.5 px-3 text-sm"
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="text-white hover:!bg-emerald-400/50 focus:!bg-emerald-400/60
                     dark:text-zinc-200 dark:hover:!bg-zinc-700/80 dark:focus:!bg-zinc-700
                     cursor-pointer py-1.5 px-3 text-sm"
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="text-white hover:!bg-emerald-400/50 focus:!bg-emerald-400/60
                     dark:text-zinc-200 dark:hover:!bg-zinc-700/80 dark:focus:!bg-zinc-700
                     cursor-pointer py-1.5 px-3 text-sm"
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}