"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { LayoutGrid, Package, ArrowLeft, AlertTriangle, Info, ExternalLink as ExternalLinkIcon, Building2, User as UserIcon, Heart as HeartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from '@/components/ui/use-toast';

// --- TIPE DATA ---
type CatalogDetail = RecordModel & {
    name: string;
    description?: string;
    // slug?: string; // Dihapus karena tidak ada di tabel danusin_catalog
};

type ProductDataForCard = RecordModel & {
    product_name: string;
    slug: string; // Slug produk, bukan katalog
    description: string;
    price: number;
    discount: number;
    product_image: string[];
    expand?: {
        by_organization?: { id: string; organization_name: string; organization_slug: string; };
        added_by?: { id: string; name: string; };
        catalog?: { id: string; name: string; }[]; // Ini adalah array dari record katalog
    }
    by_organization?: { id: string; organization_name: string; organization_slug: string; } | null;
    added_by?: { id: string; name: string; } | null;
    catalog?: string[] | { id: string; name: string; }[]; // Bisa jadi array ID atau array objek jika di-expand
    created: string;
};

// --- Komponen Skeleton ---
function CatalogDetailPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3"> <Skeleton className="h-9 w-9 rounded-md" /> <Skeleton className="h-8 w-1/2" /> </div>
            <Skeleton className="h-6 w-3/4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => ( <div key={i} className="rounded-lg border bg-card p-3 space-y-3"> <Skeleton className="aspect-video w-full rounded-md" /> <Skeleton className="h-5 w-3/4" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-4 w-1/3" /> </div> ))}
            </div>
        </div> );
}

