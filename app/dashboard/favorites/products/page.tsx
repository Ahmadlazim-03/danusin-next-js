"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// --- Impor Ikon ---
import { Heart, PackageSearch, ExternalLink, User, Building2, Loader2, HeartOff, HeartIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
// --- Impor Tipe PocketBase ---
import { ClientResponseError, RecordModel } from 'pocketbase';

// --- Tipe Data Relasi ---
interface OrganizationData {
    id: string;
    organization_name: string;
    organization_slug: string;
}

interface UserData {
    id: string;
    name: string;
}

interface CatalogData {
    id: string;
    name: string;
}

// --- Tipe Produk ---
type Product = RecordModel & {
    product_name: string;
    description: string;
    price: number;
    discount: number;
    product_image: string[];
    slug: string;
    by_organization?: string;
    added_by?: string;
    catalog?: string[];
    expand?: {
        by_organization?: OrganizationData;
        added_by?: UserData;
        catalog?: CatalogData[];
    }
};

// --- Tipe FavoriteRecord ---
type FavoriteRecord = RecordModel & {
    danusers_id: string;
    products_id: string[];
    expand?: {
        products_id?: Product[];
    };
};

// --- Komponen FavoriteProductCard (Tidak Berubah) ---
function FavoriteProductCard({ product, currentUser, onUnfavorite }: { product: Product; currentUser: any | null, onUnfavorite: (productId: string) => void }) {
    const { toast } = useToast();
    const [loadingFavorite, setLoadingFavorite] = useState(false);

    const handleUnfavorite = async () => {
        if (!currentUser) { toast({ title: "Error", description: "Anda harus login.", variant: "destructive" }); return; }
        setLoadingFavorite(true);
        try {
            const favoriteRecord = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`);
            if (favoriteRecord && favoriteRecord.products_id) {
                const newFavoriteProductIds = favoriteRecord.products_id.filter(id => id !== product.id);
                await pb.collection('danusin_favorite').update(favoriteRecord.id, { products_id: newFavoriteProductIds });
                toast({ title: "Favorit Dihapus", description: `${product.product_name} dihapus dari favorit.` });
                onUnfavorite(product.id);
            }
        } catch (error) {
            console.error("Error removing from favorites:", error);
            toast({ title: "Error", description: "Gagal menghapus favorit.", variant: "destructive" });
        } finally {
            setLoadingFavorite(false);
        }
    };

    const displayPrice = product.discount && product.discount > 0 ? (<><span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">Rp{product.price.toLocaleString("id-ID")}</span><span className="text-emerald-600 dark:text-emerald-400"> Rp{product.discount.toLocaleString("id-ID")}</span></>) : (<span>Rp{product.price.toLocaleString("id-ID")}</span>);
    const imageUrl = product.product_image && product.product_image.length > 0 && product.collectionId && product.id ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" }) : "/placeholder.svg?height=300&width=500&text=" + encodeURIComponent(product.product_name.substring(0, 2).toUpperCase());
    const organization = product.expand?.by_organization;
    const addedByUser = product.expand?.added_by;
    const catalogs = product.expand?.catalog;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} className="h-full">
            <Card className="bg-white dark:bg-zinc-800/70 backdrop-blur-sm border border-neutral-200/80 dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-lg`} />
                <div className="aspect-video relative overflow-hidden">
                    <Image src={imageUrl} alt={product.product_name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=300&width=500&text=Error"; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex justify-between items-center">
                            <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                                <Link href={`/dashboard/products/${product.id}`}>
                                    <ExternalLink className="h-3 w-3 mr-1.5" /> Lihat Produk
                                </Link>
                            </Button>
                            <Button variant="outline" size="icon" className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-rose-500/70 dark:hover:border-rose-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all duration-200 w-8 h-8 disabled:opacity-50" onClick={(e) => { e.preventDefault(); handleUnfavorite(); }} aria-label="Hapus dari Wishlist" disabled={loadingFavorite || !currentUser} >
                                {loadingFavorite ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartOff className={`w-4 h-4 stroke-current group-hover:stroke-rose-400`} />}
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2 text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2">
                            {product.product_name}
                        </h3>
                        {organization && (<Link href={`/dashboard/organizations/${organization.organization_slug || organization.id}`} className="no-underline text-[10px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1 flex-shrink-0 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"><Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="truncate max-w-[80px] sm:max-w-[100px]">{organization.organization_name}</span></Link>)}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
                        {catalogs?.slice(0, 3).map((cat) => (<Link key={cat.id} href={`/dashboard/catalog/${encodeURIComponent(cat.id)}`} passHref className="no-underline"><Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 font-normal border-neutral-300 dark:border-zinc-600 text-neutral-600 dark:text-zinc-400 group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-sm">{cat.name}</Badge></Link>))}
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex items-center justify-between text-xs sm:text-sm mt-2">
                        <div className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-white">{displayPrice}</div>
                        {addedByUser && (<div className="text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1"><User className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="truncate max-w-[80px]">{addedByUser.name}</span></div>)}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// --- Komponen Skeleton ---
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


export default function FavoriteProductsPage() {
    const { user: currentUser } = useAuth();
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const fetchFavorites = useCallback(async (signal: AbortSignal) => {
        if (!currentUser) { setLoading(false); return; }
        setLoading(true); setError(null);
        try {
            const favoriteRecord = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`, { expand: 'products_id,products_id.by_organization,products_id.added_by,products_id.catalog', signal, });
            if (favoriteRecord?.expand?.products_id) {
                setFavoriteProducts(favoriteRecord.expand.products_id as Product[]);
            } else { setFavoriteProducts([]); }
        } catch (err: any) {
            if (err.name === 'AbortError' || err.isAbort || (err instanceof ClientResponseError && err.status === 0)) { console.log("Request untuk mengambil favorit dibatalkan."); }
            else if (err.status === 404) { setFavoriteProducts([]); }
            else { console.error("Gagal mengambil produk favorit:", err); setError("Gagal memuat produk favorit. Silakan coba lagi."); }
        } finally { if(!signal.aborted){ setLoading(false); } }
    }, [currentUser]);

    useEffect(() => {
        const controller = new AbortController();
        if (currentUser) { fetchFavorites(controller.signal); }
        else { setLoading(false); setFavoriteProducts([]); }
        return () => { controller.abort(); };
    }, [currentUser, fetchFavorites]);

    const handleProductUnfavorited = (productId: string) => {
        setFavoriteProducts(prev => prev.filter(p => p.id !== productId));
    };

    if (!currentUser && !loading) {
        return (
            // --- PERBAIKAN: Hapus container/padding dari sini ---
            <div className="text-center p-4 md:p-8">
                <Heart className="mx-auto h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
                <h1 className="text-xl font-semibold mb-2">Login untuk Melihat Favorit</h1>
                <p className="text-muted-foreground mb-6">Silakan login terlebih dahulu untuk mengakses daftar produk favorit Anda.</p>
                <Button asChild><Link href="/login">Login Sekarang</Link></Button>
            </div>
        )
    }

    return (
        // --- PERBAIKAN: Hapus kelas `container mx-auto p-4 md:p-8` ---
        // Biarkan layout induk yang mengatur padding jika perlu.
        // Anda mungkin perlu menambahkan padding *minimal* jika ternyata terlalu mepet,
        // misalnya `className="p-4"` atau `className="p-6"`.
        // Untuk saat ini, kita gunakan `div` biasa untuk menghilangkan gap.
        <div className=""> {/*<-- Ganti container dengan padding yang diinginkan atau div kosong */}
            {/* --- Tombol Kembali (Layout Sesuai Gambar) --- */}
            <Button
                variant="outline"
                onClick={() => router.back()}
                className="mb-4 group" // Jarak bawah agar tidak terlalu dekat dengan judul
            >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Kembali
            </Button>

            <div className="flex items-center mb-6 md:mb-8">
                <HeartIcon className="mr-3 h-7 w-7 text-rose-500 fill-rose-500" />
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
                    Produk Favorit Saya
                </h1>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[...Array(3)].map((_, i) => <ProductSkeleton key={i} />)}
                </div>
            ) : error ? (
                <div className="text-center py-10 text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                    <p className="text-lg">{error}</p>
                </div>
            ) : favoriteProducts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-neutral-50 dark:bg-zinc-800/30 p-8 rounded-lg shadow">
                    <PackageSearch className="mx-auto h-16 w-16 mb-6 text-gray-400 dark:text-gray-500" />
                    <h2 className="text-xl font-semibold mb-2 text-foreground">Anda Belum Memiliki Produk Favorit</h2>
                    <p className="mb-6 max-w-md mx-auto">Mulai tambahkan produk yang Anda sukai ke daftar favorit Anda!</p>
                    <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Link href="/dashboard/products/all">Telusuri Produk Sekarang</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {favoriteProducts.map((product) => (
                        <FavoriteProductCard
                            key={product.id}
                            product={product}
                            currentUser={currentUser}
                            onUnfavorite={handleProductUnfavorited}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}