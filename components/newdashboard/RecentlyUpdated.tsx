"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Clock, Package, ExternalLink as ExternalLinkIcon, 
    Building2, User as UserIcon, Heart as HeartIcon, Loader2 // Tambahkan Loader2
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/use-toast";

// Tipe Data Product
type ProductDataForCard = RecordModel & {
  product_name: string;
  slug: string;
  description?: string;
  price: number;
  discount?: number;
  product_image: string[];
  expand?: {
    by_organization?: { id: string; organization_name: string; organization_slug: string; };
    added_by?: { id: string; name: string; };
    catalog?: { id: string; name: string; }[];
  }
  by_organization?: { id: string; organization_name: string; organization_slug: string; } | null;
  added_by?: { id: string; name: string; } | null;
  catalog?: { id: string; name: string; }[]; 
  created: string;
};

// Tipe untuk data favorit
type FavoriteRecord = RecordModel & {
    danusers_id: string;
    products_id: string[];
};

// Props baru untuk ProductCard
interface ProductCardProps {
    product: ProductDataForCard;
    currentUser: any | null;
    favoriteIds: Set<string>;
    favoriteRecordId: string | null;
    updateLocalFavorites: (productId: string, action: 'add' | 'remove') => void;
    refreshFavorites: () => Promise<void>;
}


