// File: @/components/mobile-menu.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Map,
  Menu,
  Telescope,
  Users,
  Locate,
  LayoutGrid,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider"; // Masih bisa digunakan untuk isDanuser atau data user lain jika perlu
import { pb } from "@/lib/pocketbase";
import { ClientResponseError } from "pocketbase";
import type { RecordModel } from "pocketbase";

type CatalogItem = RecordModel & {
  name: string;
  slug?: string;
  product_count?: number;
};

// 1. Tambahkan kembali currentUser dan avatarUrl ke props
interface MobileMenuProps {
  currentUser?: (RecordModel & { avatar?: string; username?: string; name?: string; email?: string }) | null;
  avatarUrl?: string | null;
}

const categoryItems = [
  "Makanan Ringan",
  "Minuman",
  "Makanan Berat",
  "Jasa",
  "Fashion",
];

export function MobileMenu({ currentUser, avatarUrl }: MobileMenuProps) { // Gunakan props
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user: authUser } = useAuth(); // Bisa dinamai authUser untuk membedakan dengan prop currentUser
  const isDanuser = authUser?.isdanuser === true; // isDanuser tetap dari useAuth

  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    pb.authStore.clear();
    window.location.href = "/login";
    closeMenu();
  };

  const discoverMenuItems = [
    { label: "Explore", icon: Telescope, url: "/dashboard", showAlways: true },
    { label: "Your Dashboard", icon: LayoutDashboard, url: "/dashboard/manage", showAlways: false },
    { label: "Organization", icon: Users, url: "/dashboard/organization", showAlways: false },
    { label: "Map Explorer", icon: Map, url: "/dashboard/maps", showAlways: true },
  ];

  const fetchPopularCatalogs = useCallback(async (signal: AbortSignal) => {
    setLoadingCatalogs(true);
    // ... (logika fetchPopularCatalogs tetap sama)
    try {
      const allCatalogsResult = await pb.collection('danusin_catalog').getFullList<CatalogItem>(
        { sort: 'name', signal, $autoCancel: false }
      );
      if (signal.aborted) return;

      const enrichedCatalogsPromises = allCatalogsResult.map(async (catalog) => {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        try {
          const productsInCatalog = await pb.collection('danusin_product').getList(1, 1, {
            filter: `catalog ~ "${catalog.id}"`,
            fields: 'id',
            signal,
            $autoCancel: false,
          });
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          return { ...catalog, product_count: productsInCatalog.totalItems };
        } catch (productErr: any) {
          if (productErr.name !== 'AbortError' && !(productErr instanceof ClientResponseError && productErr.status === 0) ) {
            console.warn(`Could not count products for catalog ${catalog.id} in mobile menu:`, productErr);
          }
          return { ...catalog, product_count: 0 };
        }
      });

      let enrichedCatalogs = await Promise.all(enrichedCatalogsPromises);
      if (signal.aborted) return;

      enrichedCatalogs.sort((a, b) => (b.product_count || 0) - (a.product_count || 0));
      
      if (!signal.aborted) {
        setCatalogs(enrichedCatalogs.slice(0, 7));
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && !(error instanceof ClientResponseError && error.status === 0) && !signal.aborted) {
        console.error("Error fetching popular catalogs for mobile menu:", error);
      } else if (error.name === 'AbortError' || (error instanceof ClientResponseError && error.status === 0)) {
        console.log("Fetch popular catalogs for mobile menu request was cancelled or network error.");
      }
    } finally {
      if (!signal.aborted) {
        setLoadingCatalogs(false);
      }
    }
  }, []);

  useEffect(() => {
    // Katalog bisa di-fetch berdasarkan authUser (dari useAuth) atau currentUser (dari prop)
    // Jika currentUser ada (dioper dari Header), mungkin lebih baik menggunakannya sebagai penanda user login
    if (currentUser) { // Menggunakan currentUser dari prop sebagai penanda user sudah login
      const controller = new AbortController();
      fetchPopularCatalogs(controller.signal);
      return () => {
        controller.abort();
      };
    } else {
      setCatalogs([]);
      setLoadingCatalogs(false);
    }
  }, [fetchPopularCatalogs, currentUser]); // Bergantung pada currentUser dari prop


  // 2. Hapus logika internal untuk mendapatkan avatarUrl, karena sudah dioper dari props
  // const typedUser = authUser as (RecordModel & { avatar?: string; username?: string; name?: string });
  // const internalAvatarUrl = typedUser?.avatar && typedUser?.collectionId && typedUser?.collectionName
  //   ? pb.getFileUrl(typedUser, typedUser.avatar, { thumb: "100x100" })
  //   : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden p-2 rounded-full
                     text-emerald-900 hover:bg-emerald-400/20
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
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader className="p-4 border-b border-neutral-200 dark:border-zinc-800">
          <SheetTitle className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            Menu
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1">
          {/* Bagian Info Pengguna */}
          {currentUser && ( // Gunakan currentUser dari prop
            <div className="p-4 border-b border-neutral-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 border-2 border-emerald-500/50 dark:border-emerald-500/30">
                  {/* 3. Gunakan avatarUrl dari prop */}
                  <AvatarImage
                    src={avatarUrl || undefined} // Langsung gunakan avatarUrl dari prop
                    alt={currentUser.username || currentUser.name || "User Avatar"}
                  />
                  <AvatarFallback className="bg-emerald-100 dark:bg-zinc-700 text-emerald-600 dark:text-emerald-300 font-semibold text-lg">
                    {(currentUser.username || currentUser.name || "U")
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {/* Gunakan currentUser dari prop untuk nama */}
                    {currentUser.name || currentUser.username || "User"}
                  </div>
                  <Link href="/dashboard/profile" onClick={closeMenu}>
                    <div className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer">
                      View Profile
                    </div>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { icon: Bell, label: "Notifications", href: "/dashboard/notification" },
                  { icon: Heart, label: "Favorite", href: "/dashboard/favorite/products" },
                ].map((action) => (
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
          {!currentUser && ( // Gunakan currentUser dari prop untuk kondisi login
            <div className="px-4 py-6 border-b border-neutral-200 dark:border-zinc-800">
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/login" onClick={closeMenu}>
                  Login / Register
                </Link>
              </Button>
            </div>
          )}

          {/* Bagian DISCOVER */}
          {currentUser && ( // Tampilkan jika currentUser (dari prop) ada
            <>
            <Separator className="my-0 bg-neutral-200 dark:bg-zinc-800" />
            <div className="px-4 py-3">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center">
                <Locate className="mr-2 h-4 w-4" />
                Discover
              </h3>
              <ul className="space-y-1">
                {discoverMenuItems
                  // isDanuser masih bisa diambil dari authUser (useAuth)
                  // atau jika currentUser dari prop memiliki field isdanuser, bisa digunakan juga
                  .filter((item) => (isDanuser || item.showAlways))
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.url;
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.url}
                          onClick={closeMenu}
                          className={`flex items-center gap-3 py-2 px-2 rounded-md text-sm font-medium
                                      text-neutral-700 dark:text-zinc-300 
                                      hover:bg-neutral-100 dark:hover:bg-zinc-800
                                      hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors
                                      ${isActive ? "bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold" : ""}`}
                        >
                          <Icon className={`mr-0 h-4 w-4 ${isActive ? "text-emerald-600 dark:text-emerald-300" : "text-neutral-500 dark:text-zinc-400 group-hover:text-emerald-500"}`} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
            </>
          )}

          {/* Bagian Jelajahi Katalog */}
          {currentUser && (
            <>
            <Separator className="my-0 bg-neutral-200 dark:bg-zinc-800" />
            <div className="px-4 py-3">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Jelajahi Katalog
              </h3>
              {/* ... (Logika tampilan katalog dan skeleton tetap sama) ... */}
              {loadingCatalogs ? (
                <div className="space-y-1.5">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md bg-neutral-200 dark:bg-zinc-700" />)}
                </div>
              ) : catalogs.length > 0 ? (
                <ul className="space-y-0.5">
                  {catalogs.map((catalog: CatalogItem) => (
                    <li key={catalog.id}>
                      <Link
                        href={`/dashboard/catalog/${catalog.slug || catalog.id}`}
                        onClick={closeMenu}
                        className="flex items-center justify-between py-2 px-2 rounded-md text-sm
                                   text-neutral-700 dark:text-zinc-300 
                                   hover:bg-neutral-100 dark:hover:bg-zinc-800
                                   hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                      >
                        <span className="font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300">{catalog.name}</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 ml-1 border-neutral-300 dark:border-zinc-600 text-neutral-500 dark:text-zinc-400 group-hover:border-emerald-500 group-hover:text-emerald-500 dark:group-hover:border-emerald-400 dark:group-hover:text-emerald-400">
                          {catalog.product_count || 0}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                  {catalogs.length >= 7 && (
                     <li className="pt-1">
                        <Button variant="link" className="text-emerald-600 dark:text-emerald-400 p-0 h-auto hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 text-xs font-medium" asChild>
                            <Link href="/dashboard/catalog/all" onClick={closeMenu}>Lihat Semua Katalog</Link>
                        </Button>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-zinc-500">Belum ada katalog.</p>
              )}
            </div>
            </>
          )}
          
          {/* Bagian Tombol Find Danuser */}
          {currentUser && (
            <>
            <Separator className="my-0 bg-neutral-200 dark:bg-zinc-800" />
            <div className="px-4 py-3">
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Explore Danus
                </h3>
                <Button
                    asChild
                    onClick={closeMenu}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition-all duration-200 shadow hover:shadow-md"
                >
                    <Link href="/dashboard/maps">
                        <Telescope className="mr-2 h-4 w-4" /> 
                        Find Danuser
                    </Link>
                </Button>
                <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    Temukan danuser atau penjual di sekitar Anda melalui peta interaktif.
                </p>
            </div>
            </>
          )}


          {currentUser && ( // Gunakan currentUser dari prop untuk kondisi Logout
            <>
              <Separator className="my-2 bg-neutral-200 dark:bg-zinc-800" />
              <div className="px-4 py-3">
                <Button
                  onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white dark:text-white"
                >
                  Logout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}