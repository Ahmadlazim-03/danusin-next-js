"use client";

import React, { useEffect, useState } from "react";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Bell, ChevronDown, Heart, LogOut, Search, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

import PocketBase, { RecordModel } from "pocketbase";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// Pastikan URL PocketBase Anda benar
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.evoptech.com");

export function Header() {
  const { theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<RecordModel | null>(null); // Inisialisasi dengan null
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isHeartHovered, setIsHeartHovered] = useState(false);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);

  useEffect(() => {
    // Fungsi untuk menangani perubahan status autentikasi
    const handleAuthChange = (model: RecordModel | null) => {
      setCurrentUser(model);
      if (model && model.avatar && model.id && model.collectionId) {
        try {
          const url = pb.files.getUrl(model, model.avatar, {'thumb': '100x100'}); // Tambahkan thumb jika perlu
          setAvatarUrl(url);
        } catch (error) {
          console.error("Error getting avatar URL:", error);
          setAvatarUrl(null);
        }
      } else {
        setAvatarUrl(null);
      }
    };

    // Panggil handleAuthChange saat komponen dimuat untuk status awal
    handleAuthChange(pb.authStore.model as RecordModel | null);
    
    // Langganan perubahan status autentikasi
    const unsubscribe = pb.authStore.onChange((token, model) => {
      handleAuthChange(model as RecordModel | null);
    });

    // Fungsi cleanup untuk unsubscribe saat komponen di-unmount
    return () => {
      unsubscribe();
    };
  }, []); // Dependency array kosong agar hanya berjalan sekali saat mount dan unmount

  const handleLogout = () => {
    pb.authStore.clear();
    // setCurrentUser(null); // Sudah dihandle oleh pb.authStore.onChange
    // setAvatarUrl(null);  // Sudah dihandle oleh pb.authStore.onChange
    window.location.href = "/login"; // Arahkan ke login setelah logout
  };

  const logoPath = theme === "dark" ? "/logo-danusin-hijau.png" : "/logo-danusin-putih.png";

  const searchRecommendations = [
    { label: "Cari Semua Organisasi", href: "/dashboard/organization/all" },
    { label: "Lihat Semua Produk", href: "/dashboard/products/all" },
    { label: "Favorit Produk", href: "/dashboard/favorites/products" },
    { label: "Profil Saya", href: "/dashboard/profile" },
    { label: "Danusin Map", href: "/dashboard/map" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-emerald-500/80 backdrop-blur-md border-b border-emerald-600/50 dark:bg-zinc-900/80 dark:border-b dark:border-zinc-800/50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center">
            <MobileMenu currentUser={currentUser} avatarUrl={avatarUrl} /> {/* Teruskan currentUser & avatarUrl */}
            <div className="hidden md:flex items-center md:gap-2 lg:gap-3 xl:gap-4">
              <Link href="/" className="flex items-center gap-2 group" aria-label="App Home">
                <div className="relative w-9 h-9 overflow-hidden rounded-full group-hover:scale-105 transition-transform duration-300">
                  <Image src={logoPath} alt="App Logo" width={36} height={36} sizes="36px" className="w-9 h-9 group-hover:scale-105 transition-transform duration-300" />
                </div>
                <span className="font-bold text-lg sm:text-xl tracking-tight transition-colors duration-300 text-white group-hover:text-emerald-100 dark:text-white dark:group-hover:text-emerald-400">
                  DANUSIN
                </span>
              </Link>
              <nav className="flex items-center md:ml-4 lg:ml-5 md:space-x-2 lg:space-x-4 xl:space-x-6">
                {["About", "Features", "Contact"].map((item) => (
                  <Link key={item} href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="font-medium text-sm transition-colors duration-300 relative text-white hover:text-emerald-100 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-100 after:transition-all after:duration-300 dark:text-white dark:hover:text-emerald-400 dark:after:bg-emerald-400"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={currentUser ? "/dashboard/favorites/products" : "/login"} // Arahkan ke login jika belum login
              aria-label="Favorites"
              onMouseEnter={() => setIsHeartHovered(true)}
              onMouseLeave={() => setIsHeartHovered(false)}
              className="p-2 rounded-full text-white hover:bg-emerald-400/20 dark:text-white dark:hover:bg-zinc-700/60 transition-colors duration-200"
            >
              <Heart className={`w-5 h-5 transition-all ${isHeartHovered ? "stroke-rose-400 dark:stroke-rose-500 fill-rose-500/10" : "stroke-current"}`} />
            </Link>

            <Popover open={isSearchPopoverOpen} onOpenChange={setIsSearchPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="relative flex-1 md:flex-none md:w-48 group">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 text-emerald-100 group-focus-within:text-white dark:text-zinc-400 dark:group-focus-within:text-emerald-400 pointer-events-none" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 text-sm transition-all duration-300 bg-emerald-400/30 border-2 border-emerald-200/90 text-white placeholder:text-emerald-50/80 hover:bg-emerald-300/40 focus-visible:border-emerald-100/90 focus-visible:ring-1 focus-visible:ring-emerald-300/50 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-400 dark:focus-visible:border-emerald-500 dark:focus-visible:ring-1 dark:focus-visible:ring-emerald-500/50 w-full h-9" // Sesuaikan tinggi jika perlu
                    aria-label="Search"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      setIsSearchPopoverOpen(true);
                    }}
                    onFocus={() => {
                        if (!isSearchPopoverOpen) {
                            setIsSearchPopoverOpen(true);
                        }
                    }}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-1 mt-1 bg-card border-border shadow-md rounded-md" 
                sideOffset={5}
                onOpenAutoFocus={(e) => e.preventDefault()} 
              >
                <div className="flex flex-col space-y-0.5">
                    <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Saran Pencarian</p>
                  {searchRecommendations.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-1.5 text-sm rounded-sm hover:bg-accent focus:bg-accent focus:outline-none text-popover-foreground"
                      onClick={() => setIsSearchPopoverOpen(false)} 
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <ThemeToggle />
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="User menu" className="flex items-center gap-1 p-0.5 pr-1 rounded-full transition-colors duration-200 hover:bg-emerald-400/20 dark:hover:bg-zinc-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-zinc-900 dark:focus-visible:ring-emerald-500" >
                    <Avatar className="h-8 w-8 border border-emerald-500/50 dark:border-zinc-600/80">
                      <AvatarImage src={avatarUrl || undefined} alt={currentUser?.name || currentUser?.username || "User"} sizes="32px" />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs font-semibold text-white"> {(currentUser.username || currentUser.name || "U").substring(0, 2).toUpperCase()} </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-emerald-100/70 dark:text-zinc-400 transition-colors duration-200" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 shadow-lg rounded-md mt-2 p-1 z-[51]"> {/* Naikkan z-index jika perlu */}
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate"> Signed in as <br /> <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">{currentUser.email}</span> </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-200 dark:bg-zinc-700 h-px my-1" />
                  <DropdownMenuItem asChild className="focus:!bg-neutral-100 dark:focus:!bg-zinc-700/50 rounded-sm">
                    <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer w-full"> <UserCircle2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> <span>My Profile</span> </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:!bg-neutral-100 dark:hover:!bg-zinc-700/50 focus:!bg-neutral-100 dark:focus:!bg-zinc-700/50 rounded-sm cursor-pointer"> <Bell className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> <span><Link href="/dashboard/notification">Notifications</Link></span> </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-neutral-200 dark:bg-zinc-700 h-px my-1" />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-red-600 dark:text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10 focus:!bg-red-50 dark:focus:!bg-red-500/10 rounded-sm cursor-pointer" > <LogOut className="w-4 h-4" /> <span>Logout</span> </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login"> <button className="px-3 py-1.5 text-sm font-medium text-white hover:text-emerald-100 dark:text-white dark:hover:text-emerald-300"> Login </button> </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}