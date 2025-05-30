"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight, LayoutDashboard, Locate, Map,
  Tag, Telescope, TrendingUp, Users, LayoutGrid,
  MapPin as FindDanuserIcon, // Menggunakan MapPin untuk tombol Find Danuser
  MapPin
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import { Skeleton } from "@/components/ui/skeleton"; 
// toast tidak lagi dibutuhkan di sini jika handleToggleDanuserStatus dihapus
// import { toast } from "@/components/ui/use-toast"; 

// Tipe data untuk katalog yang diambil
type CatalogItem = RecordModel & {
  name: string;
  slug?: string;
  product_count?: number; 
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth(); // Hanya butuh user untuk cek login dan isDanuser (jika masih dipakai di Discover)
  const isDanuser = user?.isdanuser === true; // Tetap ada untuk filter menu Discover

  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  // State isTogglingDanuser dan fungsi handleToggleDanuserStatus dihapus

  const discoverMenuItems = [
    { label: "Explore", icon: Telescope, url: "/dashboard", showAlways: true },
    { label: "Your Dashboard", icon: LayoutDashboard, url: "/dashboard/manage", showAlways: false,},
    { label: "Organization", icon: Users, url: "/dashboard/organization", showAlways: false, },
    { label: "Map Explorer", icon: Map, url: "/dashboard/maps", showAlways: true },
  ];
  
  const fetchPopularCatalogs = useCallback(async (signal: AbortSignal) => {
    setLoadingCatalogs(true);
    try {
      const allCatalogsResult = await pb.collection('danusin_catalog').getFullList<CatalogItem>(
        { sort: 'name', signal, $autoCancel: false, }
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
          if (productErr.name !== 'AbortError' && !signal.aborted) {
             console.warn(`Could not count products for catalog ${catalog.id} in sidebar:`, productErr);
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
        console.error("Error fetching popular catalogs for sidebar:", error);
      } else {
        console.log("Fetch popular catalogs for sidebar request was cancelled.");
      }
    } finally {
      if (!signal.aborted) {
        setLoadingCatalogs(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPopularCatalogs(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchPopularCatalogs]);

  if (!user) {
    return null; 
  }

  return (
    <aside className="hidden md:block w-56 shrink-0">
      <div className="space-y-6">
        {/* Bagian DISCOVER */}
        <div className="bg-emerald-100/80 backdrop-blur-lg dark:bg-emerald-950/80 dark:backdrop-blur-lg rounded-xl p-4 border border-neutral-200/70 dark:border-zinc-700/50 shadow-sm hover:shadow-lg transition-all duration-300" >
          <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-3.5 flex items-center text-[0.8rem] uppercase tracking-wider" >
            <Locate className="mr-2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Discover
          </h3>
          <ul className="space-y-1">
            {discoverMenuItems
              .filter((item) => (isDanuser || item.showAlways))
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.url;
                return (
                  <li key={item.label}>
                    <Link href={item.url} className={`flex items-center p-2 rounded-md transition-all duration-200 group text-neutral-600 dark:text-zinc-300 hover:bg-emerald-50/80 dark:hover:bg-zinc-700/70 hover:text-emerald-600 dark:hover:text-emerald-300 ${ isActive ? "bg-emerald-200/70 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-inner" : "" }`} >
                      <Icon className={`mr-2.5 h-4 w-4 text-neutral-400 dark:text-zinc-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors duration-200 group-hover:scale-110 ${ isActive ? "text-emerald-600 dark:text-emerald-300" : "" }`} />
                      <span className={`text-xs ${ isActive ? "font-semibold" : "font-medium" }`} >{item.label}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>

        {/* Bagian Jelajahi Katalog */}
        <div className="bg-white/80 backdrop-blur-lg dark:bg-zinc-800/80 dark:backdrop-blur-lg rounded-xl p-4 border border-neutral-200/70 dark:border-zinc-700/50 shadow-sm hover:shadow-lg transition-all duration-300" >
          <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-3.5 flex items-center text-[0.8rem] uppercase tracking-wider" >
            <LayoutGrid className="mr-2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Jelajahi Katalog
          </h3>
          {loadingCatalogs ? ( <div className="space-y-1">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)}</div>
          ) : catalogs.length > 0 ? (
            <ul className="space-y-1">
              {catalogs.map((catalog: CatalogItem) => (
                <li key={catalog.id}>
                  <Link
                    href={`/dashboard/catalog/${catalog.slug || catalog.id}`}
                    className="flex items-center justify-between p-2 rounded-md transition-all duration-200 group text-neutral-600 dark:text-zinc-400 hover:bg-emerald-50/80 dark:hover:bg-zinc-700/70 hover:text-emerald-600 dark:hover:text-white"
                  >
                    <span className="text-xs font-medium truncate">{catalog.name}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 ml-1">{catalog.product_count || 0}</Badge> 
                  </Link>
                </li>
              ))}
              {catalogs.length >= 7 && ( 
                 <li className="pt-1"> <Button variant="link" className="text-emerald-600 dark:text-emerald-400 p-0 h-auto hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 text-xs font-medium" asChild><Link href="/dashboard/catalog/all">Lihat Semua Katalog</Link></Button> </li>
              )}
            </ul>
          ) : ( <p className="text-xs text-muted-foreground">Belum ada katalog.</p> )}
        </div>
        
        {/* --- PERUBAHAN: Bagian Tombol Find Danuser --- */}
        <div className="bg-emerald-50 backdrop-blur-lg dark:bg-emerald-900/30 dark:backdrop-blur-lg rounded-xl p-4 border border-emerald-200/70 dark:border-emerald-800/50 shadow-sm hover:shadow-lg transition-all duration-300" >
          <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center text-[0.8rem] uppercase tracking-wider" >
            <MapPin className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {/* Ikon diganti */}
            Explore Danus
          </h3>
          <Button 
            asChild // Menggunakan asChild agar Button bertindak sebagai Link
            className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition-all duration-200 shadow hover:shadow-md"
          >
            <Link href="/dashboard/maps">
                <Telescope className="mr-2 h-4 w-4" /> {/* Ikon bisa disesuaikan */}
                Find Danuser
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Temukan danuser atau penjual di sekitar Anda melalui peta interaktif.
          </p>
        </div>
        {/* --- AKHIR PERUBAHAN --- */}

      </div>
    </aside>
  );
}