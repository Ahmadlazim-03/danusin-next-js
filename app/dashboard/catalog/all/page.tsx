"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { LayoutGrid, Package, ArrowLeft, AlertTriangle, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

// --- TIPE DATA ---
type CatalogListItem = RecordModel & {
    name: string;
    description?: string;
    product_count?: number;
    slug?: string;
};

// --- Komponen Skeleton ---
function AllCatalogsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-1" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function AllCatalogsPage() {
    const router = useRouter();
    const { user, isDanuser } = useAuth(); 
    const [catalogs, setCatalogs] = useState<CatalogListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllCatalogsWithProductCount = useCallback(async (signal: AbortSignal) => {
        setLoading(true);
        setError(null);
        try {
            const allCatalogsResult = await pb.collection('danusin_catalog').getFullList<CatalogListItem>({
                sort: '-created',
                signal,
                $autoCancel: false,
            });

            if (signal.aborted) return;

            const enrichedCatalogs = await Promise.all(
                allCatalogsResult.map(async (catalog) => {
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
                           console.warn(`Could not count products for catalog ${catalog.id}:`, productErr);
                        }
                        return { ...catalog, product_count: 0 }; 
                    }
                })
            );
            
            if (signal.aborted) return;
            setCatalogs(enrichedCatalogs);

        } catch (err: any) {
            if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0)) {
                console.error("Failed to fetch all catalogs:", err);
                setError("Gagal memuat daftar katalog.");
                toast({ title: "Error", description: "Gagal memuat daftar katalog.", variant: "destructive"});
            } else {
                console.log("Fetch all catalogs request was cancelled.");
            }
        } finally {
            if (!signal.aborted) {
                 setLoading(false);
            }
        }
    }, []);


    useEffect(() => {
        const controller = new AbortController();
        fetchAllCatalogsWithProductCount(controller.signal);
        return () => {
            controller.abort();
        }
    }, [fetchAllCatalogsWithProductCount]);

    if (loading) return <div className="p-4 md:p-8 w-full"><AllCatalogsSkeleton /></div>;
    
    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => fetchAllCatalogsWithProductCount(new AbortController().signal)}>Coba Lagi</Button>
        </div>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                <div>
                    <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2 sm:mb-0 sm:hidden">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                    <div className="flex items-center gap-3">
                        <LayoutGrid className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Semua Katalog Produk</h1>
                    </div>
                </div>
                 {isDanuser && (
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {/* Arahkan ke halaman OrganizationCatalogs yang ada di dalam Organization Settings, atau buat halaman global new catalog */}
                        <Link href="/dashboard/organization"> {/* Ganti ke path yang sesuai jika ada halaman create catalog global */}
                            <Plus className="mr-2 h-4"/> Kelola Katalog via Organisasi
                        </Link>
                    </Button>
                 )}
            </div>

            {catalogs.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card border border-dashed rounded-lg">
                    <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg">Belum ada katalog yang tersedia.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {catalogs.map((catalog) => (
                        <Link key={catalog.id} href={`/dashboard/catalog/${catalog.slug || catalog.id}`} passHref>
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-emerald-500/70 dark:hover:border-emerald-500/60">
                                <CardHeader>
                                    <CardTitle className="text-lg line-clamp-2">{catalog.name}</CardTitle>
                                    {catalog.description && <CardDescription className="text-xs line-clamp-2">{catalog.description}</CardDescription>}
                                </CardHeader>
                                <CardContent>
                                    <Badge variant="secondary">{catalog.product_count || 0} Produk</Badge>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}