"use client";

import React, { useEffect, useRef, useState, useCallback } from "react"; // Tambah useCallback
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { pb } from "@/lib/pocketbase";
import { Star, Users, Heart as HeartIcon, ExternalLink, User, Building2, Loader2 } from "lucide-react"; // Tambah Loader2
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast"; // Tambah useToast
import { ClientResponseError, RecordModel } from 'pocketbase'; // Tambah RecordModel & ClientResponseError

// --- Definisi Tipe Data ---
type Product = {
  id: string;
  collectionId: string; // Pastikan ada untuk pb.getFileUrl
  product_name: string;
  description: string;
  price: number;
  discount: number;
  product_image: string[];
  slug: string; // Tambahkan slug jika digunakan untuk link
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
  // Tambahkan expand jika belum ada di tipe Product dasar Anda
  expand?: {
      by_organization?: { id: string; organization_name: string; organization_slug: string; };
      added_by?: { id: string; name: string; };
      catalog?: { id: string; name: string; }[];
  }
};

type FavoriteRecord = RecordModel & {
  danusers_id: string;
  products_id: string[];
};

// Tipe Props baru untuk ProductCard
interface ProductCardProps {
  product: Product;
  currentUser: any | null; // Anda mungkin punya tipe User yang lebih spesifik
  favoriteIds: Set<string>;
  favoriteRecordId: string | null;
  updateLocalFavorites: (productId: string, action: 'add' | 'remove') => void;
  refreshFavorites: () => Promise<void>;
}

