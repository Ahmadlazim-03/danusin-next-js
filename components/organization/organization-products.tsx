"use client"

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast, useToast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase"; // Added RecordModel, ClientResponseError
import { MoreHorizontal, Plus, Package, Pencil, Trash2, Heart as HeartIcon, ExternalLink, User, Building2, Loader2 } from "lucide-react"; // Added Loader2
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth/auth-provider"; // Assuming AuthContextType is updated with 'loading'
import { useRouter } from "next/navigation";

// Tipe Data Catalog
type CatalogFormData = {
    id: string;
    name: string;
    created_by: string;
    organization?: string;
};

// Tipe Data Product (ensuring it's a RecordModel for pb.getFileUrl)
type ProductDataForCard = RecordModel & {
    product_name: string;
    slug: string;
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
    }[]; // Changed to non-optional and array of objects for consistency
    created: string;
    // Ensure expand is available if used, or rely on direct properties
    expand?: {
        by_organization?: { id: string; organization_name: string; organization_slug: string; };
        added_by?: { id: string; name: string; };
        catalog?: { id: string; name: string; }[];
    }
};

// Tipe untuk data favorit
type FavoriteRecord = RecordModel & {
    danusers_id: string;
    products_id: string[];
};


interface OrganizationProductsProps {
    organizationId: string;
    userRole: string | null;
}

// Props for ProductCard with favorite functionality
interface OrgProductCardProps {
    product: ProductDataForCard;
    currentUser: any | null;
    favoriteIds: Set<string>;
    favoriteRecordId: string | null;
    updateLocalFavorites: (productId: string, action: 'add' | 'remove') => void;
    refreshFavorites: () => Promise<void>;
    // For edit/delete, passed from parent if needed, or handled internally if permissions allow
    canManageProduct?: boolean;
    onEdit?: (slug: string) => void;
    onDelete?: (productId: string, productName: string) => void; // Pass product name for dialog
}


