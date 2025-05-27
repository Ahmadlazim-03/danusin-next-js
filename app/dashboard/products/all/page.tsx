"use client";

// --- Impor React & Hooks ---
import { useEffect, useState, useCallback } from "react";

// --- Impor Komponen UI (Pastikan Path Benar) ---
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

// --- Impor Library & Hook Kustom (Pastikan Path Benar) ---
import { pb } from "@/lib/pocketbase";
import { useAuth } from "@/components/auth/auth-provider";

// --- Impor PocketBase Types & Ikon ---
import { ClientResponseError, RecordModel } from 'pocketbase';
import { Heart as HeartIcon, ExternalLink, User, Building2, Search, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

// --- Definisi Tipe Data ---

interface OrganizationDataForProduct extends RecordModel {
    organization_name: string;
    organization_slug: string;
}

interface UserDataForProduct extends RecordModel {
    name: string;
}

interface CatalogDataForProduct extends RecordModel {
    id: string;
    name: string;
}

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
        by_organization?: OrganizationDataForProduct;
        added_by?: UserDataForProduct;
        catalog?: CatalogDataForProduct[];
    }
};

type FavoriteRecord = RecordModel & {
    danusers_id: string;
    products_id: string[];
};

// --- Tipe Props untuk ProductCard ---
interface ProductCardProps {
    product: Product;
    currentUser: any | null;
    favoriteIds: Set<string>;
    favoriteRecordId: string | null;
    updateLocalFavorites: (productId: string, action: 'add' | 'remove') => void;
    refreshFavorites: () => Promise<void>;
}

