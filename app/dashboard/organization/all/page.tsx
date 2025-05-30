"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel, ClientResponseError } from 'pocketbase';
import {
    LayoutGrid, Package, ArrowLeft, AlertTriangle, Plus,
    Building2, ExternalLink, UserCircle, Loader2, UserCheck, Search,
    SearchX, SendHorizonal as SendIcon, XCircle as CancelIcon
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
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
// Pastikan Tooltip diimpor (sudah ada di kode sebelumnya)
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// --- Type Definitions (Sama seperti versi sebelumnya) ---
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

// --- OrganizationDisplayCard Component ---
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
    console.log(`[Card: ${organization.organization_name}] Render. isAlreadyMember: ${isAlreadyMember}, pendingRequestInfo: ${JSON.stringify(pendingRequestInfo)}, isRequestPending: ${isRequestPending}`);

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
        // ... (logika handleRequestJoin tetap sama seperti versi sebelumnya) ...
        if (!currentUser?.id) {
            toast({ title: "Autentikasi Gagal", description: "Harap login untuk mengirim permintaan.", variant: "destructive" });
            return;
        }
        setIsSubmittingRequest(true);
        console.log(`[Card: ${organization.organization_name}] handleRequestJoin: Initiating...`);
        try {
            let adminUserIds: string[] = [];
            try {
                console.log(`Fetching admins for organization ID: ${organization.id}`);
                const adminRoles = await pb.collection('danusin_user_organization_roles').getFullList({
                    filter: `organization = "${organization.id}" && role = "admin"`,
                    fields: 'user',
                });
                adminUserIds = adminRoles.map(role => role.user);
                console.log(`[Card: ${organization.organization_name}] Admin User IDs fetched for 'danuser_admin':`, JSON.stringify(adminUserIds));
                if (adminUserIds.length === 0) {
                    console.warn(`No admin users found for organization ID: ${organization.id}. 'danuser_admin' will be empty.`);
                }
            } catch (adminFetchError: any) {
                console.error(`[Card: ${organization.organization_name}] Failed to fetch admin users:`, adminFetchError);
                if (adminFetchError instanceof ClientResponseError) {
                    console.error("Admin fetch PocketBase error details:", JSON.stringify(adminFetchError.response, null, 2));
                }
                toast({ title: "Error Internal", description: "Gagal mendapatkan data admin organisasi. Permintaan tidak dapat diproses.", variant: "destructive" });
                setIsSubmittingRequest(false);
                return;
            }

            const fieldNameForAdmins = 'danuser_admin';
            const payload = {
                danuser_request: currentUser.id,
                danuser_organization: organization.id,
                role: 'member',
                status: 'waiting',
                [fieldNameForAdmins]: adminUserIds,
            };
            console.log(`[Card: ${organization.organization_name}] Payload for session request:`, JSON.stringify(payload));
            await pb.collection('danusin_session_request').create<SessionRequestRecord>(payload);
            toast({ title: "Permintaan Terkirim", description: `Permintaan untuk ${organization.organization_name} telah dikirim.` });
            
            console.log(`[Card: ${organization.organization_name}] Request created. Calling onRefreshPendingRequests...`);
            await onRefreshPendingRequests();
            console.log(`[Card: ${organization.organization_name}] onRefreshPendingRequests completed.`);

        } catch (err: any) {
            console.error(`[Card: ${organization.organization_name}] Failed to send join request:`, err);
            if (err instanceof ClientResponseError) {
                console.error(`[Card: ${organization.organization_name}] PocketBase Error Details:`, JSON.stringify(err.response, null, 2));
                let errMsg = `Gagal mengirim permintaan: ${err.response.message || "Error tidak diketahui."}`;
                const responseData = err.response.data as any;
                if (responseData?.data && (Object.values(responseData.data).some((fieldError: any) => fieldError?.message?.includes("already exists")) || err.response.message?.includes("unique constraint failed"))) {
                    errMsg = "Anda sudah mengirim permintaan untuk organisasi ini.";
                    console.log(`[Card: ${organization.organization_name}] Unique constraint failed, calling onRefreshPendingRequests to sync state.`);
                    await onRefreshPendingRequests();
                }
                toast({ title: "Error Permintaan", description: errMsg, variant: "destructive", duration: 7000 });
            } else {
                toast({ title: "Error Permintaan", description: err.message || "Gagal mengirim permintaan bergabung.", variant: "destructive" });
            }
        } finally {
            setIsSubmittingRequest(false);
            console.log(`[Card: ${organization.organization_name}] handleRequestJoin: Finished.`);
        }
    };

    const handleCancelRequestJoin = async () => {
        // ... (logika handleCancelRequestJoin tetap sama seperti versi sebelumnya) ...
        if (!pendingRequestInfo?.id) {
            toast({ title: "Error", description: "ID permintaan tidak ditemukan.", variant: "destructive" });
            return;
        }
        setIsCancellingRequest(true);
        console.log(`[Card: ${organization.organization_name}] handleCancelRequestJoin for request ID ${pendingRequestInfo.id}`);
        try {
            await pb.collection('danusin_session_request').delete(pendingRequestInfo.id);
            toast({ title: "Permintaan Dibatalkan", description: "Permintaan bergabung telah dibatalkan." });
            await onRefreshPendingRequests();
        } catch (err: any) {
            console.error(`[Card: ${organization.organization_name}] Failed to cancel join request:`, err);
            toast({ title: "Error Pembatalan", description: "Gagal membatalkan permintaan.", variant: "destructive" });
        } finally {
            setIsCancellingRequest(false);
        }
    };

    return (
        <div className="group relative rounded-xl overflow-hidden bg-card dark:bg-zinc-800/70 border border-border dark:border-zinc-700/60 transition-all duration-300 hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/40 flex flex-col h-full">
            <Link href={detailLink} passHref>
                <div className="aspect-video relative overflow-hidden cursor-pointer">
                    <Image src={imageUrl} alt={organization.organization_name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = `/placeholder.svg?height=270&width=480&text=${encodeURIComponent(organization.organization_name.substring(0, 2).toUpperCase()) || 'Err'}`; }} />
                </div>
            </Link>
            <div className="p-3 sm:p-4 flex flex-col flex-grow">
                <h3 className="font-semibold mb-1 truncate text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 text-base sm:text-lg">
                    <Link href={detailLink}>{organization.organization_name}</Link>
                </h3>
                {organization.organization_description && (<p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 min-h-[2.25rem] sm:min-h-[2.5rem]">{organization.organization_description}</p>)}
                {canShowProgress && (
                    <div className="my-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1"><span>Progres Target</span><span className={`font-semibold ${progressPercentage >= 100 ? 'text-green-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{progressPercentage}%</span></div>
                        <Progress value={progressPercentage} className="h-2 rounded-full" />
                        <div className="text-right text-[0.7rem] xs:text-xs text-muted-foreground mt-1">Rp {(organization.target_progress ?? 0).toLocaleString('id-ID')} / Rp {(organization.target ?? 0).toLocaleString('id-ID')}</div>
                    </div>
                )}
                <div className="mt-auto pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Button asChild variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 px-3 py-1.5 h-auto rounded-md w-full sm:w-auto justify-center text-xs sm:text-sm order-last sm:order-first">
                        <Link href={detailLink}><ExternalLink className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Lihat Detail</Link>
                    </Button>
                    {/* Action Buttons Area - UI MODIFIED HERE */}
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
                                                    className="text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 h-8 w-8 p-0 rounded-md flex-shrink-0" // Adjusted size
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
                                    <SendIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Minta Gabung
                                </Button>
                            )
                        )}
                    </div>
                </div>
                <div className="mt-3 pt-2 flex items-center gap-2 border-t border-border/60">
                    <Avatar className="h-6 w-6 border"><AvatarImage src={creatorAvatarUrl || undefined} alt={creatorName} /><AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">{creatorName.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="text-xs text-muted-foreground truncate">Dibuat oleh: <span className="font-medium text-foreground/80">{creatorName}</span></span>
                </div>
            </div>
        </div>
    );
}

// --- Komponen Halaman Utama (Default Export) ---
// (AllOrganizationsPage component and its supporting functions like fetchUserMemberships, 
// fetchPendingJoinRequests, useEffects, skeleton, and render logic remain the same 
// as the previous version with console logs. Ensure you have that full code.)
// For brevity, I'm not repeating the entire AllOrganizationsPage component here,
// but it should be the one from the immediately preceding response.
// ... (Existing AllOrganizationsPage, OrganizationListSkeleton, type definitions etc. from previous response)

// --- PASTE THE REST OF THE AllOrganizationsPage.tsx FILE FROM THE PREVIOUS RESPONSE HERE ---
// The AllOrganizationsPage component itself, fetchUserMemberships, fetchPendingJoinRequests,
// useEffect hooks, OrganizationListSkeleton, and other helper types/functions
// should be the same as the last full code I provided.
// The only change for this request is within the OrganizationDisplayCard's JSX for the pending state.

// Make sure to include these at the top of your file if they are not already there
// from the full code:
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Full AllOrganizationsPage component (as provided in the previous step, with console logs)
export default function AllOrganizationsPage() {
    const [organizations, setOrganizations] = useState<OrganizationDisplayData[]>([]);
    const [filteredOrganizations, setFilteredOrganizations] = useState<OrganizationDisplayData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingPageData, setLoadingPageData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser, isDanuser } = useAuth(); // authLoading workaround is in place
    const [joinedOrganizationIds, setJoinedOrganizationIds] = useState<Set<string>>(new Set());
    const [pendingRequestsData, setPendingRequestsData] = useState<Map<string, string>>(new Map());

    const fetchUserMemberships = useCallback(async (userId: string, signal?: AbortSignal) => {
        if (!userId) { setJoinedOrganizationIds(new Set()); return; }
        try {
            const rolesList = await pb.collection('danusin_user_organization_roles').getFullList({ filter: `user="${userId}"`, fields: 'organization', signal, $autoCancel: false });
            if (!signal?.aborted) { setJoinedOrganizationIds(new Set(rolesList.map(role => role.organization)));}
        } catch (err: any) { if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) && !signal?.aborted) { console.error("Failed to fetch user memberships:", err); } }
    }, []);

    const fetchPendingJoinRequests = useCallback(async (userId: string, signal?: AbortSignal) => {
        if (!userId) { setPendingRequestsData(new Map()); return; }
        console.log("[AllOrgsPage] fetchPendingJoinRequests called for user:", userId);
        try {
            const requestsList = await pb.collection('danusin_session_request').getFullList<SessionRequestRecord>({
                filter: `danuser_request="${userId}" && status="waiting"`,
                fields: 'id,danuser_organization', signal, $autoCancel: false,
            });
            if (!signal?.aborted) {
                const newPendingData = new Map<string, string>();
                requestsList.forEach(req => {
                    if (typeof req.danuser_organization === 'string' && req.danuser_organization) {
                        newPendingData.set(req.danuser_organization, req.id);
                    } else { console.warn("[AllOrgsPage] Skipping pending request due to invalid danuser_organization ID:", req); }
                });
                console.log("[AllOrgsPage] Setting pendingRequestsData. New Map size:", newPendingData.size, "Data:", Object.fromEntries(newPendingData));
                setPendingRequestsData(newPendingData);
            } else { console.log("[AllOrgsPage] fetchPendingJoinRequests aborted."); }
        } catch (err: any) { if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) && !signal?.aborted) { console.error("[AllOrgsPage] Failed to fetch pending join requests:", err); } }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        let isMounted = true;
        const fetchAllPageData = async () => {
            if (!isMounted) return; setLoadingPageData(true); setError(null);
            try {
                const orgsPromise = pb.collection('danusin_organization').getFullList<OrganizationDisplayData>({ sort: '-created', expand: 'created_by', signal, $autoCancel: false });
                let membershipsPromise = Promise.resolve(); let pendingRequestsPromise = Promise.resolve();
                if (currentUser?.id) {
                    membershipsPromise = fetchUserMemberships(currentUser.id, signal);
                    pendingRequestsPromise = fetchPendingJoinRequests(currentUser.id, signal);
                } else { setJoinedOrganizationIds(new Set()); setPendingRequestsData(new Map()); }
                const [orgsList] = await Promise.all([orgsPromise, membershipsPromise, pendingRequestsPromise]);
                if (isMounted && !signal.aborted) { setOrganizations(orgsList); }
            } catch (err: any) { if (!isMounted || signal.aborted) return; if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0)) { console.error("Failed to fetch page data:", err); setError("Gagal memuat data halaman."); toast({ title: "Error", description: "Gagal memuat data.", variant: "destructive" }); }
            } finally { if (isMounted && !signal.aborted) { setLoadingPageData(false); } }
        };
        fetchAllPageData();
        return () => { isMounted = false; controller.abort(); }
    }, [currentUser, fetchUserMemberships, fetchPendingJoinRequests]);

    useEffect(() => {
        const debouncer = setTimeout(() => {
            if (!searchTerm.trim()) { setFilteredOrganizations(organizations); } 
            else { const lowercasedSearchTerm = searchTerm.toLowerCase(); const filtered = organizations.filter(org => org.organization_name.toLowerCase().includes(lowercasedSearchTerm) || (org.organization_description && org.organization_description.toLowerCase().includes(lowercasedSearchTerm))); setFilteredOrganizations(filtered); }
        }, 300);
        return () => clearTimeout(debouncer);
    }, [searchTerm, organizations]);

        if (loadingPageData) { return ( <main className="w-full container mx-auto px-4 sm:px-6 py-6 sm:py-8"><div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 mb-6 md:mb-8"><Skeleton className="h-8 w-40 xs:w-1/2 sm:w-1/3" />{isDanuser && <Skeleton className="h-9 xs:h-10 w-full xs:w-auto max-w-[200px] xs:max-w-none" />}</div><div className="mb-6 md:mb-8"><Skeleton className="h-10 w-full sm:max-w-md rounded-md" /></div><OrganizationListSkeleton /></main> ); }
    
    function OrganizationListSkeleton() {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="rounded-xl overflow-hidden border border-border dark:border-zinc-700/60 bg-card dark:bg-zinc-800/70 flex flex-col h-full">
                        <Skeleton className="aspect-video w-full" />
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-full mb-2" />
                            <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }
    if (error) { return ( <main className="w-full container mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center"><div className="flex flex-col items-center justify-center py-10"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /><p className="text-destructive text-lg mb-3">{error}</p><Button onClick={() => window.location.reload()}>Muat Ulang Halaman</Button></div></main> ); }

    return (
        <main className="w-full container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-foreground order-2 xs:order-1"><Building2 className="mr-2 sm:mr-2.5 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />Semua Organisasi</h1>
                {isDanuser && (<Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white order-1 xs:order-2 w-full xs:w-auto text-xs sm:text-sm px-3 py-2 sm:px-4 rounded-md"><Link href="/dashboard/organization/new"><Plus className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Buat Organisasi Baru</span><span className="sm:hidden">Organisasi Baru</span></Link></Button>)}
            </div>
            <div className="mb-6 md:mb-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="text" placeholder="Cari organisasi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:max-w-md pl-10 pr-4 py-2 h-10 rounded-lg border-border focus-visible:ring-emerald-500" />
            </div>
            {organizations.length === 0 && !loadingPageData ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" /><p className="text-lg">Belum ada organisasi yang terdaftar.</p>
                    {isDanuser && (<Button asChild className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm rounded-md"><Link href="/dashboard/organization/new"><Plus className="mr-2 h-4 w-4" />Buat Organisasi Pertama Anda</Link></Button>)}
                </div>
            ) : filteredOrganizations.length === 0 && searchTerm ? (
                <div className="text-center py-12 text-muted-foreground">
                    <SearchX className="mx-auto h-12 w-12 mb-4 text-gray-400" /><p className="text-lg">Organisasi tidak ditemukan.</p><p className="text-sm">Coba kata kunci lain atau periksa ejaan Anda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
               
                    {filteredOrganizations.map((org) => {
                        const requestInfo = pendingRequestsData.get(org.id);
                        return (
                            <OrganizationDisplayCard
                                key={org.id}
                                organization={org}
                                currentUser={currentUser}
                                isAlreadyMember={joinedOrganizationIds.has(org.id)}
                                pendingRequestInfo={requestInfo ? { id: requestInfo } : undefined}
                                onRefreshPendingRequests={async () => {
                                    if (currentUser?.id) {
                                        console.log("[AllOrgsPage] Refreshing pending requests triggered from card action...");
                                        await fetchPendingJoinRequests(currentUser.id);
                                    }
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </main>
    );
}