// --- Fungsi untuk membuat slug ---
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// --- Komponen ProductCard (Modified for Favorites) ---
function ProductCard({
    product,
    currentUser,
    favoriteIds,
    favoriteRecordId,
    updateLocalFavorites,
    refreshFavorites,
    // canManageProduct, onEdit, onDelete // these would be for dropdown, kept separate for now
}: OrgProductCardProps) {
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
            const currentFavoriteProductIds = Array.from(favoriteIds);
            let newFavoriteProductIds: string[];

            if (wasFavorited) {
                newFavoriteProductIds = currentFavoriteProductIds.filter(id => id !== product.id);
            } else {
                newFavoriteProductIds = [...currentFavoriteProductIds, product.id];
            }
            newFavoriteProductIds = [...new Set(newFavoriteProductIds)];

            if (favoriteRecordId) {
                await pb.collection('danusin_favorite').update(favoriteRecordId, { products_id: newFavoriteProductIds });
                updateLocalFavorites(product.id, wasFavorited ? 'remove' : 'add');
            } else {
                await pb.collection('danusin_favorite').create<FavoriteRecord>({
                    danusers_id: currentUser.id,
                    products_id: newFavoriteProductIds
                });
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

    const displayPrice = product.discount && product.discount > 0 && product.discount < product.price ? (
        <>
            <span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">
                Rp {product.price.toLocaleString('id-ID')}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
                {' '}Rp {product.discount.toLocaleString('id-ID')}
            </span>
        </>
    ) : (
        <span>Rp {product.price.toLocaleString('id-ID')}</span>
    );

    const imageUrl =
        product.product_image && product.product_image.length > 0
            ? pb.getFileUrl(product, product.product_image[0], { thumb: "500x300" })
            : "/placeholder-product.png";

    const productLink = `/dashboard/products/${product.slug || product.id}`;


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{
                scale: 1.03,
                boxShadow: "0px 7px 15px rgba(0,0,0,0.07), 0px 3px 6px rgba(0,0,0,0.05)",
            }}
            className="h-full"
        >
            <Card className="bg-card dark:bg-zinc-800/70 backdrop-blur-sm border border-border dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 flex flex-col shadow-sm hover:shadow-md">
                <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-15 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-lg`} />
                <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={product.product_name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-product.png"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex justify-between items-center">
                           <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                                <Link href={productLink}>
                                    <ExternalLink className="h-3 w-3 mr-1.5" /> View Product
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8 rounded-full disabled:opacity-50"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(); }}
                                aria-label={isFavorited ? "Remove from Wishlist" : "Add to Wishlist"}
                                disabled={loadingFavorite || !currentUser}
                            >
                                {loadingFavorite ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} />}
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 flex-1 pr-2">
                            <Link href={productLink}>{product.product_name}</Link>
                        </h3>
                        {product.by_organization && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 sm:gap-1 flex-shrink-0 cursor-help">
                                            <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            <span className="truncate max-w-[80px] sm:max-w-[100px]">{product.by_organization.organization_name}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{product.by_organization.organization_name}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[22px]">
                        {product.catalog?.map((cat) => (
                            <Link key={cat.id} href={`/dashboard/catalog/${slugify(cat.id)}`} passHref>
                                <Badge
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5 font-normal border-border text-muted-foreground group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-sm"
                                >
                                    {cat.name}
                                </Badge>
                            </Link>
                        ))}
                        {(!product.catalog || product.catalog.length === 0) && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal border-border text-muted-foreground">
                                No Catalog
                            </Badge>
                        )}
                    </div>
                    <div className="flex-1"></div> {/* Spacer */}
                    <div className="flex items-end justify-between text-sm sm:text-base mt-2 pt-2 border-t border-border/60">
                        <div className="flex flex-col items-start gap-0.5 font-semibold text-foreground">
                            {displayPrice}
                        </div>
                        {product.added_by && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                                            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            <span className="truncate max-w-[70px] sm:max-w-[90px]">
                                                {product.added_by.name}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Added by: {product.added_by.name}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// --- Komponen Skeleton Produk ---
function ProductListSkeleton() {
    return (
        <div className="flex flex-col gap-2 p-4 bg-card rounded-lg border border-border shadow-sm">
            <Skeleton className="aspect-[4/3] w-full rounded-md" />
            <div className="flex flex-col gap-2 mt-2">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <div className="flex items-center justify-between mt-3">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-10 rounded-full" />
            </div>
        </div>
    );
}

// --- Komponen Tampilan Kosong Produk ---
function ProductEmptyState({ onAddClick, canManage }: { onAddClick: () => void, canManage: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 bg-card rounded-lg border border-border shadow-sm text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2 text-foreground">Belum Ada Produk</h2>
            <p className="text-muted-foreground mb-4 px-4">
                {canManage
                    ? "Anda belum menambahkan produk apapun. Mulai dengan menambahkan produk pertama Anda."
                    : "Saat ini belum ada produk yang tersedia di organisasi ini."}
            </p>
            {canManage && (
                <Button onClick={onAddClick} className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
            )}
        </div>
    );
}

// --- Komponen Utama: OrganizationProducts ---
export function OrganizationProducts({
    organizationId,
    userRole,
}: OrganizationProductsProps) {
    const { user: currentUser } = useAuth();
    const authLoading = false; // Set to false or handle loading state as appropriate for your app
    const [products, setProducts] = useState<ProductDataForCard[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true); // Renamed for clarity
    const [isSubmitting, setIsSubmitting] = useState(false); // For status delete

    // Favorite States
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
    const [loadingFavorites, setLoadingFavorites] = useState(true); // True initially

    const canManageProducts = userRole === "admin" || userRole === "moderator";
    const isMountedRef = useRef(true);
    const router = useRouter();

    const fetchUserFavorites = useCallback(async (signal?: AbortSignal) => {
        if (!currentUser || !pb.authStore.isValid) {
            setFavoriteIds(new Set()); setFavoriteRecordId(null); setLoadingFavorites(false); return;
        }
        // setLoadingFavorites(true); // Only set true by the calling useEffect for initial load
        try {
            const record = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`, { signal, $autoCancel: false });
            if (!signal?.aborted) { setFavoriteIds(new Set(record.products_id || [])); setFavoriteRecordId(record.id); }
        } catch (err: any) {
            if (!signal?.aborted) {
                if ((err instanceof ClientResponseError && err.status === 0) || err.name === 'AbortError') { console.warn("Favorite fetch cancelled/network error."); }
                else if (err.status === 404) { setFavoriteIds(new Set()); setFavoriteRecordId(null); }
                else { console.error("Failed to fetch favorites:", err); setFavoriteIds(new Set()); setFavoriteRecordId(null); }
            }
        } finally { if (!signal?.aborted) { setLoadingFavorites(false); } }
    }, [currentUser]);

    useEffect(() => {
        const controller = new AbortController();
        if (currentUser) {
            setLoadingFavorites(true); // For initial load or when user changes
            fetchUserFavorites(controller.signal);
        } else if (!authLoading) { // Not loading auth and no user
            setFavoriteIds(new Set());
            setFavoriteRecordId(null);
            setLoadingFavorites(false);
        }
        return () => controller.abort();
    }, [currentUser, authLoading, fetchUserFavorites]);

    const updateLocalFavorites = useCallback((productId: string, action: 'add' | 'remove') => {
        setFavoriteIds(prevIds => {
            const newIds = new Set(prevIds);
            if (action === 'add') { newIds.add(productId); } else { newIds.delete(productId); }
            return newIds;
        });
    }, []);

    const fetchCatalogsAndProducts = useCallback(async (controller: AbortController) => {
        if (!organizationId) {
            setLoadingProducts(false); return;
        }
        setLoadingProducts(true);
        let localFetchedCatalogs: CatalogFormData[] = [];

        try {
             try {
                const catalogsResult = await pb.collection("danusin_catalog").getFullList<CatalogFormData>({ // Typed getFullList
                    sort: 'name', signal: controller.signal, $autoCancel: false,
                });
                if (isMountedRef.current && !controller.signal.aborted) {
                    localFetchedCatalogs = catalogsResult.map((item: any) => ({ // Use item type if more specific
                        id: item.id,
                        name: item['T name'] || item.name || "N/A", // Handle potential naming inconsistencies
                        created_by: item.created_by,
                        organization: item.organization,
                    }));
                }
            } catch (catalogError: any) {
                 if (catalogError.name !== "AbortError" && !catalogError.isAbort && isMountedRef.current && !controller.signal.aborted) {
                    console.error("Error fetching catalogs:", catalogError);
                }
            }

            if (!isMountedRef.current || controller.signal.aborted) return;

            const productsResult = await pb.collection("danusin_product").getList(1, 100, { // Consider pagination for more than 100 products
                filter: `by_organization="${organizationId}"`,
                sort: '-created',
                expand: "catalog,added_by,by_organization",
                signal: controller.signal, $autoCancel: false,
            });

            if (!isMountedRef.current || controller.signal.aborted) return;

            const productsData = productsResult.items.map((p: any): ProductDataForCard => { // Explicit return type
                let mappedCatalogs: { id: string, name: string }[] = [];
                if (p.expand?.catalog) {
                    const expanded = Array.isArray(p.expand.catalog) ? p.expand.catalog : [p.expand.catalog];
                    mappedCatalogs = expanded
                        .filter((cat: any) => cat) // Ensure cat is not null/undefined
                        .map((cat: any) => ({
                            id: cat.id,
                            name: cat['T name'] || cat.name || "Unknown Catalog"
                        }));
                } else if (p.catalog) { // Fallback if expand failed but direct IDs are present
                     const catalogIds = Array.isArray(p.catalog) ? p.catalog : [p.catalog];
                     mappedCatalogs = catalogIds
                        .filter((catId: string) => catId)
                        .map((catId: string) => {
                             const foundCat = localFetchedCatalogs.find(fc => fc.id === catId);
                             return { id: catId, name: foundCat?.name || "Unknown Catalog" };
                         });
                }

                return {
                    id: p.id, collectionId: p.collectionId, collectionName: p.collectionName,
                    product_name: p.product_name || p.name || "Unnamed Product", // Fallback for product name
                    slug: p.slug || slugify(p.product_name || p.name || p.id), // Generate slug if missing
                    description: p.description || "",
                    price: parseFloat(p.price) || 0, discount: parseFloat(p.discount) || 0,
                    product_image: p.product_image || [],
                    by_organization: p.expand?.by_organization ? {
                        id: p.expand.by_organization.id,
                        organization_name: p.expand.by_organization.organization_name,
                        organization_slug: p.expand.by_organization.organization_slug,
                    } : null,
                    added_by: p.expand?.added_by ? {
                        id: p.expand.added_by.id, name: p.expand.added_by.name || "Unknown User",
                    } : null,
                    catalog: mappedCatalogs,
                    created: p.created,
                    // Add other RecordModel fields if necessary, or cast 'p' as RecordModel if it fits
                    updated: p.updated, // Example
                    '@instanceId': p['@instanceId'], // Example
                    expand: p.expand, // Keep expand if other parts of app use it directly
                };
            });
            setProducts(productsData);

        } catch (error: any) {
            if (error.name !== "AbortError" && !error.isAbort && isMountedRef.current && !controller.signal.aborted) {
                console.error("Error fetching products:", error);
                toast({ title: "Error", description: `Tidak dapat memuat produk: ${error.message}`, variant: "destructive" });
            }
        } finally {
            if (isMountedRef.current && !controller.signal.aborted) setLoadingProducts(false);
        }
    }, [organizationId]); // Removed toast from dependencies, as it's stable

    useEffect(() => {
        isMountedRef.current = true;
        const controller = new AbortController();
        fetchCatalogsAndProducts(controller);
        return () => {
            isMountedRef.current = false;
            controller.abort();
        };
    }, [fetchCatalogsAndProducts]);

    const handleDeleteProduct = async (productId: string) => {
        setIsSubmitting(true);
        try {
            await pb.collection("danusin_product").delete(productId);
            toast({ title: "Sukses", description: "Produk berhasil dihapus." });
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (error: any) {
            console.error("Delete Error:", error.data || error);
            toast({ title: "Error", description: `Gagal menghapus produk: ${error.data?.message || error.message}`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddClick = () => {
        if (organizationId) {
            router.push(`/dashboard/organization/products/add/${organizationId}`);
        } else {
            toast({
                title: "Error",
                description: "ID Organisasi tidak tersedia untuk menambahkan produk.",
                variant: "destructive",
            });
            console.error("Organization ID is missing for add product navigation.");
        }
    };

    const handleEditClick = (slug: string) => {
        router.push(`/dashboard/organization/products/edit/${slug}`);
    };

    // Combined loading state
    if (loadingProducts || authLoading || (currentUser && loadingFavorites)) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(3)].map((_, i) => <ProductListSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {canManageProducts && (
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-foreground">Kelola Produk Organisasi</h2>
                    <Button onClick={handleAddClick} className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-lg transition-shadow">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                    </Button>
                </div>
            )}

            {products.length === 0 ? (
                <ProductEmptyState onAddClick={handleAddClick} canManage={canManageProducts} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="relative group/productitem">
                            <ProductCard
                                product={product}
                                currentUser={currentUser}
                                favoriteIds={favoriteIds}
                                favoriteRecordId={favoriteRecordId}
                                updateLocalFavorites={updateLocalFavorites}
                                refreshFavorites={fetchUserFavorites}
                            />
                            {canManageProducts && (
                                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/productitem:opacity-100 group-focus-within/productitem:opacity-100 transition-opacity duration-200">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-zinc-900 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-lg shadow-xl">
                                            <DropdownMenuItem onClick={() => handleEditClick(product.slug)} className="flex items-center gap-2 cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} className="text-red-500 hover:!text-red-500 flex items-center gap-2 cursor-pointer">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus produk
                                                            <span className="font-bold"> "{product.product_name}" </span>
                                                            secara permanen.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-red-600 hover:bg-red-700"
                                                            disabled={isSubmitting}
                                                            onClick={() => handleDeleteProduct(product.id)}>
                                                            {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}