// --- Komponen ProductCard (Dengan Logika Favorit Penuh) ---
function ProductCard({ product, currentUser, favoriteIds, favoriteRecordId, updateLocalFavorites, refreshFavorites }: ProductCardProps) {
  const { toast } = useToast();
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  const isFavorited = favoriteIds.has(product.id);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      toast({ title: "Harap Login", description: "Anda harus login untuk mengubah favorit.", variant: "destructive" });
      return;
    }

    setLoadingFavorite(true);
    const wasFavorited = isFavorited;
    const currentRecordId = favoriteRecordId;

    try {
      const currentProducts = Array.from(favoriteIds);
      let newProducts: string[];

      if (wasFavorited) {
        newProducts = currentProducts.filter(id => id !== product.id);
      } else {
        newProducts = [...currentProducts, product.id];
      }
      newProducts = [...new Set(newProducts)]; // Pastikan unik

      if (currentRecordId) {
        await pb.collection('danusin_favorite').update(currentRecordId, { products_id: newProducts });
        updateLocalFavorites(product.id, wasFavorited ? 'remove' : 'add');
      } else {
        // Buat record baru jika belum ada
        await pb.collection('danusin_favorite').create<FavoriteRecord>({ danusers_id: currentUser.id, products_id: newProducts });
        await refreshFavorites(); // Refresh untuk mendapatkan ID baru dan update list
      }

      toast({
        title: "Favorit Diperbarui",
        description: `${product.product_name} ${wasFavorited ? 'dihapus dari' : 'ditambahkan ke'} favorit.`
      });

    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      let errMsg = "Gagal memperbarui favorit.";
      if (error instanceof ClientResponseError) { errMsg = error.response?.message || errMsg; }
      else if (error instanceof Error) { errMsg = error.message; }
      toast({ title: "Error", description: errMsg, variant: "destructive" });
      await refreshFavorites(); // Re-sync dengan server jika ada error
    } finally {
      setLoadingFavorite(false);
    }
  };

  const displayPrice = product.discount && product.discount > 0 ? (
    <>
      <span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">
        Rp{product.price.toLocaleString('id-ID')} {/* Ganti $ ke Rp */}
      </span>
      <span className="text-emerald-600 font-semibold"> Rp{product.discount.toLocaleString('id-ID')}</span> {/* Ganti $ ke Rp */}
    </>
  ) : (
    <span className="font-semibold">Rp{product.price.toLocaleString('id-ID')}</span> /* Ganti $ ke Rp */
  );

  const imageUrl =
    product.product_image && product.product_image.length > 0 && product.collectionId && product.id
      ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" })
      : "/placeholder.svg?height=300&width=500&text=" + encodeURIComponent(product.product_name.substring(0,2).toUpperCase());

  const organization = product.expand?.by_organization;
  const addedByUser = product.expand?.added_by;
  const catalogs = product.expand?.catalog;
  const productLink = `/dashboard/products/${product.id}`; // Gunakan slug jika ada

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.02, transition: { duration: 0.2 }, }} className="h-full">
      <Card className="bg-white dark:bg-zinc-800/70 backdrop-blur-sm border border-neutral-200/80 dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 flex flex-col">
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-lg`} />
        <div className="aspect-video relative overflow-hidden">
          <Link href={productLink} passHref className="block w-full h-full">
            <Image src={imageUrl} alt={product.product_name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=300&width=500&text=Error"; }}/>
          </Link>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="flex justify-between items-center pointer-events-auto">
              <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                <Link href={productLink}><ExternalLink className="h-3 w-3 mr-1.5" /> Lihat Produk</Link>
              </Button>
              <Button
                variant="outline" size="icon"
                className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8 disabled:opacity-50"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(); }} // Update onClick
                aria-label={isFavorited ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
                disabled={loadingFavorite || !currentUser} // Update disabled
              >
                {loadingFavorite
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} />
                }
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm sm:text-base line-clamp-1 text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2">
                  <Link href={productLink}>{product.product_name}</Link>
              </h3>
              {organization && (
                <Link href={`/dashboard/organizations/${organization.organization_slug || organization.id}`} className="no-underline text-[10px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1 flex-shrink-0 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="truncate max-w-[80px] sm:max-w-[100px]">{organization.organization_name}</span>
                </Link>
              )}
          </div>
          <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
            {catalogs?.slice(0, 2).map((cat) => ( // Slice ke 2 agar tidak terlalu ramai
              <Link key={cat.id} href={`/dashboard/catalog/${encodeURIComponent(cat.id)}`} passHref className="no-underline">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-normal border-neutral-300 dark:border-zinc-600 text-neutral-600 dark:text-zinc-400 group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-sm">
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
          <div className="text-base sm:text-lg text-neutral-900 dark:text-white mb-2">
              {displayPrice}
          </div>
          <div className="flex-1"></div> {/* Spacer */}
          {addedByUser && (
            <div className="flex items-center justify-end text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 border-t border-neutral-200 dark:border-zinc-700/60 pt-2 mt-2">
                <div className="flex items-center gap-1 truncate">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[100px]" title={addedByUser.name || 'N/A'}>
                        {addedByUser.name || 'N/A'}
                    </span>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}


// --- Komponen RecommendedProducts Utama ---
export function RecommendedProducts() {
  const { user: currentUser } = useAuth(); // Menggunakan currentUser agar konsisten
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true); // Ganti nama state loading produk
  const cancelTokensRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  // --- State dan Logika Favorit ---
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const fetchUserFavorites = useCallback(async (signal?: AbortSignal) => {
    if (!currentUser || !pb.authStore.isValid) {
      setFavoriteIds(new Set());
      setFavoriteRecordId(null);
      setLoadingFavorites(false);
      return;
    }
    setLoadingFavorites(true);
    try {
      const record = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`, { signal });
      if (!signal?.aborted) {
        setFavoriteIds(new Set(record.products_id || []));
        setFavoriteRecordId(record.id);
      }
    } catch (err: any) {
      if (!signal?.aborted) {
        if ((err instanceof ClientResponseError && err.status === 0) || err.name === 'AbortError') {
          console.warn("Favorite fetch was cancelled (Ignored).");
        } else if (err.status === 404) { // User belum punya record favorit
          setFavoriteIds(new Set());
          setFavoriteRecordId(null);
        } else {
          console.error("Failed to fetch favorites:", err);
          setFavoriteIds(new Set()); // Reset jika ada error lain
          setFavoriteRecordId(null);
        }
      } else {
        console.log("Favorite fetch aborted by component unmount or new request.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingFavorites(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const controller = new AbortController();
    if (currentUser) { // Hanya fetch jika currentUser sudah ada
        fetchUserFavorites(controller.signal);
    } else {
        setLoadingFavorites(false); // Jika tidak ada user, tidak perlu loading favorit
    }
    return () => {
      controller.abort();
    };
  }, [currentUser, fetchUserFavorites]); // Tambahkan fetchUserFavorites ke dependency array

  const updateLocalFavorites = useCallback((productId: string, action: 'add' | 'remove') => {
    setFavoriteIds(prevIds => {
      const newIds = new Set(prevIds);
      if (action === 'add') {
        newIds.add(productId);
      } else {
        newIds.delete(productId);
      }
      return newIds;
    });
  }, []);
  // --- Akhir State dan Logika Favorit ---

  useEffect(() => {
    isMountedRef.current = true;
    // Batalkan request sebelumnya
    cancelTokensRef.current.forEach((token) => pb.cancelRequest(token));
    cancelTokensRef.current = [];

    async function fetchRecommendedProductsInternal() {
      if (!isMountedRef.current) return;
      setLoadingProducts(true);
      try {
        const token = `recommended_products_${Date.now()}`;
        cancelTokensRef.current.push(token);
        const result = await pb.collection("danusin_product").getList(1, 6, {
          sort: "-created",
          expand: "by_organization,added_by,catalog",
          $autoCancel: false, // Kontrol pembatalan secara manual
          $cancelKey: token   // Kunci unik untuk pembatalan
        });

        if (!isMountedRef.current) return;
        
        const details = result.items.map((item: any) => ({
          id: item.id,
          collectionId: item.collectionId,
          product_name: item.product_name,
          description: item.description,
          price: item.price,
          discount: item.discount,
          product_image: item.product_image || [],
          slug: item.slug, // Pastikan slug ada di item
          expand: item.expand || {}, // Pastikan expand ada
          // Mapping manual untuk expand agar sesuai tipe Product
          by_organization: item.expand?.by_organization ? { id: item.expand.by_organization.id, organization_name: item.expand.by_organization.organization_name, organization_slug: item.expand.by_organization.organization_slug } : null,
          added_by: item.expand?.added_by ? { id: item.expand.added_by.id, name: item.expand.added_by.name } : null,
          catalog: item.expand?.catalog ? item.expand.catalog.map((cat: any) => ({ id: cat.id, name: cat.name })) : null,
        }));
        setProducts(details as Product[]);
      } catch (error: any) {
        if (error.name !== "AbortError" && !(error instanceof ClientResponseError && error.status === 0) ) {
             console.error("Fetch Error (Recommended Products):", error);
        } else {
            console.log("Recommended products fetch cancelled or aborted.");
        }
      }
      finally {
        if (isMountedRef.current) {
          setLoadingProducts(false);
        }
      }
    }
    fetchRecommendedProductsInternal();

    return () => {
      isMountedRef.current = false;
      cancelTokensRef.current.forEach((token) => pb.cancelRequest(token)); // Batalkan semua request saat unmount
    };
  }, []); // Hanya dijalankan sekali saat mount


  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4 flex flex-row justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Recommended Products</h2>
          <p className="text-sm text-muted-foreground">Discover the latest products from our community</p>
        </div>
        <div>
          <Button asChild variant="outline" size="sm" className="border-neutral-300 text-neutral-700 hover:bg-emerald-50/90 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 min-w-[90px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-md">
            <Link href="/dashboard/products/all">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {(loadingProducts || loadingFavorites) ? ( // Cek kedua loading state
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-white dark:bg-zinc-800 p-3">
                <Skeleton className="aspect-video w-full rounded-md mb-3" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentUser={currentUser}
                favoriteIds={favoriteIds}
                favoriteRecordId={favoriteRecordId}
                updateLocalFavorites={updateLocalFavorites}
                refreshFavorites={fetchUserFavorites} // Teruskan fungsi refresh yang benar
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}