"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Mail, CheckCircle, XCircle, Loader2, Building2, AlertTriangle, Info, Users, LogIn } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RecordModel, ClientResponseError } from 'pocketbase';

// --- Tipe Data (Sama seperti sebelumnya) ---
type OrganizationRoleType = "admin" | "moderator" | "member";

interface UserReferenceData extends RecordModel {
    name?: string;
    username?: string;
    avatar?: string;
}

interface InvitedOrganizationData extends RecordModel {
    organization_name: string;
    organization_slug: string;
    organization_image?: string;
}

interface SessionInvitationRecord extends RecordModel {
    danuser_invite: string;
    danuser_invited: string;
    organization_id: string;
    role: OrganizationRoleType;
    status: "waiting" | "accepted" | "declined";
    expand?: {
        danuser_invite?: UserReferenceData;
        organization_id?: InvitedOrganizationData;
    };
}

interface AdminJoinRequestDisplayData extends RecordModel {
    id: string;
    danuser_request: string;
    danuser_organization: string;
    danuser_admin: string[];
    role: OrganizationRoleType; // Role yang diminta oleh user
    status: "waiting" | "approved" | "declined"; // Status permintaan
    created: string;
    expand?: {
        danuser_request?: UserReferenceData;
        danuser_organization?: InvitedOrganizationData;
    };
}

