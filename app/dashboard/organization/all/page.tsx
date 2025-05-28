"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import { 
    LayoutGrid, Package, ArrowLeft, AlertTriangle, Plus, 
    Building2, ExternalLink, UserCircle, Loader2, UserCheck 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from "next/navigation";
import { toast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils"; // Asumsi cn ada di utils
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Jika masih menggunakan tooltip di ProductCard atau tempat lain
import { motion } from "framer-motion"; // Jika ProductCard masih menggunakan motion


// --- 1. DEFINISIKAN TIPE DATA ---
interface CreatorData extends RecordModel {
    name?: string;
    username?: string;
    avatar?: string;
}

interface OrganizationDisplayData extends RecordModel {
    organization_name: string;
    organization_description?: string;
    organization_image?: string;
    organization_slug: string;
    target?: number;
    target_progress?: number;
    created_by: string; 
    expand?: {
        created_by?: CreatorData;
    };
}

// --- 2. DEFINISIKAN KOMPONEN OrganizationDisplayCard ---
interface OrganizationCardProps {
    organization: OrganizationDisplayData;
    currentUser: any | null; 
    isAlreadyMember: boolean;
    // onJoinSuccess tidak lagi diperlukan jika tombol join dihapus
}

function OrganizationDisplayCard({ organization, currentUser, isAlreadyMember }: OrganizationCardProps) {
    // State isJoining dan fungsi handleJoinOrganization dihapus

    const imageUrl = organization.organization_image && organization.collectionId && organization.id
        ? pb.getFileUrl(organization, organization.organization_image, { thumb: "480x270" })
        : `/placeholder.svg?height=270&width=480&text=${encodeURIComponent(organization.organization_name.substring(0,2).toUpperCase())}`;

    const creator = organization.expand?.created_by;
    const creatorName = creator?.name || creator?.username || "Tidak Diketahui";
    const creatorAvatarUrl = (creator && creator.avatar && creator.collectionId && creator.id)
        ? pb.getFileUrl(creator, creator.avatar, { thumb: "100x100" })
        : null;

    const canShowProgress = organization.target != null && organization.target > 0;
    const progressPercentage = canShowProgress && organization.target_progress != null
        ? Math.min(Math.round((organization.target_progress / organization.target!) * 100), 100)
        : 0;
    
    const detailLink = `/dashboard/organization/view/${organization.id}`;

    return (
        <div className="group relative rounded-lg overflow-hidden 
                        bg-card dark:bg-zinc-800/70 
                        border border-border dark:border-zinc-700/60 
                        transition-all duration-300 
                        hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/40
                        flex flex-col h-full">
            <Link href={detailLink} passHref>
                <div className="aspect-video relative overflow-hidden cursor-pointer">
                    <Image
                        src={imageUrl}
                        alt={organization.organization_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                        onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = `/placeholder.svg?height=270&width=480&text=${encodeURIComponent(organization.organization_name.substring(0,2).toUpperCase()) || 'Error'}`; }}
                    />
                </div>
            </Link>
            <div className="p-3 sm:p-4 flex flex-col flex-grow">
                <h3 className="font-semibold mb-1 truncate text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 text-base sm:text-lg">
                    <Link href={detailLink}>
                        {organization.organization_name}
                    </Link>
                </h3>

                {organization.organization_description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                        {organization.organization_description}
                    </p>
                )}
                
                {canShowProgress && (
                    <div className="my-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                            <span>Progres Target</span>
                            <span className={`font-semibold ${progressPercentage >= 100 ? 'text-green-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {progressPercentage}%
                            </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2 rounded-full" />
                         <div className="text-right text-xs text-muted-foreground mt-1">
                            Rp {(organization.target_progress ?? 0).toLocaleString('id-ID')} / Rp {(organization.target ?? 0).toLocaleString('id-ID')}
                        </div>
                    </div>
                )}

                {/* Tombol Aksi Disesuaikan */}
                <div className="mt-auto pt-3 flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button asChild variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 px-3 py-1.5 h-auto rounded-md w-full sm:w-auto justify-center">
                        <Link href={detailLink}>
                            <ExternalLink className="mr-1.5 h-4 w-4" /> Lihat Detail
                        </Link>
                    </Button>
                    {/* Tombol Join Organisasi Dihapus */}
                    {/* Informasi Keanggotaan Tetap Ditampilkan */}
                    {currentUser && isAlreadyMember && (
                         <Badge variant="outline" className="py-1.5 px-3 text-sm border-green-500 text-green-600 flex items-center justify-center self-center sm:self-auto w-full sm:w-auto">
                            <UserCheck className="mr-1.5 h-4 w-4" />
                            Anggota
                        </Badge>
                    )}
                </div>

                <div className="mt-3 pt-2 flex items-center gap-2 border-t border-border/60">
                    <Avatar className="h-6 w-6 border">
                        {creatorAvatarUrl && ( <AvatarImage src={creatorAvatarUrl} alt={creatorName} /> )}
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                            {creatorName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">
                        Dibuat oleh: {creatorName}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Komponen Skeleton untuk Daftar Organisasi
function OrganizationListSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="group relative rounded-lg overflow-hidden bg-card dark:bg-zinc-800/70 border border-border dark:border-zinc-700/60 p-4 space-y-3">
                    <Skeleton className="aspect-video w-full rounded-md" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="flex items-center gap-2 pt-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- 3. DEFINISIKAN KOMPONEN HALAMAN UTAMA (Default Export) ---
export default function AllOrganizationsPage() {
    const [organizations, setOrganizations] = useState<OrganizationDisplayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser, isDanuser } = useAuth(); 
    const router = useRouter();

    const [joinedOrganizationIds, setJoinedOrganizationIds] = useState<Set<string>>(new Set());
    const [loadingUserMemberships, setLoadingUserMemberships] = useState(true);

    const fetchUserMemberships = useCallback(async (userId: string, signal?: AbortSignal) => {
        if (!userId) { setJoinedOrganizationIds(new Set()); setLoadingUserMemberships(false); return; }
        try {
            const rolesList = await pb.collection('danusin_user_organization_roles').getFullList({
                filter: `user="${userId}"`, fields: 'organization', signal, $autoCancel: false, // Tambah $autoCancel
            });
            if (!signal?.aborted) {
                 const orgIds = new Set(rolesList.map(role => role.organization));
                 setJoinedOrganizationIds(orgIds);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) && !signal?.aborted) {
                console.error("Failed to fetch user memberships:", err);
            } else {
                console.log("Fetch user memberships was cancelled.");
            }
        } finally { if (!signal?.aborted) { setLoadingUserMemberships(false); } }
    }, []);

    useEffect(() => {
        let membershipController: AbortController | null = null;
        if (currentUser?.id) {
            membershipController = new AbortController();
            setLoadingUserMemberships(true);
            fetchUserMemberships(currentUser.id, membershipController.signal);
        } else {
            setJoinedOrganizationIds(new Set());
            setLoadingUserMemberships(false);
        }
        return () => { membershipController?.abort(); };
    }, [currentUser, fetchUserMemberships]);


    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        let isMounted = true;

        const fetchOrganizations = async () => {
            if (!isMounted) return;
            setLoading(true); 
            setError(null);
            try {
                const orgsList = await pb.collection('danusin_organization').getFullList<OrganizationDisplayData>(
                    { sort: '-created', expand: 'created_by', signal: signal, $autoCancel: false } // Tambah $autoCancel
                );
                if (isMounted && !signal.aborted) {
                    setOrganizations(orgsList);
                }
            } catch (err: any) {
                if (!isMounted || signal.aborted) { console.log("Fetch organizations request was cancelled."); return;}
                if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0)) {
                    console.error("Failed to fetch organizations:", err);
                    setError("Gagal memuat daftar organisasi.");
                    toast({ title: "Error", description: "Gagal memuat daftar organisasi. Silakan coba lagi.", variant: "destructive", });
                } else { console.log("Fetch organizations request was cancelled (expected)."); }
            } finally { if (isMounted && !signal.aborted) { setLoading(false); } }
        };
        fetchOrganizations();
        return () => { isMounted = false; controller.abort(); }
    }, []);

    if (loading || loadingUserMemberships) {
        return (
            <main className="w-full">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <OrganizationListSkeleton />
            </main>
        );
    }

    if (error) {
        return ( <main className="w-full text-center p-4 md:p-6 lg:p-8"> <p className="text-red-500 mb-4">{error}</p> <Button onClick={() => window.location.reload()}>Coba Lagi</Button> </main> );
    }

    return (
        <main className="w-full">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center text-foreground">
                    <Building2 className="mr-2.5 h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 dark:text-emerald-400" />
                    Semua Organisasi
                </h1>
                {isDanuser && (
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Link href="/dashboard/organization/new"> <Plus className="mr-2 h-4 w-4" /> Buat Organisasi Baru </Link>
                    </Button>
                )}
            </div>

            {organizations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg">Belum ada organisasi yang terdaftar.</p>
                    {isDanuser && (
                        <Button asChild className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link href="/dashboard/organization/new"> <Plus className="mr-2 h-4 w-4" /> Buat Organisasi Pertama Anda </Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {organizations.map((org) => (
                        <OrganizationDisplayCard 
                            key={org.id} 
                            organization={org}
                            currentUser={currentUser}
                            isAlreadyMember={joinedOrganizationIds.has(org.id)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}