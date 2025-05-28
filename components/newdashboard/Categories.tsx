"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Tag, LayoutGrid, Package, Zap, Gamepad2, Award, ChevronDown, Trophy } from "lucide-react"; // Sesuaikan ikon
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card"; // Hanya Card dan CardContent
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button"; // Impor Button jika diperlukan untuk Coba Lagi
import { cn } from "@/lib/utils"; // Impor cn

// Tipe Data untuk Katalog dari PocketBase
type CatalogDB = RecordModel & {
  name: string;
  description?: string;
  slug?: string;
  product_count?: number;
  // Tambahan untuk warna dan ikon (opsional, jika ingin dari DB)
  // icon_name?: string; 
  // gradient_from?: string;
  // gradient_to?: string;
};

// --- Array Gradien Warna untuk diterapkan secara berulang ---
const catalogGradients = [
  "from-emerald-500/20 via-green-500/5 to-teal-500/20 dark:from-emerald-700/30 dark:via-green-700/10 dark:to-teal-700/30",
  "from-purple-500/20 via-indigo-500/5 to-blue-500/20 dark:from-purple-700/30 dark:via-indigo-700/10 dark:to-blue-700/30",
  "from-red-500/20 via-orange-500/5 to-yellow-500/20 dark:from-red-700/30 dark:via-orange-700/10 dark:to-yellow-700/30",
  "from-sky-500/20 via-cyan-500/5 to-blue-500/20 dark:from-sky-700/30 dark:via-cyan-700/10 dark:to-blue-700/30",
  "from-pink-500/20 via-rose-500/5 to-red-500/20 dark:from-pink-700/30 dark:via-rose-700/10 dark:to-red-700/30",
  "from-lime-500/20 via-green-500/5 to-emerald-500/20 dark:from-lime-700/30 dark:via-green-700/10 dark:to-emerald-700/30",
];

// --- Komponen CategoryCard (Versi Inline Disesuaikan) ---
interface CategoryCardProps {
  category: CatalogDB;
  gradientClass: string; // Prop baru untuk kelas gradien
}

function CategoryCard({ category, gradientClass }: CategoryCardProps) {
  const categoryLink = `/dashboard/catalog/${category.slug || category.id}`;
  // Contoh ikon berdasarkan nama (sangat sederhana, bisa diperbaiki)
  let IconComponent = LayoutGrid;
  if (category.name.toLowerCase().includes("action")) IconComponent = Zap;
  else if (category.name.toLowerCase().includes("rpg")) IconComponent = Award;
  else if (category.name.toLowerCase().includes("adventure")) IconComponent = Gamepad2;
  else if (category.name.toLowerCase().includes("strategy")) IconComponent = ChevronDown; // Mungkin perlu ikon lain
  else if (category.name.toLowerCase().includes("sports")) IconComponent = Trophy;


  return (
    <Link href={categoryLink} passHref>
      <Card className={cn(
        "h-full hover:shadow-lg transition-all duration-300 cursor-pointer group",
        "bg-gradient-to-br hover:opacity-90", // Efek hover dasar
        gradientClass // Terapkan kelas gradien dari prop
      )}>
        <CardContent className="p-4 flex flex-col items-center text-center justify-center aspect-square">
          <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/70 dark:text-white/70 mb-2 transition-transform group-hover:scale-110" />
          <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-foreground/80 dark:text-white dark:group-hover:text-white/90 transition-colors line-clamp-2">
            {category.name}
          </h3>
          {/* Deskripsi bisa ditambahkan kembali jika diinginkan */}
          {/* {category.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {category.description}
            </p>
          )} */}
           {typeof category.product_count === 'number' && (
             <Badge variant="secondary" className="mt-2 text-xs bg-white/20 dark:bg-black/20 backdrop-blur-sm">
               {category.product_count} Produk
             </Badge>
           )}
        </CardContent>
      </Card>
    </Link>
  );
}
// --- Akhir Komponen CategoryCard ---


// Komponen Skeleton untuk Categories
function CategoriesSkeleton() {
  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4 flex flex-col items-center justify-center aspect-square">
              <Skeleton className="h-10 w-10 rounded-full mb-2 bg-muted/50 dark:bg-zinc-700/50" />
              <Skeleton className="h-5 w-20 mb-1 bg-muted/50 dark:bg-zinc-700/50" />
              <Skeleton className="h-3 w-16 bg-muted/50 dark:bg-zinc-700/50" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}


export function Categories() {
  const [catalogs, setCatalogs] = useState<CatalogDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCatalogsWithProductCount = useCallback(async (signal: AbortSignal) => {
    setLoading(true); setError(null);
    try {
        const allCatalogsResult = await pb.collection('danusin_catalog').getFullList<CatalogDB>({
            sort: 'name', signal, $autoCancel: false,
        });
        if (signal.aborted) return;
        const enrichedCatalogs = await Promise.all(
            allCatalogsResult.map(async (catalog) => {
                if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                try {
                    const productsInCatalog = await pb.collection('danusin_product').getList(1, 1, {
                        filter: `catalog ~ "${catalog.id}"`, fields: 'id', signal, $autoCancel: false,
                    });
                    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    return { ...catalog, product_count: productsInCatalog.totalItems };
                } catch (productErr: any) {
                    if (productErr.name !== 'AbortError' && !signal.aborted) { console.warn(`Could not count products for catalog ${catalog.id}:`, productErr); }
                    return { ...catalog, product_count: 0 };
                }
            })
        );
        if (signal.aborted) return;
        setCatalogs(enrichedCatalogs);
    } catch (err: any) {
        if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) && !signal.aborted ) {
            console.error("Failed to fetch all catalogs:", err); setError("Gagal memuat daftar katalog.");
            toast({ title: "Error", description: "Gagal memuat daftar katalog.", variant: "destructive"});
        } else { console.log("Fetch all catalogs request was cancelled."); }
    } finally { if (!signal.aborted) { setLoading(false); } }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAllCatalogsWithProductCount(controller.signal);
    return () => { controller.abort(); };
  }, [fetchAllCatalogsWithProductCount]);

  if (loading) { return <CategoriesSkeleton />; }
  if (error) { return ( <section className="mb-6 md:mb-10 p-4 text-center"> <p className="text-red-500">{error}</p> <Button onClick={() => fetchAllCatalogsWithProductCount(new AbortController().signal)} variant="outline" className="mt-2">Coba Lagi</Button> </section> ); }
  if (catalogs.length === 0) { return ( <section className="mb-6 md:mb-10"> <div className="flex items-center justify-between mb-4 md:mb-6"> <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center text-neutral-800 dark:text-white"> <LayoutGrid className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Browse by Catalog </h2> </div> <div className="text-center py-10 text-muted-foreground"> <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" /> <p className="text-lg">Belum ada katalog yang tersedia.</p> </div> </section> ); }

  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center text-neutral-800 dark:text-white">
          <LayoutGrid className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Browse by Catalog
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {catalogs.map((category, index) => (
          <CategoryCard 
            key={category.id} 
            category={category} 
            // Terapkan warna dari array secara berulang
            gradientClass={catalogGradients[index % catalogGradients.length]} 
          />
        ))}
      </div>
    </section>
  );
}