"use client"

import { MobileMenu } from "@/components/mobile-menu"
import { SearchComponent } from "@/components/search/search-component"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronDown, Heart, LogOut, UserCircle2 } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import PocketBase, { type RecordModel } from "pocketbase"

// Pastikan URL PocketBase Anda benar
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.evoptech.com")

export function Header() {
  const { theme } = useTheme()
  const [currentUser, setCurrentUser] = useState<RecordModel | null>(null) // Inisialisasi dengan null
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isHeartHovered, setIsHeartHovered] = useState(false)

  useEffect(() => {
    // Fungsi untuk menangani perubahan status autentikasi
    const handleAuthChange = (model: RecordModel | null) => {
      setCurrentUser(model)
      if (model && model.avatar && model.id && model.collectionId) {
        try {
          const url = pb.files.getUrl(model, model.avatar, { thumb: "100x100" }) // Tambahkan thumb jika perlu
          setAvatarUrl(url)
        } catch (error) {
          console.error("Error getting avatar URL:", error)
          setAvatarUrl(null)
        }
      } else {
        setAvatarUrl(null)
      }
    }

    // Panggil handleAuthChange saat komponen dimuat untuk status awal
    handleAuthChange(pb.authStore.model as RecordModel | null)

    // Langganan perubahan status autentikasi
    const unsubscribe = pb.authStore.onChange((token, model) => {
      handleAuthChange(model as RecordModel | null)
    })

    // Fungsi cleanup untuk unsubscribe saat komponen di-unmount
    return () => {
      unsubscribe()
    }
  }, []) // Dependency array kosong agar hanya berjalan sekali saat mount dan unmount

  const handleLogout = () => {
    pb.authStore.clear()
    // setCurrentUser(null); // Sudah dihandle oleh pb.authStore.onChange
    // setAvatarUrl(null);  // Sudah dihandle oleh pb.authStore.onChange
    window.location.href = "/login" // Arahkan ke login setelah logout
  }

  const logoPath = theme === "dark" ? "/logo-danusin-hijau.png" : "/logo-danusin-putih.png"

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
                  <Image
                    src={logoPath || "/placeholder.svg"}
                    alt="App Logo"
                    width={36}
                    height={36}
                    sizes="36px"
                    className="w-9 h-9 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="font-bold text-lg sm:text-xl tracking-tight transition-colors duration-300 text-white group-hover:text-emerald-100 dark:text-white dark:group-hover:text-emerald-400">
                  DANUSIN
                </span>
              </Link>
              <nav className="flex items-center md:ml-4 lg:ml-5 md:space-x-2 lg:space-x-4 xl:space-x-6">
                {["About", "Features", "Contact"].map((item) => (
                  <Link
                    key={item}
                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
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
              <Heart
                className={`w-5 h-5 transition-all ${isHeartHovered ? "stroke-rose-400 dark:stroke-rose-500 fill-rose-500/10" : "stroke-current"}`}
              />
            </Link>

            {/* Replace the old search with our new SearchComponent */}
            <SearchComponent />

            <ThemeToggle />
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="User menu"
                    className="flex items-center gap-1 p-0.5 pr-1 rounded-full transition-colors duration-200 hover:bg-emerald-400/20 dark:hover:bg-zinc-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-zinc-900 dark:focus-visible:ring-emerald-500"
                  >
                    <Avatar className="h-8 w-8 border border-emerald-500/50 dark:border-zinc-600/80">
                      <AvatarImage
                        src={avatarUrl || undefined}
                        alt={currentUser?.name || currentUser?.username || "User"}
                        sizes="32px"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs font-semibold text-white">
                        {" "}
                        {(currentUser.username || currentUser.name || "U").substring(0, 2).toUpperCase()}{" "}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-emerald-100/70 dark:text-zinc-400 transition-colors duration-200" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 shadow-lg rounded-md mt-2 p-1 z-[51]"
                >
                  {" "}
                  {/* Naikkan z-index jika perlu */}
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    {" "}
                    Signed in as <br />{" "}
                    <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">
                      {currentUser.email}
                    </span>{" "}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-200 dark:bg-zinc-700 h-px my-1" />
                  <DropdownMenuItem asChild className="focus:!bg-neutral-100 dark:focus:!bg-zinc-700/50 rounded-sm">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer w-full"
                    >
                      {" "}
                      <UserCircle2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> <span>
                        My Profile
                      </span>{" "}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:!bg-neutral-100 dark:hover:!bg-zinc-700/50 focus:!bg-neutral-100 dark:focus:!bg-zinc-700/50 rounded-sm cursor-pointer">
                    {" "}
                    <Bell className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />{" "}
                    <span>
                      <Link href="/dashboard/notification">Notifications</Link>
                    </span>{" "}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-neutral-200 dark:bg-zinc-700 h-px my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-red-600 dark:text-red-500 hover:!bg-red-50 dark:hover:!bg-red-500/10 focus:!bg-red-50 dark:focus:!bg-red-500/10 rounded-sm cursor-pointer"
                  >
                    {" "}
                    <LogOut className="w-4 h-4" /> <span>Logout</span>{" "}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                {" "}
                <button className="px-3 py-1.5 text-sm font-medium text-white hover:text-emerald-100 dark:text-white dark:hover:text-emerald-300">
                  {" "}
                  Login{" "}
                </button>{" "}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
