// File: @/components/mobile-menu.tsx
"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Bell, ChevronRight, Flame, Heart, LayoutDashboard, Map, Menu, ShoppingCart, Telescope, Users } from "lucide-react"
import Link from "next/link"
import type { RecordModel } from "pocketbase"; // Impor RecordModel
import { useEffect, useState } from "react"

interface MobileMenuProps {
  currentUser?: RecordModel | null;
  avatarUrl?: string | null;
}

const categoryItems = [
  "Action",
  "Adventure",
  "RPG",
  "Simulation",
  "Strategy",
  "Sports",
  "Indie",
  "Casual",
  "Racing",
  "Puzzle"
];

export function MobileMenu({ currentUser, avatarUrl }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  // Mencegah scroll pada body saat menu terbuka
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden p-2 rounded-full
                     text-emerald-900 hover:bg-emerald-400/20  /* Ikon gelap di header terang */
                     dark:text-zinc-200 dark:hover:text-white dark:hover:bg-zinc-700/60
                     focus-visible:ring-2 focus-visible:ring-offset-2 
                     focus-visible:ring-emerald-700 dark:focus-visible:ring-offset-zinc-900 dark:focus-visible:ring-emerald-500"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" /> 
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[300px] sm:w-[350px] p-0 flex flex-col
                   bg-white dark:bg-zinc-900 
                   border-r border-neutral-200 dark:border-zinc-800"
      >
        <SheetHeader className="p-4 border-b border-neutral-200 dark:border-zinc-800">
          <SheetTitle className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Menu</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1"> 
          {/* Bagian Info Pengguna - DIMODIFIKASI */}
          {currentUser && (
            <div className="p-4 border-b border-neutral-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 border-2 border-emerald-500/50 dark:border-emerald-500/30">
                  <AvatarImage src={avatarUrl || undefined} alt={currentUser.username || "User Avatar"} />
                  <AvatarFallback className="bg-emerald-100 dark:bg-zinc-700 text-emerald-600 dark:text-emerald-300 font-semibold text-lg">
                    {/* Menggunakan username untuk inisial, fallback ke 'U' jika tidak ada */}
                    {(currentUser.username || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {/* Menampilkan username sebagai nama utama */}
                  <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {currentUser.username || "User"} 
                  </div>
                  <Link href="/profile" onClick={closeMenu}>
                    <div className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer">
                        View Profile
                    </div>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { icon: Bell, label: "Notifications", href: "/notifications" },
                  { icon: Heart, label: "Wishlist", href: "/wishlist" },
                  { icon: ShoppingCart, label: "Cart", href: "/cart" },
                ].map(action => (
                  <Button 
                    key={action.label}
                    variant="outline" 
                    size="icon" 
                    className="flex-1 
                               border-neutral-300 hover:bg-neutral-100 text-neutral-600
                               dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300"
                    asChild
                  >
                    <Link href={action.href} onClick={closeMenu} aria-label={action.label}>
                       <action.icon className="h-5 w-5" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}
          {!currentUser && (
             <div className="px-4 py-6 border-b border-neutral-200 dark:border-zinc-800">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link href="/login" onClick={closeMenu}>Login / Register</Link>
                </Button>
             </div>
          )}

          <div className="px-4 py-3">
            <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white dark:text-white">
              <Link href="/" onClick={closeMenu}>
                Store Home
              </Link>
            </Button>
          </div>

          <Separator className="my-2 bg-neutral-200 dark:bg-zinc-800" />

          <div className="px-4 py-2">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">Discover</h3>
            <ul className="space-y-1">
              {[
                   { label: "Explore", icon: Telescope ,href:""},
                   { label: "Your Dashboard", icon: LayoutDashboard,href:"" },
                   { label: "Organization", icon: Users,href:"" },
                   { label: "Trends", icon: Flame ,href:""},
                   { label: "Map Explorer", icon: Map ,href:""},
                
                  ].map((item) => {
                const Icon = item.icon;
                return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 py-2 px-2 rounded-md text-sm font-medium
                               text-neutral-700 dark:text-zinc-300 
                               hover:bg-neutral-100 dark:hover:bg-zinc-800
                               hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    onClick={closeMenu}
                  >
                    <Icon className="mr-0 h-4 w-4 text-neutral-500 dark:text-zinc-400 group-hover:text-emerald-500" /> {/* group-hover tidak berlaku di sini, warna ikon bisa diatur langsung atau diwariskan */}
                    <span>{item.label}</span>
                  </Link>
                </li>
              )})}
            </ul>
          </div>

          <Separator className="my-2 bg-neutral-200 dark:bg-zinc-800" />

          <div className="px-2 py-2">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="categories" className="border-none">
                <AccordionTrigger className="py-2.5 px-2 text-sm font-medium rounded-md
                                           text-neutral-700 dark:text-zinc-300 
                                           hover:bg-neutral-100 dark:hover:bg-zinc-800
                                           hover:text-emerald-600 dark:hover:text-emerald-400 hover:no-underline">
                  CATEGORIES
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <ul className="space-y-0.5 pl-6">
                    {categoryItems.map((category: string) => (
                      <li key={category}>
                        <Link
                          href={`/categories/${category.toLowerCase()}`}
                          className="flex items-center justify-between py-2 pr-2 text-sm rounded-md
                                     text-neutral-600 dark:text-zinc-400 
                                     hover:bg-neutral-100 dark:hover:bg-zinc-800
                                     hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          onClick={closeMenu}
                        >
                          <span>{category}</span>
                          <ChevronRight className="h-4 w-4 opacity-60" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <Separator className="my-2 bg-neutral-200 dark:bg-zinc-800" />

            <div className="px-4 py-2">
                 <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-500">More</h3>
                 <ul className="space-y-1">
                {[ 
                    { label: "News", href: "/news" },
                    { label: "Community", href: "/community" },
                    { label: "Support", href: "/support" },
                ].map(item => {
                    return (
                    <li key={item.label}>
                        <Link
                        href={item.href}
                        className="flex items-center gap-3 py-2 px-2 rounded-md text-sm font-medium
                                    text-neutral-700 dark:text-zinc-300 
                                    hover:bg-neutral-100 dark:hover:bg-zinc-800
                                    hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        onClick={closeMenu}
                        >
                        <span>{item.label}</span>
                        </Link>
                    </li>
                    )
                })}
                </ul>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}