// --- Komponen Halaman ---
export default function InvitationsPage() {
    const { user: currentUser } = useAuth();

    const [invitations, setInvitations] = useState<SessionInvitationRecord[]>([]);
    const [loadingInvitations, setLoadingInvitations] = useState(true);
    const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

    const [adminJoinRequests, setAdminJoinRequests] = useState<AdminJoinRequestDisplayData[]>([]);
    const [loadingAdminRequests, setLoadingAdminRequests] = useState(true);
    const [processingAdminRequestId, setProcessingAdminRequestId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const pageAbortControllerRef = useRef<AbortController | null>(null);

    // fetchInvitations (Tanpa perubahan dari versi sebelumnya)
    const fetchInvitations = useCallback(async (userId: string, signal: AbortSignal) => {
        console.log("[InvitationsPage] Fetching personal invitations for user:", userId);
        try {
            const result = await pb.collection('danusin_session_invitation').getFullList<SessionInvitationRecord>({
                filter: `danuser_invited = "${userId}" && status = "waiting"`,
                expand: 'danuser_invite,organization_id',
                sort: '-created',
                signal,
                $autoCancel: false,
            });
             if (!signal.aborted) setInvitations(result);
        } catch (err: any) {
            if (err.name === 'AbortError' || (err instanceof ClientResponseError && err.status === 0) || err.isAbort) {
                console.log("[InvitationsPage] Personal invitations fetch was cancelled.");
            } else if (!signal.aborted) {
                console.error("[InvitationsPage] Failed to fetch personal invitations:", err);
                setError(prev => prev ? prev + " Gagal memuat undangan pribadi." : "Gagal memuat undangan pribadi.");
            }
        }
    }, []);

    // fetchAdminJoinRequests (Tanpa perubahan dari versi sebelumnya)
    const fetchAdminJoinRequests = useCallback(async (userId: string, signal: AbortSignal) => {
        console.log("[InvitationsPage] Fetching admin join requests for admin user:", userId);
        try {
            const result = await pb.collection('danusin_session_request').getFullList<AdminJoinRequestDisplayData>({
                filter: `danuser_admin ~ "${userId}" && status = "waiting"`,
                expand: 'danuser_request,danuser_organization',
                sort: '-created',
                signal,
                $autoCancel: false,
            });
            if (!signal.aborted) setAdminJoinRequests(result);
        } catch (err: any) {
            if (err.name === 'AbortError' || (err instanceof ClientResponseError && err.status === 0) || err.isAbort) {
                console.log("[InvitationsPage] Admin join requests fetch was cancelled.");
            } else if (!signal.aborted) {
                console.error("[InvitationsPage] Failed to fetch admin join requests:", err);
                setError(prev => prev ? prev + " Gagal memuat permintaan bergabung." : "Gagal memuat permintaan bergabung.");
            }
        }
    }, []);

    // useEffect utama untuk fetch data (Tanpa perubahan dari versi sebelumnya)
    useEffect(() => {
        if (pageAbortControllerRef.current) {
            pageAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        pageAbortControllerRef.current = controller;
        const signal = controller.signal;

        if (currentUser?.id) {
            setLoadingInvitations(true);
            setLoadingAdminRequests(true);
            setError(null);

            Promise.all([
                fetchInvitations(currentUser.id, signal),
                fetchAdminJoinRequests(currentUser.id, signal)
            ]).finally(() => {
                if (!signal.aborted) {
                    setLoadingInvitations(false);
                    setLoadingAdminRequests(false);
                }
            });
        } else {
            setInvitations([]);
            setAdminJoinRequests([]);
            setLoadingInvitations(false);
            setLoadingAdminRequests(false);
            setError(null);
        }
        return () => {
            console.log("[InvitationsPage] Cleanup main useEffect, aborting requests.");
            controller.abort();
        };
    }, [currentUser?.id, fetchInvitations, fetchAdminJoinRequests]);

    // handleAcceptInvitation (Tanpa perubahan dari versi sebelumnya)
    const handleAcceptInvitation = async (invitation: SessionInvitationRecord) => {
        if (!currentUser || !invitation.expand?.organization_id) {
            toast({ title: "Error", description: "Informasi tidak lengkap untuk menerima undangan.", variant: "destructive"});
            return;
        }
        setProcessingInviteId(invitation.id);
        let roleCreatedOrExists = false;
        try {
            try {
                await pb.collection('danusin_user_organization_roles').getFirstListItem(
                    `user="${currentUser.id}" && organization="${invitation.organization_id}"`
                );
                toast({ title: "Info", description: `Anda sudah menjadi anggota ${invitation.expand.organization_id.organization_name}.`, variant: "default" });
                roleCreatedOrExists = true;
            } catch (roleError: any) {
                if (roleError instanceof ClientResponseError && roleError.status === 404) {
                    await pb.collection('danusin_user_organization_roles').create({
                        user: currentUser.id,
                        organization: invitation.organization_id,
                        role: invitation.role,
                    });
                    roleCreatedOrExists = true;
                } else {
                    throw roleError;
                }
            }
            if (roleCreatedOrExists) {
                await pb.collection('danusin_session_invitation').delete(invitation.id);
                toast({ title: "Undangan Diterima!", description: `Anda berhasil bergabung dengan ${invitation.expand.organization_id.organization_name} sebagai ${invitation.role}.` });
                setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
            }
        } catch (err: any) {
            console.error("Failed to accept invitation:", err);
            let errMsg = "Gagal menerima undangan.";
            if (err instanceof ClientResponseError && err.response?.data?.data) {
                const pbErrorKey = Object.keys(err.response.data.data)[0];
                const pbError = err.response.data.data[pbErrorKey] as { message?: string };
                if (pbError?.message) errMsg = pbError.message;
            } else if (err.message) { errMsg = err.message; }
            toast({ title: "Error", description: errMsg, variant: "destructive" });
        } finally { setProcessingInviteId(null); }
    };

    // handleDeclineInvitation (Tanpa perubahan dari versi sebelumnya)
    const handleDeclineInvitation = async (invitationId: string) => {
        setProcessingInviteId(invitationId);
        try {
            await pb.collection('danusin_session_invitation').delete(invitationId);
            toast({ title: "Undangan Ditolak", description: "Anda telah menolak undangan organisasi." });
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        } catch (err: any) {
            console.error("Failed to decline invitation:", err);
            toast({ title: "Error", description: "Gagal menolak undangan.", variant: "destructive" });
        } finally { setProcessingInviteId(null); }
    };

    // --- Handlers for Admin Join Requests ---
    const handleApproveJoinRequest = async (request: AdminJoinRequestDisplayData) => {
        const requestingUser = request.expand?.danuser_request;
        const targetOrganization = request.expand?.danuser_organization;

        if (!requestingUser?.id || !targetOrganization?.id) {
            toast({title: "Error", description: "Data permintaan tidak lengkap (pengguna atau organisasi tidak ditemukan).", variant: "destructive"});
            return;
        }
        setProcessingAdminRequestId(request.id);
        const requestingUserId = requestingUser.id;
        const targetOrganizationId = targetOrganization.id;
        const requestedRole = request.role; // Role yang diminta dari record danusin_session_request

        try {
            // 1. Cek apakah pengguna sudah memiliki peran di organisasi tersebut.
            try {
                const existingRole = await pb.collection('danusin_user_organization_roles').getFirstListItem(
                    `user="${requestingUserId}" && organization="${targetOrganizationId}"`
                );
                // Pengguna sudah memiliki peran. Anda bisa memilih untuk update peran atau tidak.
                // Untuk saat ini, kita anggap jika sudah ada peran, itu sudah cukup.
                console.log(`User ${requestingUserId} already has role '${existingRole.role}' in org ${targetOrganizationId}.`);
                toast({ title: "Info", description: `Pengguna ${requestingUser.name || 'ini'} sudah menjadi anggota organisasi.`});
            } catch (roleError: any) {
                if (roleError instanceof ClientResponseError && roleError.status === 404) {
                    // Pengguna belum memiliki peran, buat peran baru.
                    await pb.collection('danusin_user_organization_roles').create({
                        user: requestingUserId,
                        organization: targetOrganizationId,
                        role: requestedRole, // Gunakan peran yang diminta dari session_request
                    });
                    toast({ title: "Peran Dibuat", description: `Pengguna ${requestingUser.name || 'baru'} ditambahkan ke organisasi ${targetOrganization.organization_name} sebagai ${requestedRole}.` });
                } else {
                    // Error lain saat pengecekan peran, lempar kembali untuk ditangani di catch utama.
                    throw roleError;
                }
            }

            // 2. PERUBAHAN: Hapus record permintaan dari danusin_session_request
            await pb.collection('danusin_session_request').delete(request.id);
            toast({ title: "Permintaan Disetujui", description: `Permintaan dari ${requestingUser.name || 'pengguna'} untuk bergabung dengan ${targetOrganization.organization_name} telah disetujui dan diproses.` });
            
            // Update local state to remove the processed request
            setAdminJoinRequests(prev => prev.filter(req => req.id !== request.id));

        } catch (err: any) {
            console.error("Failed to approve join request:", err);
            let errMsg = "Gagal menyetujui permintaan.";
            if (err instanceof ClientResponseError && err.response?.data?.data){
                 const firstKey = Object.keys(err.response.data.data)[0];
                 errMsg = err.response.data.data[firstKey]?.message || errMsg;
            } else if (err.message) {
                errMsg = err.message;
            }
            toast({ title: "Error Persetujuan", description: errMsg, variant: "destructive" });
        } finally {
            setProcessingAdminRequestId(null);
        }
    };

    const handleDeclineJoinRequest = async (requestId: string) => {
        setProcessingAdminRequestId(requestId);
        try {
            // PERUBAHAN: Hapus record permintaan dari danusin_session_request
            await pb.collection('danusin_session_request').delete(requestId);
            toast({ title: "Permintaan Ditolak", description: "Permintaan bergabung telah ditolak dan dihapus." });
            
            // Update local state
            setAdminJoinRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (err: any) {
            console.error("Failed to decline join request:", err);
            toast({ title: "Error Penolakan", description: "Gagal menolak permintaan.", variant: "destructive" });
        } finally {
            setProcessingAdminRequestId(null);
        }
    };


    if (loadingInvitations || loadingAdminRequests) {
        // ... Skeleton UI (Sama seperti sebelumnya)
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-6"> <Mail className="mr-3 h-7 w-7 text-emerald-600 dark:text-emerald-400" /> <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notifikasi</h1> </div>
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => ( // Reduced skeleton count for brevity
                        <Card key={`skel-inv-${i}`} className="shadow-sm animate-pulse">
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                                <div className="flex-grow space-y-2"> <Skeleton className="h-5 w-3/4" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-4 w-2/3" /> </div>
                                <div className="flex gap-2 sm:ml-auto mt-2 sm:mt-0"> <Skeleton className="h-9 w-20 rounded-md" /> <Skeleton className="h-9 w-20 rounded-md" /> </div>
                            </CardContent>
                        </Card>
                    ))}
                     {[...Array(1)].map((_, i) => (
                        <Card key={`skel-admin-req-${i}`} className="shadow-sm animate-pulse mt-6">
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                                <div className="flex-grow space-y-2"> <Skeleton className="h-5 w-3/4" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-4 w-2/3" /> </div>
                                <div className="flex gap-2 sm:ml-auto mt-2 sm:mt-0"> <Skeleton className="h-9 w-20 rounded-md" /> <Skeleton className="h-9 w-20 rounded-md" /> </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error && invitations.length === 0 && adminJoinRequests.length === 0) {
        // ... Error UI (Sama seperti sebelumnya, dengan onClick yang sudah diperbaiki)
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => {
                    if (currentUser?.id) {
                        const controller = new AbortController();
                        pageAbortControllerRef.current = controller;
                        setLoadingInvitations(true); setLoadingAdminRequests(true); setError(null);
                        Promise.all([
                            fetchInvitations(currentUser.id, controller.signal),
                            fetchAdminJoinRequests(currentUser.id, controller.signal)
                        ]).finally(() => {
                            if (!controller.signal.aborted) { setLoadingInvitations(false); setLoadingAdminRequests(false); }
                        });
                    }
                }}>Coba Lagi</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            {/* Section for Personal Invitations (Tanpa perubahan dari versi sebelumnya) */}
            <section>
                <div className="flex items-center mb-6 md:mb-8">
                    <Mail className="mr-3 h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Undangan Organisasi Anda</h1>
                </div>
                {invitations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg">
                        <Info className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                        <p className="text-lg">Tidak ada undangan baru untuk Anda saat ini.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invitations.map((invitation) => {
                            const inviter = invitation.expand?.danuser_invite;
                            const organization = invitation.expand?.organization_id;
                            const inviterAvatar = inviter?.avatar && inviter.id && inviter.collectionId ? pb.getFileUrl(inviter, inviter.avatar, { thumb: '50x50' }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(inviter?.name || inviter?.username || 'U')}&background=random&size=50`;
                            const organizationImage = organization?.organization_image && organization.id && organization.collectionId ? pb.getFileUrl(organization, organization.organization_image, { thumb: '100x100' }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(organization?.organization_name || 'Org').charAt(0)}&background=random&size=100&bold=true&color=fff&format=svg`;

                            return (
                                <Card key={invitation.id} className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={inviterAvatar} alt={inviter?.name || "Pengirim"} />
                                            <AvatarFallback>{(inviter?.name || inviter?.username || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-semibold text-foreground">{inviter?.name || inviter?.username || "Seseorang"}</span> mengundang Anda untuk bergabung dengan organisasi:
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Image src={organizationImage} alt={organization?.organization_name || "Org"} width={32} height={32} className="h-8 w-8 rounded-md object-cover border" onError={(e) => { const target = e.target as HTMLImageElement; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(organization?.organization_name || 'Org').charAt(0)}&background=random&size=32&bold=true&color=fff&format=svg`; }}/>
                                                <Link href={`/dashboard/organization/view/${organization?.id}`} className="text-md font-semibold text-emerald-600 hover:underline">
                                                    {organization?.organization_name || "Nama Organisasi Tidak Ada"}
                                                </Link>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-x-1.5">
                                                <span>Sebagai:</span>
                                                <Badge variant="secondary" className="capitalize">{invitation.role}</Badge>
                                                <span>| Diterima pada: {new Date(invitation.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto mt-3 sm:mt-0 w-full sm:w-auto">
                                            <Button size="sm" variant="outline" className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-700/20 dark:hover:text-red-400" onClick={() => handleDeclineInvitation(invitation.id)} disabled={processingInviteId === invitation.id} >
                                                {processingInviteId === invitation.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Tolak
                                            </Button>
                                            <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAcceptInvitation(invitation)} disabled={processingInviteId === invitation.id} >
                                                {processingInviteId === invitation.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Terima
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Section for Admin to Review Join Requests (Tanpa perubahan dari versi sebelumnya) */}
            <section>
                <div className="flex items-center mb-6 md:mb-8">
                    <Users className="mr-3 h-7 w-7 text-sky-600 dark:text-sky-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Permintaan Bergabung ke Organisasi Anda</h1>
                </div>
                {adminJoinRequests.length === 0 ? (
                     <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg">
                        <Info className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                        <p className="text-lg">Tidak ada permintaan bergabung yang menunggu persetujuan Anda.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {adminJoinRequests.map((request) => {
                            const requestingUser = request.expand?.danuser_request;
                            const targetOrganization = request.expand?.danuser_organization;
                            const userAvatar = requestingUser?.avatar && requestingUser.id && requestingUser.collectionId ? pb.getFileUrl(requestingUser, requestingUser.avatar, { thumb: '50x50' }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(requestingUser?.name || requestingUser?.username || 'U')}&background=random&size=50`;
                            const organizationImage = targetOrganization?.organization_image && targetOrganization.id && targetOrganization.collectionId ? pb.getFileUrl(targetOrganization, targetOrganization.organization_image, { thumb: '100x100' }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetOrganization?.organization_name || 'Org').charAt(0)}&background=random&size=100&bold=true&color=fff&format=svg`;

                            return (
                                <Card key={request.id} className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={userAvatar} alt={requestingUser?.name || "Pemohon"} />
                                            <AvatarFallback>{(requestingUser?.name || requestingUser?.username || "U").substring(0,2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-semibold text-foreground">{requestingUser?.name || requestingUser?.username || "Seseorang"}</span> meminta untuk bergabung dengan organisasi:
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                 <Image src={organizationImage} alt={targetOrganization?.organization_name || "Org"} width={32} height={32} className="h-8 w-8 rounded-md object-cover border" onError={(e) => {const target = e.target as HTMLImageElement; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(targetOrganization?.organization_name || 'Org').charAt(0)}&background=random&size=32&bold=true&color=fff&format=svg`;}}/>
                                                <Link href={`/dashboard/organization/view/${targetOrganization?.id}`} className="text-md font-semibold text-sky-600 hover:underline">
                                                    {targetOrganization?.organization_name || "Nama Organisasi Tidak Ada"}
                                                </Link>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-x-1.5">
                                                <span>Meminta peran:</span>
                                                <Badge variant="outline" className="capitalize border-sky-500 text-sky-600">{request.role}</Badge>
                                                <span>| Diajukan pada: {new Date(request.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto mt-3 sm:mt-0 w-full sm:w-auto">
                                            <Button size="sm" variant="outline" className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-700/20 dark:hover:text-red-400" onClick={() => handleDeclineJoinRequest(request.id)} disabled={processingAdminRequestId === request.id} >
                                                {processingAdminRequestId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Tolak
                                            </Button>
                                            <Button size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveJoinRequest(request)} disabled={processingAdminRequestId === request.id} >
                                                {processingAdminRequestId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Setujui
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}