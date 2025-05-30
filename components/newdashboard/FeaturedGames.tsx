"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Building2, Plus, ExternalLink, UserCircle,
    UserCheck, Sparkles, ChevronLeft, ChevronRight, Package,
    Loader2, SendHorizonal as SendIcon, XCircle as CancelIcon
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- TIPE DATA ---
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

interface SessionRequestRecord extends RecordModel {
    danuser_request: string;
    danuser_organization: string;
    danuser_admin?: string[];
    role: 'member' | 'admin' | 'moderator';
    status: 'waiting' | 'approved' | 'rejected';
}

interface OrganizationCardProps {
    organization: OrganizationDisplayData;
    currentUser: any | null;
    isAlreadyMember: boolean;
    pendingRequestInfo?: { id: string };
    onRefreshPendingRequests: () => Promise<void>;
}

// --- Komponen OrganizationDisplayCard (DIMODIFIKASI DENGAN LOGIKA REQUEST JOIN) ---
function OrganizationDisplayCard({
    organization,
    currentUser,
    isAlreadyMember,
    pendingRequestInfo,
    onRefreshPendingRequests
}: OrganizationCardProps) {
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [isCancellingRequest, setIsCancellingRequest] = useState(false);

    const isRequestPending = !!pendingRequestInfo;
    // console.log(`[FeaturedCard: ${organization.organization_name}] Render. isAlreadyMember: ${isAlreadyMember}, pendingRequestInfo: ${JSON.stringify(pendingRequestInfo)}, isRequestPending: ${isRequestPending}`);

    const imageUrl = organization.organization_image && organization.collectionId && organization.id
        ? pb.getFileUrl(organization, organization.organization_image, { thumb: "480x270" })
        : `/placeholder.svg?height=270&width=480&text=${encodeURIComponent(organization.organization_name.substring(0, 2).toUpperCase())}`;
    const creator = organization.expand?.created_by;
    const creatorName = creator?.name || creator?.username || "Tidak Diketahui";
    const creatorAvatarUrl = (creator && creator.avatar && creator.collectionId && creator.id)
        ? pb.getFileUrl(creator, creator.avatar, { thumb: "50x50" })
        : null;
    const canShowProgress = organization.target != null && organization.target > 0;
    const progressPercentage = canShowProgress && organization.target_progress != null
        ? Math.min(Math.round((organization.target_progress / organization.target!) * 100), 100)
        : 0;
    const detailLink = `/dashboard/organization/view/${organization.id}`;

    const handleRequestJoin = async () => {
        if (!currentUser?.id) {
            toast({ title: "Autentikasi Gagal", description: "Harap login untuk mengirim permintaan.", variant: "destructive" });
            return;
        }
        setIsSubmittingRequest(true);
        try {
            let adminUserIds: string[] = [];
            try {
                const adminRoles = await pb.collection('danusin_user_organization_roles').getFullList({
                    filter: `organization = "${organization.id}" && role = "admin"`,
                    fields: 'user',
                });
                adminUserIds = adminRoles.map(role => role.user);
            } catch (adminFetchError: any) {
                console.error("Gagal mengambil data admin untuk organisasi:", adminFetchError);
                toast({ title: "Error Internal", description: "Gagal mendapatkan data admin. Permintaan tidak dapat diproses.", variant: "destructive" });
                setIsSubmittingRequest(false);
                return;
            }

            const payload = {
                danuser_request: currentUser.id,
                danuser_organization: organization.id,
                danuser_admin: adminUserIds,
                role: 'member',
                status: 'waiting'
            };
            await pb.collection('danusin_session_request').create<SessionRequestRecord>(payload);
            toast({ title: "Permintaan Terkirim", description: `Permintaan Anda untuk bergabung dengan ${organization.organization_name} telah dikirim.` });
            await onRefreshPendingRequests();
        } catch (err: any) {
            console.error("Gagal mengirim permintaan gabung:", err);
            let errMsg = "Gagal mengirim permintaan bergabung.";
            if (err instanceof ClientResponseError && err.response?.data) {
                const responseData = err.response.data as any;
                 if (responseData?.data && (Object.values(responseData.data).some((fieldError: any) => fieldError?.message?.includes("already exists")) || err.response.message?.includes("unique constraint failed"))) {
                    errMsg = "Anda sudah mengirim permintaan untuk organisasi ini.";
                    await onRefreshPendingRequests(); // Segarkan untuk menampilkan status yang benar
                } else if (responseData.message) {
                    errMsg = responseData.message;
                } else if (err.response?.message) {
                    errMsg = err.response.message;
                }
            } else if (err.message) {
                errMsg = err.message;
            }
            toast({ title: "Error Permintaan", description: errMsg, variant: "destructive" });
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    const handleCancelRequestJoin = async () => {
        if (!pendingRequestInfo?.id) {
            toast({ title: "Error", description: "ID permintaan tidak ditemukan.", variant: "destructive" });
            return;
        }
        setIsCancellingRequest(true);
        try {
            await pb.collection('danusin_session_request').delete(pendingRequestInfo.id);
            toast({ title: "Permintaan Dibatalkan", description: "Permintaan Anda untuk bergabung telah dibatalkan." });
            await onRefreshPendingRequests();
        } catch (err: any) {
            console.error("Gagal membatalkan permintaan gabung:", err);
            toast({ title: "Error Pembatalan", description: "Gagal membatalkan permintaan.", variant: "destructive" });
        } finally {
            setIsCancellingRequest(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{
                y: -5,
                boxShadow: "0px 10px 20px rgba(0,0,0,0.1), 0px 3px 6px rgba(0,0,0,0.05)"
            }}
            className="h-full"
        >
            <Card className="group relative rounded-lg overflow-hidden bg-card dark:bg-zinc-800/70 border border-border dark:border-zinc-700/60 transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-md">
                <Link href={detailLink} passHref>
                    <div className="aspect-video relative overflow-hidden cursor-pointer">
                        <Image
                            src={imageUrl}
                            alt={organization.organization_name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                            onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = `/placeholder.svg?height=270&width=480&text=${encodeURIComponent(organization.organization_name.substring(0, 2).toUpperCase()) || 'Error'}`; }}
                        />
                    </div>
                </Link>
                <CardContent className="p-3 sm:p-4 flex flex-col flex-grow">
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
                    <div className="mt-auto pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <Button asChild variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 px-3 py-1.5 h-auto rounded-md w-full sm:w-auto justify-center order-last sm:order-first">
                            <Link href={detailLink}>
                                <ExternalLink className="mr-1.5 h-4 w-4" /> Lihat Detail
                            </Link>
                        </Button>
                        <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
                            {currentUser && (
                                isAlreadyMember ? (
                                    <Badge variant="outline" className="py-1.5 px-3 text-xs sm:text-sm border-green-500 text-green-600 bg-green-50 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400 flex items-center justify-center w-full sm:w-auto">
                                        <UserCheck className="mr-1.5 h-4 w-4" />Anggota
                                    </Badge>
                                ) : isRequestPending ? (
                                    <div className="flex items-center w-full justify-between gap-2 sm:w-auto sm:justify-end">
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge
                                                        variant="outline"
                                                        className="py-1.5 px-3 text-xs sm:text-sm border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400 flex items-center whitespace-nowrap cursor-default"
                                                    >
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Terkirim
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Sedang menunggu persetujuan admin</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 h-8 w-8 p-0 rounded-md flex-shrink-0"
                                                        onClick={handleCancelRequestJoin}
                                                        disabled={isCancellingRequest}
                                                    >
                                                        {isCancellingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : <CancelIcon className="h-4 w-4" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Batalkan Permintaan</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" className="border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300 px-3 py-1.5 h-auto rounded-md w-full sm:w-auto justify-center text-xs sm:text-sm" onClick={handleRequestJoin} disabled={isSubmittingRequest}>
                                        <SendIcon className="mr-1.5 h-4 w-4" />Minta Gabung
                                    </Button>
                                )
                            )}
                        </div>
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
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Komponen Skeleton untuk daftar
function FeaturedItemsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[...Array(3)].map((_, index) => (
                <div key={index} className="rounded-lg border bg-card p-3 space-y-3 animate-pulse">
                    <Skeleton className="aspect-video w-full rounded-md" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                     <div className="flex items-center gap-2 pt-2 border-t mt-auto">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Komponen Utama: FeaturedOrganizations ---
export default function FeaturedOrganizations() {
    const [organizations, setOrganizations] = useState<OrganizationDisplayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [joinedOrganizationIds, setJoinedOrganizationIds] = useState<Set<string>>(new Set());
    const [loadingUserMemberships, setLoadingUserMemberships] = useState(true);
    const [pendingRequestsData, setPendingRequestsData] = useState<Map<string, string>>(new Map());
    const [loadingPendingRequests, setLoadingPendingRequests] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const fetchUserMemberships = useCallback(async (userId: string, signal?: AbortSignal) => {
        if (!userId) { setJoinedOrganizationIds(new Set()); setLoadingUserMemberships(false); return; }
        // setLoadingUserMemberships(true); // Already set by caller
        try {
            const rolesList = await pb.collection('danusin_user_organization_roles').getFullList({
                filter: `user="${userId}"`, fields: 'organization', signal, $autoCancel: false,
            });
            if (!signal?.aborted) {
                 const orgIds = new Set(rolesList.map(role => role.organization));
                 setJoinedOrganizationIds(orgIds);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError' && !signal?.aborted) { console.error("Failed to fetch user memberships for featured orgs:", err); }
        } finally { if (!signal?.aborted) { setLoadingUserMemberships(false); } }
    }, []);

    const fetchPendingJoinRequests = useCallback(async (userId: string, signal?: AbortSignal) => {
        if (!userId) { setPendingRequestsData(new Map()); setLoadingPendingRequests(false); return; }
        // setLoadingPendingRequests(true); // Already set by caller
        try {
            const requestsList = await pb.collection('danusin_session_request').getFullList<SessionRequestRecord>({
                filter: `danuser_request="${userId}" && status="waiting"`,
                fields: 'id,danuser_organization',
                signal, $autoCancel: false,
            });
            if (!signal?.aborted) {
                const newPendingData = new Map<string, string>();
                requestsList.forEach(req => {
                    if (typeof req.danuser_organization === 'string' && req.danuser_organization) {
                         newPendingData.set(req.danuser_organization, req.id);
                    }
                });
                setPendingRequestsData(newPendingData);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError' && !signal?.aborted) { console.error("Failed to fetch pending join requests for featured orgs:", err); }
        } finally { if (!signal?.aborted) { setLoadingPendingRequests(false); } }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        let isMounted = true;

        const fetchInitialData = async () => {
            if(!isMounted) return;
            setLoading(true);
            setLoadingUserMemberships(true);
            setLoadingPendingRequests(true);
            setError(null);

            try {
                const orgsPromise = pb.collection('danusin_organization').getFullList<OrganizationDisplayData>({
                    sort: '-created', expand: 'created_by', signal, $autoCancel: false,
                });

                let membershipsPromise = Promise.resolve();
                let pendingRequestsPromise = Promise.resolve();

                if (currentUser?.id) {
                    membershipsPromise = fetchUserMemberships(currentUser.id, signal);
                    pendingRequestsPromise = fetchPendingJoinRequests(currentUser.id, signal);
                } else {
                    // Ensure loading states are false if no user, as fetch functions won't be called
                    setLoadingUserMemberships(false);
                    setLoadingPendingRequests(false);
                }
                
                const [orgsResult] = await Promise.all([orgsPromise, membershipsPromise, pendingRequestsPromise]);

                if(isMounted && !signal.aborted) {
                    setOrganizations(orgsResult);
                }

            } catch (err: any) {
                 if (isMounted && !signal.aborted && err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) ) {
                    console.error("Failed to fetch featured organizations data:", err);
                    setError("Gagal memuat organisasi unggulan.");
                    toast({ title: "Error", description: "Gagal memuat organisasi.", variant:"destructive"})
                }
            } finally {
                if(isMounted && !signal.aborted) {
                    setLoading(false); // Done loading main organizations list
                    // setLoadingUserMemberships & setLoadingPendingRequests are set within their respective fetch functions
                }
            }
        };
        
        fetchInitialData();

        return () => { 
            isMounted = false;
            controller.abort();
        };
    // KOREKSI: Menghapus fetchOrganizationsData dari array dependensi
    }, [currentUser, fetchUserMemberships, fetchPendingJoinRequests]);


    const totalPages = Math.ceil(organizations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentOrganizations = organizations.slice(startIndex, endIndex);

    const handleNextPage = () => { setCurrentPage((prev) => Math.min(prev + 1, totalPages)); };
    const handlePrevPage = () => { setCurrentPage((prev) => Math.max(prev - 1, 1)); };

    // Combined loading state for skeleton
    // Loading akan true sampai semua data (orgs, memberships, pending requests) selesai, atau jika tidak ada user.
    if (loading || (currentUser && (loadingUserMemberships || loadingPendingRequests))) {
        return (
            <section className="mb-6 md:mb-10">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <Skeleton className="h-8 w-1/3" /> <Skeleton className="h-10 w-24" />
                </div>
                <FeaturedItemsSkeleton />
            </section> );
    }
    if (error) { return <div className="mb-6 md:mb-10 p-4 text-center text-red-500">{error}</div>; }

    return (
        <section className="mb-6 md:mb-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center text-neutral-800 dark:text-white">
                    <Building2 className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Organisasi Unggulan
                </h2>
                <Button
                    variant="outline" size="sm"
                    className="border-neutral-300 text-neutral-700 hover:bg-emerald-50/90 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 min-w-[90px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-md"
                    asChild
                >
                    <Link href="/dashboard/organization/all">Lihat Semua</Link>
                </Button>
            </div>

            {currentOrganizations.length === 0 && !loading ? (
                 <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg">
                    <Building2 className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg">Belum ada organisasi untuk ditampilkan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {currentOrganizations.map((org) => (
                        <OrganizationDisplayCard
                            key={org.id}
                            organization={org}
                            currentUser={currentUser}
                            isAlreadyMember={joinedOrganizationIds.has(org.id)}
                            pendingRequestInfo={pendingRequestsData.get(org.id) ? { id: pendingRequestsData.get(org.id)! } : undefined}
                            onRefreshPendingRequests={async () => {
                                if (currentUser?.id) {
                                    setLoadingPendingRequests(true); // Menunjukkan proses refresh
                                    await fetchPendingJoinRequests(currentUser.id);
                                    // setLoadingPendingRequests(false) diatur di dalam fetchPendingJoinRequests
                                }
                            }}
                        />
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 md:mt-8">
                    <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline" size="sm" className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:hover:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 h-9 sm:h-10 px-3 rounded-md" aria-label="Previous page" >
                        <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" /> <span className="text-xs sm:text-sm">Prev</span>
                    </Button>
                    <span className="text-sm font-medium text-neutral-600 dark:text-zinc-400 px-2">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline" size="sm" className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:hover:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 h-9 sm:h-10 px-3 rounded-md" aria-label="Next page" >
                        <span className="text-xs sm:text-sm">Next</span> <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
                    </Button>
                </div>
            )}
        </section>
    );
}