import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Heart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchDialog } from "@/components/search-dialog";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="container mx-auto px-4 sm:px-6 overflow-x-hidden">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Steam Home">
              <div className="relative w-8 h-8 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 group-hover:from-emerald-400 group-hover:to-cyan-400 transition-all duration-300">
                <Image
                  src="/placeholder.svg?height=32&width=32"
                  alt="Steam Logo"
                  width={32}
                  height={32}
                  sizes="32px"
                  className="w-8 h-8 scale-90 group-hover:scale-100 transition-transform duration-300"
                />
              </div>
              <span className="font-bold text-lg sm:text-xl tracking-tight group-hover:text-emerald-400 transition-colors duration-300">
                STEAM
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {["Store", "Library", "Community", "News", "Support"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="text-white hover:text-emerald-400 font-medium text-sm transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all after:duration-300"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block w-48 sm:w-64 group">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-400 transition-colors duration-300" />
              <Input
                placeholder="Search games, publishers..."
                className="pl-8 bg-zinc-800/50 border-zinc-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 transition-all duration-300 text-sm"
                aria-label="Search games"
              />
            </div>

         
            <ThemeToggle />
            <Avatar className="h-8 w-8 border border-zinc-700 ring-2 ring-emerald-500/20 hover:ring-emerald-500/50 transition-all duration-300">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" sizes="32px" />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs">US</AvatarFallback>
            </Avatar>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}