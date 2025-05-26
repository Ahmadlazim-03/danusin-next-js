"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, UserCircle, Link2 as WhatsAppIcon, Target as TargetIcon, Percent, Edit, ShieldCheck, UserCog, Package, LayoutGrid, Settings as SettingsIcon, Info, ExternalLink as ViewProductIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Tipe data User yang di-expand
interface UserDataExpanded {
    id: string;
    collectionId: string;
    collectionName: string;
    name?: string;
    username?: string;
    avatar?: string;
}

// Tipe data Organisasi untuk halaman ini
interface OrganizationViewData {
    id: string;
    collectionId: string;
    collectionName: string;
    organization_name: string;
    organization_description: string;
    organization_slug: string;
    organization_image?: string;
    target?: number;
    target_progress?: number;
    group_phone?: string; // URL WhatsApp
    created_by: string;
    created: string;
    updated: string;
    expand?: {
        created_by?: UserDataExpanded;
    };
}

// Tipe data untuk Produk yang akan ditampilkan
interface ProductListItemData {
    id: string;
    collectionId: string;
    collectionName: string;
    product_name: string;
    slug: string; // slug produk, bukan organisasi
    price: number;
    discount?: number;
    product_image: string[];
}

// Komponen Skeleton untuk halaman View Organization
function ViewOrganizationSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-8 w-64" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/2 mb-2" />
                    <Skeleton className="h-64 w-full rounded-lg bg-muted" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div>
                        <Skeleton className="h-5 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full mt-1" />
                        <Skeleton className="h-4 w-5/6 mt-1" />
                    </div>
                    <div className="pt-2">
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-full mb-1" />
                        <Skeleton className="h-4 w-1/2 ml-auto" />
                    </div>
                    <div>
                         <Skeleton className="h-5 w-1/4 mb-2" />
                         <Skeleton className="h-10 w-40" />
                    </div>
                    <div>
                        <Skeleton className="h-5 w-1/4 mb-2" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                     <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                        <Skeleton className="h-3 w-1/3"/>
                        <Skeleton className="h-3 w-1/2"/>
                        <Skeleton className="h-3 w-1/2"/>
                    </div>
                </CardContent>
            </Card>
            {/* Skeleton untuk daftar produk */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/3" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-2">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

// Komponen kecil untuk menampilkan satu produk
function MinimalProductCard({ product }: { product: ProductListItemData }) {
    const imageUrl = product.product_image && product.product_image.length > 0
        ? pb.getFileUrl(product, product.product_image[0], { thumb: '300x200' })
        : "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(product.product_name.substring(0,2).toUpperCase());

    const displayPrice = product.discount && product.discount > 0 ? (
        <>
            <span className="text-sm line-through text-muted-foreground">Rp{product.price.toLocaleString('id-ID')}</span>
            <span className="font-semibold text-emerald-600">Rp{product.discount.toLocaleString('id-ID')}</span>
        </>
    ) : (
        <span className="font-semibold">Rp{product.price.toLocaleString('id-ID')}</span>
    );

    return (
        <Card className="overflow-hidden h-full flex flex-col group transition-all hover:shadow-lg">
            <Link href={`/dashboard/products/${product.slug || product.id}`} className="block">
                <div className="aspect-[3/2] bg-muted relative overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={product.product_name}
                        fill // Menggunakan fill daripada layout="fill"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" // Tambahkan prop sizes
                        style={{ objectFit: "cover" }} // Ganti objectFit dengan style
                        className="transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=200&width=300&text=Error"; }}
                    />
                </div>
            </Link>
            <CardContent className="p-3 flex flex-col flex-grow">
                <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-emerald-600">
                     <Link href={`/dashboard/products/${product.slug || product.id}`}>
                        {product.product_name}
                    </Link>
                </h3>
                <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex flex-col text-sm">
                        {displayPrice}
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-primary">
                        <Link href={`/dashboard/products/${product.slug || product.id}`}>
                            Lihat <ViewProductIcon className="ml-1 h-3 w-3"/>
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Komponen Halaman Utama
export default function ViewOrganizationPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [organization, setOrganization] = useState<OrganizationViewData | null>(null);
    const [userRoleInThisOrg, setUserRoleInThisOrg] = useState<string | null>(null);
    const [products, setProducts] = useState<ProductListItemData[]>([]);
    const [loading, setLoading] = useState(true); // Loading utama untuk data organisasi
    const [loadingProducts, setLoadingProducts] = useState(true); // Loading khusus untuk produk
    const [error, setError] = useState<string | null>(null);

    // 'slug' dari URL adalah ID organisasi
    const organizationIdFromUrl = params.slug as string;

    useEffect(() => {
        if (!organizationIdFromUrl) {
            setError("ID Organisasi tidak ditemukan di URL.");
            setLoading(false);
            setLoadingProducts(false);
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;
        let isMounted = true;

        const fetchAllData = async () => {
            if(!isMounted) return;
            setLoading(true);
            setLoadingProducts(true);
            setError(null);
            try {
                // 1. Fetch Detail Organisasi
                const orgResult = await pb.collection('danusin_organization').getOne<OrganizationViewData>(
                    organizationIdFromUrl,
                    { expand: 'created_by', signal }
                );

                if (!isMounted) return;
                setOrganization(orgResult);

                // 2. Fetch Peran User di Organisasi ini (jika user login)
                if (user && orgResult) {
                    try {
                        const roleRecord = await pb.collection('danusin_user_organization_roles')
                            .getFirstListItem(`user="${user.id}" && organization="${orgResult.id}"`, { signal });
                        if (isMounted) setUserRoleInThisOrg(roleRecord.role);
                    } catch (roleError: any) {
                         if (roleError.status !== 404 && isMounted && !(roleError.isAbort || roleError.message?.includes('autocancelled'))) {
                            console.warn("Tidak dapat mengambil peran user untuk organisasi ini:", roleError);
                         }
                         if (isMounted) setUserRoleInThisOrg(null); // Anggap bukan member jika tidak ada role
                    }
                }

                // 3. Fetch Produk Organisasi
                if (orgResult) {
                    const productResults = await pb.collection('danusin_product').getFullList<ProductListItemData>(
                        { filter: `by_organization="${orgResult.id}"`, sort: '-created', signal }
                    );
                    if(isMounted) setProducts(productResults);
                }

            } catch (err: any) {
                if (!isMounted) return;
                 if (err.name !== "AbortError" && !(err.isAbort || err.message?.includes('autocancelled'))) {
                    console.error("Gagal mengambil data:", err);
                    setError(err.status === 404 ? "Organisasi tidak ditemukan." : "Gagal memuat detail organisasi.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setLoadingProducts(false);
                }
            }
        };

        fetchAllData();
        return () => {
            isMounted = false;
            controller.abort();
        }
    }, [organizationIdFromUrl, user]);

    if (loading) {
        return <div className="p-4 md:p-8 w-full"><ViewOrganizationSkeleton /></div>;
    }

    if (error) {
        return (
            <div className="p-4 md:p-8 w-full">
                <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
                    <Building2 className="mb-4 h-16 w-16 text-destructive/70" />
                    <h2 className="mb-3 text-2xl font-bold text-destructive">{error}</h2>
                    <Button asChild variant="outline" className="mt-6">
                        <Link href="/dashboard/organizations">Kembali ke Daftar Organisasi</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!organization) {
        return (
             <div className="p-4 md:p-8 w-full">
                <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
                    <Package className="mb-4 h-16 w-16 text-muted-foreground/60" />
                    <h2 className="mb-2 text-2xl font-bold">Data Organisasi Tidak Ditemukan</h2>
                     <Button asChild variant="outline" className="mt-6">
                        <Link href="/dashboard/organizations">Kembali ke Daftar Organisasi</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Variabel dari state 'organization'
    const org = organization;

    const imageUrl = org.organization_image && org.collectionId && org.collectionName
        ? pb.getFileUrl(org, org.organization_image) // Tampilkan gambar ukuran penuh atau thumb yang lebih besar
        : "/placeholder.svg?height=300&width=600&text=" + encodeURIComponent(org.organization_name.substring(0,2).toUpperCase());

    const canShowProgress = org.target != null && org.target > 0; // Periksa null juga
    const progressPercentage = canShowProgress && org.target_progress != null
        ? Math.min(Math.round((org.target_progress / org.target!) * 100), 100)
        : 0;

    const creatorInfo = org.expand?.created_by;
    const creatorName = creatorInfo?.name || creatorInfo?.username || org.created_by;
    const creatorAvatar = (creatorInfo && creatorInfo.avatar && creatorInfo.collectionId && creatorInfo.collectionName)
      ? pb.getFileUrl(creatorInfo, creatorInfo.avatar, { thumb: '50x50' })
      : null;

    const canManage = userRoleInThisOrg === 'admin' || userRoleInThisOrg === 'moderator';

    return (
        <div className="p-4 md:p-8 w-full"> {/* Kontainer full width dengan padding */}
            <div className="w-full space-y-8"> {/* Kontainer konten, tanpa max-width, menggunakan space-y */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild className="rounded-md flex-shrink-0">
                            <Link href="/dashboard/organizations" aria-label="Kembali ke Daftar Organisasi">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words" title={org.organization_name}>
                            {org.organization_name}
                        </h1>
                    </div>
                    {canManage && (
                         <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                            <Link href={`/dashboard/organization/${org.id}`}> {/* Halaman manage tetap pakai ID */}
                                <SettingsIcon className="mr-2 h-4 w-4" /> Kelola Organisasi
                            </Link>
                        </Button>
                    )}
                </div>

                <Card className="overflow-hidden shadow-lg">
                    {org.organization_image && (
                        <div className="w-full h-48 md:h-72 xl:h-80 relative bg-muted border-b">
                            <Image
                                src={imageUrl}
                                alt={`Gambar ${org.organization_name}`}
                                fill
                                style={{ objectFit: "cover" }}
                                onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=300&width=600&text=Gagal+Muat"; }}
                                priority
                            />
                        </div>
                    )}
                    <CardHeader className={org.organization_image ? "pt-6" : ""}>
                        <CardTitle className="text-3xl mb-1">{org.organization_name}</CardTitle>
                        <CardDescription>
                            Slug: <Badge variant="secondary" className="ml-1 cursor-default">{org.organization_slug}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {org.organization_description && (
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                                <h3 className="text-lg font-semibold text-foreground mb-2 border-b pb-2">Deskripsi</h3>
                                <div dangerouslySetInnerHTML={{ __html: org.organization_description }} />
                            </div>
                        )}

                        {canShowProgress && (
                            <div className="pt-2">
                                <h3 className="text-lg font-semibold text-foreground mb-2">Progres Target</h3>
                                <div className="flex justify-between items-baseline text-sm text-muted-foreground mb-1">
                                    <span>Rp{(org.target_progress ?? 0).toLocaleString('id-ID')} terkumpul</span>
                                    <span className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} className="w-full h-3 mb-1 rounded-full" />
                                <div className="text-sm text-muted-foreground text-right">
                                    dari target Rp{(org.target ?? 0).toLocaleString('id-ID')}
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-3 pt-4 border-t mt-6">
                             <h3 className="text-lg font-semibold text-foreground mb-2">Informasi Tambahan</h3>
                            {org.group_phone && (
                                <div className="flex items-center gap-2">
                                    <WhatsAppIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <a href={org.group_phone} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                                        {org.group_phone}
                                    </a>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 pt-1">
                                <UserCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    Dibuat oleh: 
                                    <span className="font-medium text-foreground ml-1">{creatorName}</span>
                                    {creatorAvatar && <Image src={creatorAvatar} alt={creatorName || "Avatar"} width={20} height={20} className="rounded-full inline-block ml-2 align-middle" />}
                                </p>
                            </div>
                             <p className="text-xs text-muted-foreground">ID Organisasi: {org.id}</p>
                             <p className="text-xs text-muted-foreground">Dibuat pada: {new Date(org.created).toLocaleString('id-ID', { dateStyle:'long', timeStyle:'short' })}</p>
                             <p className="text-xs text-muted-foreground">Terakhir diperbarui: {new Date(org.updated).toLocaleString('id-ID',  { dateStyle:'long', timeStyle:'short' })}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Bagian Daftar Produk */}
                <Card className="shadow-lg mt-8">
                    <CardHeader>
                        <CardTitle className="text-2xl">Produk dari {org.organization_name}</CardTitle>
                        <CardDescription>Telusuri produk yang ditawarkan oleh organisasi ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingProducts ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/50">
                                        <Skeleton className="h-40 w-full rounded-md" />
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-5 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {products.map((product) => (
                                    <MinimalProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                                <p className="text-lg">Organisasi ini belum memiliki produk.</p>
                                {canManage && (
                                    <Button asChild className="mt-4">
                                        <Link href={`/dashboard/organization/${org.id}?tab=products`}> {/* Arahkan ke tab produk di halaman manage */}
                                            <Plus className="mr-2 h-4 w-4"/> Tambah Produk Sekarang
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}