// --- Komponen ProductCard dengan Logika Favorit ---
function ProductCard({ 
    product, 
    currentUser, 
    favoriteIds, 
    favoriteRecordId, 
    updateLocalFavorites, 
    refreshFavorites 
}: ProductCardProps) {
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
        try {
            const currentProducts = Array.from(favoriteIds);
            let newProducts: string[];
            if (wasFavorited) {
                newProducts = currentProducts.filter(id => id !== product.id);
            } else {
                newProducts = [...currentProducts, product.id];
            }
            newProducts = [...new Set(newProducts)];

            if (favoriteRecordId) {
                await pb.collection('danusin_favorite').update(favoriteRecordId, { products_id: newProducts });
                updateLocalFavorites(product.id, wasFavorited ? 'remove' : 'add');
            } else {
                await pb.collection('danusin_favorite').create<FavoriteRecord>({ 
                    danusers_id: currentUser.id, 
                    products_id: newProducts 
                });
                await refreshFavorites(); // Untuk mendapatkan favoriteRecordId baru dan update set
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
            await refreshFavorites(); // Re-sync jika error
        } finally {
            setLoadingFavorite(false);
        }
    };

    const displayPrice = product.discount && product.discount > 0 && product.discount < product.price ? (
        <>
            <span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">
                Rp{product.price.toLocaleString('id-ID')}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm sm:text-base">
                {' '}Rp{product.discount.toLocaleString('id-ID')}
            </span>
        </>
    ) : (
        <span className="font-semibold text-sm sm:text-base">Rp{product.price.toLocaleString('id-ID')}</span>
    );
    const imageUrl = product.product_image && product.product_image.length > 0 && product.collectionId && product.id
        ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" })
        : "/placeholder-product.png"; 
    const organization = product.expand?.by_organization || product.by_organization;
    const addedByUser = product.expand?.added_by || product.added_by;
    const catalogsRaw = product.expand?.catalog || product.catalog;
    const catalogs = Array.isArray(catalogsRaw) ? catalogsRaw : (catalogsRaw ? [catalogsRaw] : []);
    const productLink = `/dashboard/products/${product.id}`;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.03, boxShadow: "0px 7px 15px rgba(0,0,0,0.07), 0px 3px 6px rgba(0,0,0,0.05)", }} className="h-full" >
            <Card className="bg-card dark:bg-zinc-800/70 backdrop-blur-sm border border-border dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 flex flex-col shadow-sm hover:shadow-md">
                <div className="aspect-[4/3] relative overflow-hidden">
                    <Image src={imageUrl} alt={product.product_name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-product.png"; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex justify-between items-center">
                           <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                               <Link href={productLink}> <ExternalLinkIcon className="h-3 w-3 mr-1.5" /> Lihat Produk </Link>
                           </Button>
                            <Button variant="outline" size="icon" className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8 rounded-full disabled:opacity-50" 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(); }} 
                                aria-label={isFavorited ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
                                disabled={loadingFavorite || !currentUser}
                            >
                                {loadingFavorite ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} />}
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
                    {/* ... (Konten Card sama seperti sebelumnya) ... */}
                    <div className="flex justify-between items-start mb-1.5"> <h3 className="font-semibold text-base sm:text-lg line-clamp-2 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2"> <Link href={productLink}>{product.product_name}</Link> </h3> {organization && ( <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1 flex-shrink-0"> <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="truncate max-w-[80px] sm:max-w-[100px]">{organization.organization_name}</span> </div> )} </div>
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[22px]"> {catalogs && catalogs.length > 0 ? catalogs.map((cat) => ( <Link key={cat.id} href={`/dashboard/catalog/${cat.id}`} passHref> <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal cursor-pointer hover:bg-muted/80"> {cat.name} </Badge> </Link> )) : ( <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">No Catalog</Badge> )} </div>
                    <div className="flex-1"></div>
                    <div className="flex items-end justify-between text-sm sm:text-base mt-2 pt-2 border-t border-border/60"> <div className="flex items-baseline gap-1.5 font-semibold text-foreground"> {displayPrice} </div> {addedByUser && ( <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1"> <UserIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="truncate max-w-[70px] sm:max-w-[90px]">{addedByUser.name}</span> </div> )} </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// Komponen Skeleton untuk RecentlyUpdated
function RecentlyUpdatedSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"> {/* Disesuaikan menjadi 3 kolom */}
            {[...Array(3)].map((_, index) => (
                <div key={index} className="rounded-lg border bg-card p-3 space-y-3 animate-pulse">
                    <Skeleton className="aspect-[4/3] w-full rounded-md" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                     <div className="flex items-center justify-between mt-3">
                        <Skeleton className="h-6 w-20 rounded" />
                        <Skeleton className="h-6 w-10 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function RecentlyUpdated() {
    const { user: currentUser } = useAuth(); // Tambahkan useAuth
    const [products, setProducts] = useState<ProductDataForCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- State untuk Favorit ---
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
    const [loadingFavorites, setLoadingFavorites] = useState(true); // Untuk loading awal favorit
    // --------------------------

    const itemsToFetch = 6; // Maksimal 6 produk (3x2 baris)

    // --- Logika Favorit ---
    const fetchUserFavorites = useCallback(async (signal?: AbortSignal) => {
        if (!currentUser || !pb.authStore.isValid) {
            setFavoriteIds(new Set()); setFavoriteRecordId(null); setLoadingFavorites(false); return;
        }
        // Tidak set loadingFavorites true di sini agar tidak mengganggu loading utama produk
        try {
            const record = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`, { signal, $autoCancel: false });
            if (!signal?.aborted) { setFavoriteIds(new Set(record.products_id || [])); setFavoriteRecordId(record.id); }
        } catch (err: any) {
            if (!signal?.aborted) {
                if ((err instanceof ClientResponseError && err.status === 0) || err.name === 'AbortError') { console.warn("Favorite fetch cancelled."); }
                else if (err.status === 404) { setFavoriteIds(new Set()); setFavoriteRecordId(null); }
                else { console.error("Failed to fetch favorites:", err); setFavoriteIds(new Set()); setFavoriteRecordId(null); }
            }
        } finally { if (!signal?.aborted) { setLoadingFavorites(false); } }
    }, [currentUser]);

    useEffect(() => {
        const controller = new AbortController();
        if (currentUser) { setLoadingFavorites(true); fetchUserFavorites(controller.signal); } 
        else { setLoadingFavorites(false); }
        return () => controller.abort();
    }, [currentUser, fetchUserFavorites]);

    const updateLocalFavorites = useCallback((productId: string, action: 'add' | 'remove') => {
        setFavoriteIds(prevIds => {
            const newIds = new Set(prevIds);
            if (action === 'add') { newIds.add(productId); } else { newIds.delete(productId); }
            return newIds;
        });
    }, []);
    // --- Akhir Logika Favorit ---

    const fetchLatestProducts = useCallback(async (signal: AbortSignal) => {
        setLoading(true); setError(null);
        try {
            const result = await pb.collection('danusin_product').getList<ProductDataForCard>(1, itemsToFetch, {
                sort: '-created', expand: 'by_organization,added_by,catalog', signal, $autoCancel: false,
            });
            if (!signal.aborted) { setProducts(result.items); }
        } catch (err: any) {
            if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) && !signal.aborted) {
                console.error("Failed to fetch latest products:", err); setError("Gagal memuat produk terbaru.");
            } else { console.log("Fetch latest products request was cancelled."); }
        } finally { if (!signal.aborted) { setLoading(false); } }
    }, [itemsToFetch]);

    useEffect(() => {
        const controller = new AbortController();
        fetchLatestProducts(controller.signal);
        return () => { controller.abort(); };
    }, [fetchLatestProducts]);

    if (loading || loadingFavorites) { // Tambahkan loadingFavorites ke kondisi loading utama
        return ( <section className="mb-6 md:mb-10"> <div className="flex items-center justify-between mb-4 md:mb-6"> <Skeleton className="h-8 w-1/3" /> <Skeleton className="h-10 w-24" /> </div> <RecentlyUpdatedSkeleton /> </section> );
    }
    if (error) { return <div className="mb-6 md:mb-10 p-4 text-center text-red-500">{error} <Button onClick={() => fetchLatestProducts(new AbortController().signal)} variant="outline" className="mt-2">Coba Lagi</Button></div>; }
    
    return (
        <section className="mb-6 md:mb-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center text-neutral-800 dark:text-white">
                    <Clock className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Produk Terbaru Ditambahkan
                </h2>
                <Button variant="outline" size="sm" className="border-neutral-300 text-neutral-700 hover:bg-emerald-50/90 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 min-w-[90px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-md" asChild >
                    <Link href="/dashboard/products/all">Lihat Semua</Link>
                </Button>
            </div>
            {products.length === 0 && !loading ? (
                   <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg"> <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" /> <p className="text-lg">Belum ada produk terbaru untuk ditampilkan.</p> </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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
        </section>
    );
}