// --- KOMPONEN PRODUCT CARD SEDERHANA (INLINE) ---
function ProductCard({ product }: { product: ProductDataForCard }) {
    const [isFavorited, setIsFavorited] = useState(false); 
    const displayPrice = product.discount && product.discount > 0 && product.discount < product.price ? ( <> <span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs"> Rp{product.price.toLocaleString('id-ID')} </span> <span className="text-emerald-600 dark:text-emerald-400"> Rp{product.discount.toLocaleString('id-ID')}</span> </> ) : ( <span>Rp{product.price.toLocaleString('id-ID')}</span> );
    const imageUrl = product.product_image && product.product_image.length > 0 && product.collectionId && product.id ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" }) : "/placeholder-product.png"; 
    
    const organization = product.expand?.by_organization || product.by_organization;
    const addedByUser = product.expand?.added_by || product.added_by;
    
    // Menangani 'catalog' yang bisa jadi array ID atau array objek
    let displayCatalogs: { id: string, name: string }[] = [];
    if (product.expand?.catalog) {
        displayCatalogs = Array.isArray(product.expand.catalog) ? product.expand.catalog : [product.expand.catalog];
    } else if (Array.isArray(product.catalog) && product.catalog.length > 0 && typeof product.catalog[0] === 'object') {
        displayCatalogs = product.catalog as { id: string, name: string }[];
    }
    // Jika product.catalog adalah array string (ID), Anda perlu logic tambahan untuk fetch nama katalognya jika ingin ditampilkan di sini.
    // Untuk kesederhanaan, ProductCard ini akan menampilkan dari expand.catalog.

    const productLink = `/dashboard/products/${product.slug || product.id}`;

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
                            <Button variant="outline" size="icon" className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8 rounded-full" onClick={(e) => { e.preventDefault(); setIsFavorited(!isFavorited); }} aria-label="Add to Wishlist">
                                <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} />
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2"> <Link href={productLink}>{product.product_name}</Link> </h3>
                        {organization && ( <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1 flex-shrink-0"> <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="truncate max-w-[80px] sm:max-w-[100px]">{organization.organization_name}</span> </div> )}
                    </div>
                     <div className="flex flex-wrap gap-1.5 mb-2 min-h-[22px]">
                        {displayCatalogs && displayCatalogs.length > 0 ? displayCatalogs.map((cat) => ( <Link key={cat.id} href={`/dashboard/catalog/${cat.id}`} passHref> <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal cursor-pointer hover:bg-muted/80"> {cat.name} </Badge> </Link> )) : ( <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">No Catalog</Badge> )}
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex items-end justify-between text-sm sm:text-base mt-2 pt-2 border-t border-border/60">
                        <div className="flex flex-col items-start gap-0.5 font-semibold text-foreground"> {displayPrice} </div>
                        {addedByUser && ( <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1"> <UserIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="truncate max-w-[70px] sm:max-w-[90px]">{addedByUser.name}</span> </div> )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

export default function CatalogDetailPage() {
    const params = useParams();
    const router = useRouter();
    const catalogIdFromUrl = params.slug as string; // Ubah nama variabel agar lebih jelas ini adalah ID

    const [catalog, setCatalog] = useState<CatalogDetail | null>(null);
    const [products, setProducts] = useState<ProductDataForCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCatalogAndProducts = useCallback(async (id: string, signal: AbortSignal) => {
        setLoading(true); setError(null);
        try {
            let catalogData: CatalogDetail | null = null;
            
            // Hanya fetch berdasarkan ID karena tabel danusin_catalog tidak punya 'slug'
            try {
                 console.log(`[CatalogDetail] Attempting to fetch catalog by ID: "${id}"`);
                 catalogData = await pb.collection('danusin_catalog').getOne<CatalogDetail>(id, { signal, $autoCancel: false });
            } catch (err: any) {
                if (signal.aborted) { console.log("[CatalogDetail] Fetch catalog by ID aborted."); throw err; }
                console.error(`[CatalogDetail] Failed to fetch catalog by ID "${id}":`, err);
                // Jika getOne gagal (misal 404), error akan dilempar ke catch utama
                throw err; 
            }
            
            if (signal.aborted) { console.log("[CatalogDetail] Aborted after fetching catalog data."); return; }
            setCatalog(catalogData);

            console.log(`[CatalogDetail] Fetching products for catalog ID: "${catalogData.id}"`);
            const productsResult = await pb.collection('danusin_product').getFullList<ProductDataForCard>({
                filter: `catalog ~ "${catalogData.id}"`, // Asumsi 'catalog' di produk adalah relasi ganda ke danusin_catalog
                expand: "by_organization,added_by,catalog", // expand 'catalog' di sini agar ProductCard bisa menampilkan nama katalog lain jika ada
                sort: '-created', 
                signal, 
                $autoCancel: false,
            });

            if (signal.aborted) { console.log("[CatalogDetail] Aborted after fetching products."); return; }
            setProducts(productsResult);

        } catch (err: any) {
            if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0)) {
                console.error("[CatalogDetail] Final error in fetchCatalogAndProducts:", err);
                if (err instanceof ClientResponseError && err.status === 404) { 
                    setError(`Katalog dengan ID "${id}" tidak ditemukan.`); 
                } else { 
                    setError("Gagal memuat data katalog dan produk."); 
                }
            } else {
                console.log("[CatalogDetail] Fetch catalog detail/products request was cancelled or resulted in status 0.");
            }
        } finally { 
            if (!signal.aborted) { setLoading(false); }
        }
    }, []);

    useEffect(() => {
        if (catalogIdFromUrl) {
            const controller = new AbortController();
            console.log(`[CatalogDetail] useEffect triggered for ID: ${catalogIdFromUrl}`);
            fetchCatalogAndProducts(catalogIdFromUrl, controller.signal);
            return () => {
                console.log(`[CatalogDetail] Cleanup useEffect for ID: ${catalogIdFromUrl}, aborting...`);
                controller.abort();
            }
        } else { 
            console.warn("[CatalogDetail] No catalog ID in params.");
            setError("ID katalog tidak ditemukan di URL."); 
            setLoading(false); 
        }
    }, [catalogIdFromUrl, fetchCatalogAndProducts]);

    if (loading) return <div className="p-4 md:p-8 w-full"><CatalogDetailPageSkeleton /></div>;
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button asChild variant="outline"><Link href="/dashboard/catalog/all">Kembali ke Daftar Katalog</Link></Button>
            </div>
        );
    }
    if (!catalog) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
                <Info className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Katalog Tidak Ditemukan</h2>
                <p className="text-muted-foreground mb-6">Katalog yang Anda cari tidak dapat ditemukan atau URL tidak valid.</p>
                <Button asChild variant="outline" className="mt-6"><Link href="/dashboard/catalog/all">Kembali ke Daftar Katalog</Link></Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="mb-6 md:mb-8">
                <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <div className="flex items-center gap-3">
                    <LayoutGrid className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{catalog.name}</h1>
                        {catalog.description && <p className="text-sm text-muted-foreground mt-1">{catalog.description}</p>}
                    </div>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg">
                    <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg">Belum ada produk dalam katalog ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} /> 
                    ))}
                </div>
            )}
        </div>
    );
}