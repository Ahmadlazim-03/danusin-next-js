// src/app/dashboard/products/all/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; // <--- Impor Input
import { pb } from "@/lib/pocketbase";
import { Heart as HeartIcon, ExternalLink, User, Building2, Search } from "lucide-react"; // <--- Impor Search Icon
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// --- Tipe Produk (Tetap sama) ---
type Product = {
  id: string;
  collectionId: string;
  product_name: string;
  description: string;
  price: number;
  discount: number;
  product_image: string[];
  by_organization: {
    id: string;
    organization_name: string;
    organization_slug: string;
  } | null;
  added_by: {
    id: string;
    name: string;
  } | null;
  catalog: {
    id: string;
    name: string;
  }[] | null;
};

// --- Komponen ProductCard (Tetap sama) ---
function ProductCard({ product }: { product: Product }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const displayPrice =
    product.discount && product.discount > 0 ? (
      <>
        <span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">
          Rp{product.price.toLocaleString("id-ID")}
        </span>
        <span className="text-emerald-600 dark:text-emerald-400">
          Rp{product.discount.toLocaleString("id-ID")}
        </span>
      </>
    ) : (
      <span>Rp{product.price.toLocaleString("id-ID")}</span>
    );

  const imageUrl =
    product.product_image && product.product_image.length > 0
      ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" })
      : "/placeholder.svg?height=300&width=500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className="bg-white dark:bg-zinc-800/70 backdrop-blur-sm border border-neutral-200/80 dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 flex flex-col">
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-lg`} />
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.product_name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex justify-between items-center">
              <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                <Link href={`/dashboard/products/${product.id}`}>
                    <ExternalLink className="h-3 w-3 mr-1.5" /> Lihat Produk
                </Link>
              </Button>
              <Button
                variant="outline" size="icon"
                className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8"
                onClick={(e) => { e.preventDefault(); setIsFavorited(!isFavorited); }}
                aria-label="Tambah ke Wishlist"
              >
                <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} />
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
            {/* ... Konten CardContent tetap sama ... */}
            <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-2 text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2">
                {product.product_name}
                </h3>
                {product.by_organization && (
                <div className="text-[10px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="truncate max-w-[80px] sm:max-w-[100px]">{product.by_organization.organization_name}</span>
                </div>
                )}
            </div>
            <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
                {product.catalog?.slice(0, 3).map((cat) => (
                <Link key={cat.id} href={`/dashboard/catalog/${encodeURIComponent(cat.name)}`} passHref className="no-underline">
                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 font-normal border-neutral-300 dark:border-zinc-600 text-neutral-600 dark:text-zinc-400 group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-sm">
                    {cat.name}
                    </Badge>
                </Link>
                ))}
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center justify-between text-xs sm:text-sm mt-2">
                <div className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-white">
                {displayPrice}
                </div>
                <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="truncate max-w-[80px]">
                    {product.added_by ? product.added_by.name : "N/A"}
                </span>
                </div>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Komponen Skeleton (Tetap sama) ---
function ProductSkeleton() {
    return (
        <div className="rounded-lg border bg-white dark:bg-zinc-800/80 p-3 sm:p-4">
            <Skeleton className="aspect-video w-full rounded-md mb-3" />
            <Skeleton className="h-5 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/3 mb-3" />
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
        </div>
    );
}

// --- Komponen Halaman Utama (Default Export) ---
export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // <--- State untuk input
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // <--- State untuk debounce

  // --- Efek untuk Debounce ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Tunda 500ms setelah user berhenti mengetik

    // Cleanup timeout jika user mengetik lagi sebelum 500ms
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  // --- Efek untuk Mengambil Data ---
  useEffect(() => {
    async function fetchAllProducts(currentSearch: string) {
      setLoading(true);
      setError(null);
      try {
        // --- Membuat Filter String ---
        // 'your_users_collection' -> Ganti dengan nama koleksi user Anda (biasanya 'users')
        // 'your_orgs_collection' -> Ganti dengan nama koleksi organisasi Anda
        // Pastikan field relasi di 'danusin_product' adalah 'added_by' dan 'by_organization'
        // dan field nama di koleksi user adalah 'name' dan di orgs 'organization_name'.
        const filterString = currentSearch
          ? `(product_name ~ "${currentSearch}" || added_by.name ~ "${currentSearch}" || by_organization.organization_name ~ "${currentSearch}")`
          : ""; // Kosong jika tidak ada pencarian

        console.log("Filter:", filterString); // Untuk debug

        const resultList = await pb.collection("danusin_product").getFullList({
          sort: "-created",
          expand: "by_organization,added_by,catalog",
          $autoCancel: false,
          filter: filterString, // <--- Terapkan filter di sini
        });

        // Mapping data
        const details = resultList.map((item: any) => ({
            id: item.id, collectionId: item.collectionId, product_name: item.product_name, description: item.description, price: item.price, discount: item.discount, product_image: item.product_image || [],
            by_organization: item.expand?.by_organization ? { id: item.expand.by_organization.id, organization_name: item.expand.by_organization.organization_name, organization_slug: item.expand.by_organization.organization_slug } : null,
            added_by: item.expand?.added_by ? { id: item.expand.added_by.id, name: item.expand.added_by.name } : null,
            catalog: item.expand?.catalog ? item.expand.catalog.map((cat: any) => ({ id: cat.id, name: cat.name })) : null,
        }));

        setProducts(details);

      } catch (err: any) {
        if (err.name !== 'AbortError' && !err.isAbort) {
            console.error("Gagal mengambil produk:", err);
            // Periksa jika error karena filter pada relasi (mungkin permissions)
            if (err.message && err.message.includes('Failed to expand')) {
                setError("Gagal memfilter. Pastikan Anda memiliki izin akses ke data penjual/organisasi.");
            } else {
                setError("Tidak dapat memuat produk. Silakan coba lagi nanti.");
            }
        } else {
            console.log("Request dibatalkan:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAllProducts(debouncedSearchTerm); // Gunakan debounced term

  }, [debouncedSearchTerm]); // Jalankan ulang hanya saat debounced term berubah


  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-neutral-900 dark:text-white">
        Semua Produk
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mb-6">
        Jelajahi semua produk yang tersedia. Gunakan pencarian untuk menemukan apa yang Anda cari.
      </p>

      {/* --- Input Pencarian --- */}
      <div className="mb-8 relative">
        <Input
          type="search"
          placeholder="Cari produk, penjual, atau organisasi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 lg:w-1/3 pl-10 h-10" // Tambah padding kiri
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {/* --- Tampilan Grid / Loading / Error --- */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
            <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-neutral-50 dark:bg-zinc-800/50 p-6 rounded-lg">
          <p>
            {debouncedSearchTerm
              ? `Tidak ada produk yang cocok dengan pencarian "${debouncedSearchTerm}".`
              : "Saat ini belum ada produk yang tersedia."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}