// --- Komponen ProductCard (Tetap Sama dari Versi Hybrid) ---

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
            newProducts = [...new Set(newProducts)];

            if (currentRecordId) {
                await pb.collection('danusin_favorite').update(currentRecordId, { products_id: newProducts });
                updateLocalFavorites(product.id, wasFavorited ? 'remove' : 'add');
            } else {
                await pb.collection('danusin_favorite').create<FavoriteRecord>({ danusers_id: currentUser.id, products_id: newProducts });
                await refreshFavorites();
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
             await refreshFavorites();
        } finally {
            setLoadingFavorite(false);
        }
    };

    // Render Logic
    const displayPrice = product.discount && product.discount > 0 ? (<><span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">Rp{product.price.toLocaleString("id-ID")}</span><span className="text-emerald-600 dark:text-emerald-400"> Rp{product.discount.toLocaleString("id-ID")}</span></>) : (<span>Rp{product.price.toLocaleString("id-ID")}</span>);
    const imageUrl = product.product_image && product.product_image.length > 0 && product.collectionId && product.id ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" }) : `/placeholder.svg?height=300&width=500&text=${encodeURIComponent(product.product_name.substring(0, 2).toUpperCase())}`;
    const organization = product.expand?.by_organization;
    const addedByUser = product.expand?.added_by;
    const catalogs = product.expand?.catalog;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} className="h-full">
            <Card className="bg-white dark:bg-zinc-800/70 backdrop-blur-sm border border-neutral-200/80 dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-lg`} />
                <div className="aspect-video relative overflow-hidden">
                    <Image src={imageUrl} alt={product.product_name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=300&width=500&text=Error"; }}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex justify-between items-center">
                            <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                                <Link href={`/dashboard/products/${product.id}`}>
                                    <ExternalLink className="h-3 w-3 mr-1.5" /> Lihat Produk
                                </Link>
                            </Button>
                            <Button
                                variant="outline" size="icon"
                                className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8 disabled:opacity-50"
                                onClick={(e) => { e.preventDefault(); handleToggleFavorite(); }}
                                aria-label={isFavorited ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
                                disabled={loadingFavorite || !currentUser}
                            >
                                {loadingFavorite ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} />}
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
                   {/* ... Sisa CardContent (Tidak Berubah) ... */}
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2 text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2">
                            {product.product_name}
                        </h3>
                        {organization && (
                            <Link href={`/dashboard/organizations/${organization.organization_slug || organization.id}`} className="no-underline text-[10px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1 flex-shrink-0 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="truncate max-w-[80px] sm:max-w-[100px]">{organization.organization_name}</span>
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
                        {catalogs?.slice(0, 3).map((cat: CatalogDataForProduct) => (
                            <Link key={cat.id} href={`/dashboard/catalog/${encodeURIComponent(cat.name)}`} passHref className="no-underline">
                                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 font-normal border-neutral-300 dark:border-zinc-600 text-neutral-600 dark:text-zinc-400 group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-sm">
                                    {cat.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex items-center justify-between text-xs sm:text-sm mt-2">
                        <div className="flex items-center gap-1 font-semibold text-neutral-900 dark:text-white">{displayPrice}</div>
                        {addedByUser && (
                            <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 flex items-center gap-0.5 sm:gap-1">
                                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="truncate max-w-[80px]">{addedByUser.name}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// --- Komponen Skeleton (Tetap sama) ---
function ProductSkeleton() {
    return (
        <div className="h-full">
            <Card className="bg-white dark:bg-zinc-800/70 border border-neutral-200/80 dark:border-zinc-700/60 overflow-hidden h-full flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                    <Skeleton className="w-full h-full absolute inset-0" />
                </div>
                <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <Skeleton className="h-4 w-2/3 mb-2" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <div className="flex gap-1 mb-2">
                        <Skeleton className="h-5 w-12 rounded" />
                        <Skeleton className="h-5 w-12 rounded" />
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex items-center justify-between mt-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Komponen Halaman Utama (Dengan Perbaikan Error & Client-Side Search) ---
export default function AllProductsPage() {
    const { user: currentUser } = useAuth();
    // --- State Baru untuk Client-Side Search ---
    const [allProducts, setAllProducts] = useState<Product[]>([]); // Menyimpan SEMUA produk
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Menyimpan produk yang TAMPIL
    // --- Akhir State Baru ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
    const [loadingFavorites, setLoadingFavorites] = useState(true);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
        return () => { clearTimeout(handler); };
    }, [searchTerm]);

    // Fungsi fetchUserFavorites dengan penanganan error 0
    const fetchUserFavorites = useCallback(async (signal?: AbortSignal) => {
        if (!currentUser || !pb.authStore.isValid) {
            setFavoriteIds(new Set()); setFavoriteRecordId(null); setLoadingFavorites(false); return;
        }
        setLoadingFavorites(true);
        try {
            const record = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`, { signal });
            if (!signal?.aborted) { setFavoriteIds(new Set(record.products_id || [])); setFavoriteRecordId(record.id); }
        } catch (err: any) {
            if (!signal?.aborted) {
                if ((err instanceof ClientResponseError && err.status === 0) || err.name === 'AbortError') {
                    console.warn("Favorite fetch was cancelled (Ignored).");
                } else if (err.status === 404) {
                    setFavoriteIds(new Set()); setFavoriteRecordId(null);
                } else {
                    console.error("Failed to fetch favorites:", err); setFavoriteIds(new Set()); setFavoriteRecordId(null);
                }
            } else { console.log("Favorite fetch aborted."); }
        } finally { if (!signal?.aborted) { setLoadingFavorites(false); } }
    }, [currentUser]);

    // useEffect untuk load awal favorit dengan AbortController
    useEffect(() => {
        const controller = new AbortController();
        fetchUserFavorites(controller.signal);
        return () => { controller.abort(); };
    }, [fetchUserFavorites]);

    // Fungsi Update Lokal
    const updateLocalFavorites = useCallback((productId: string, action: 'add' | 'remove') => {
        setFavoriteIds(prevIds => {
            const newIds = new Set(prevIds);
            if (action === 'add') { newIds.add(productId); } else { newIds.delete(productId); }
            return newIds;
        });
    }, []);

    // Fetch SEMUA products (tanpa filter DB)
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        let isMounted = true;

        async function fetchAllProducts() {
            if (!isMounted) return;
            setLoading(true);
            setError(null);

            try {
                // Ambil SEMUA produk dengan expand. HATI-HATI JIKA DATA SANGAT BESAR!
                const resultList = await pb.collection("danusin_product").getFullList<Product>(
                    {
                        sort: "-created",
                        expand: "by_organization,added_by,catalog", // Expand tetap penting
                        // filter: "", // HAPUS filter dari sini
                        signal: signal,
                    }
                );
                if (isMounted) {
                    setAllProducts(resultList as Product[]); // Simpan ke allProducts
                    setFilteredProducts(resultList as Product[]); // Awalnya tampilkan semua
                }
            } catch (err: any) {
                if (!isMounted) return;
                 if ((err instanceof ClientResponseError && err.status === 0) || err.name === 'AbortError' || err.isAbort) {
                    console.warn("Product fetch was cancelled (Ignored).");
                 } else {
                    console.error("Gagal mengambil produk:", err);
                    setError("Tidak dapat memuat produk. Silakan coba lagi nanti.");
                }
            } finally {
                if (isMounted) { setLoading(false); }
            }
        }

        fetchAllProducts();

        return () => { isMounted = false; controller.abort(); };
    }, []); // Hanya jalankan sekali saat mount

    // --- PERBAIKAN: useEffect untuk Client-Side Filtering ---
    useEffect(() => {
        if (!debouncedSearchTerm) {
            setFilteredProducts(allProducts); // Jika search kosong, tampilkan semua
            return;
        }

        const lowerCaseSearch = debouncedSearchTerm.toLowerCase();

        const filtered = allProducts.filter(product => {
            const productNameMatch = product.product_name?.toLowerCase().includes(lowerCaseSearch);
            const orgNameMatch = product.expand?.by_organization?.organization_name?.toLowerCase().includes(lowerCaseSearch);
            const creatorNameMatch = product.expand?.added_by?.name?.toLowerCase().includes(lowerCaseSearch);

            return productNameMatch || orgNameMatch || creatorNameMatch;
        });

        setFilteredProducts(filtered); // Update produk yang ditampilkan

    }, [debouncedSearchTerm, allProducts]); // Jalankan saat search atau data berubah
    // --- Akhir Perbaikan Client-Side Filtering ---

    return (
        <div className="container mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-neutral-900 dark:text-white">Semua Produk</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-6">Jelajahi semua produk. Cari berdasarkan nama produk, organisasi, atau penjual.</p>
            <div className="mb-8 relative">
                <Input
                    type="search"
                    placeholder="Cari produk, organisasi, atau penjual..." // Placeholder diperbarui
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-2/3 lg:w-1/2 pl-10 h-11 text-base"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            {(loading || loadingFavorites) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
                </div>
            ) : error ? (
                 <div className="text-center py-10 text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg"><p className="text-lg">{error}</p><Button onClick={() => { setDebouncedSearchTerm(""); setSearchTerm(""); }} variant="outline" className="mt-4">Reset Pencarian & Coba Lagi</Button></div>
            ) : filteredProducts.length === 0 ? ( // Gunakan filteredProducts
                <div className="text-center py-10 text-muted-foreground bg-neutral-50 dark:bg-zinc-800/50 p-6 rounded-lg">
                    <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg">
                        {debouncedSearchTerm ? `Tidak ada produk yang cocok dengan "${debouncedSearchTerm}".` : "Saat ini belum ada produk yang tersedia."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredProducts.map((product) => ( // Gunakan filteredProducts
                        <ProductCard
                            key={product.id}
                            product={product}
                            currentUser={currentUser}
                            favoriteIds={favoriteIds}
                            favoriteRecordId={favoriteRecordId}
                            updateLocalFavorites={updateLocalFavorites}
                            refreshFavorites={fetchUserFavorites}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}