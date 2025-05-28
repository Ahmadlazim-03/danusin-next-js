"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Mail, CheckCircle, XCircle, Loader2, Building2, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RecordModel, ClientResponseError } from 'pocketbase';

// --- Tipe Data ---
type OrganizationRoleType = "admin" | "moderator" | "member";

interface InviterData extends RecordModel {
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
    status: "waiting" | "accepted" | "declined" | "processing_accept"; // Status 'processing_accept' bisa opsional
    expand?: {
        danuser_invite?: InviterData;
        organization_id?: InvitedOrganizationData;
    };
}

// --- Komponen Halaman ---
export default function InvitationsPage() {
    const { user: currentUser } = useAuth();
    const [invitations, setInvitations] = useState<SessionInvitationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

    const fetchInvitations = useCallback(async (userId: string, signal?: AbortSignal) => {
        if (invitations.length === 0 || error) {
            setLoading(true);
        }
        setError(null);
        try {
            const result = await pb.collection('danusin_session_invitation').getFullList<SessionInvitationRecord>({
                filter: `danuser_invited = "${userId}" && status = "waiting"`,
                expand: 'danuser_invite,organization_id',
                sort: '-created',
                signal,
                $autoCancel: false, 
            });
            setInvitations(result);
        } catch (err: any) {
            if (err.name === 'AbortError' || (err instanceof ClientResponseError && err.status === 0) || err.isAbort) {
                console.log("[InvitationsPage] Invitations fetch was cancelled:", err.message);
            } else {
                console.error("[InvitationsPage] Failed to fetch invitations:", err);
                setError("Gagal memuat undangan.");
                toast({ title: "Error Memuat Undangan", description: err.message || "Terjadi kesalahan.", variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }
    }, [invitations.length, error]); 

    useEffect(() => {
        let controller = new AbortController();
        if (currentUser?.id) {
            fetchInvitations(currentUser.id, controller.signal);
        } else {
            setLoading(false);
            setInvitations([]);
        }
        return () => {
            controller.abort();
        };
    }, [currentUser?.id, fetchInvitations]);


    const handleAcceptInvitation = async (invitation: SessionInvitationRecord) => {
        if (!currentUser || !invitation.expand?.organization_id) {
            toast({ title: "Error", description: "Informasi tidak lengkap untuk menerima undangan.", variant: "destructive"});
            return;
        }
        setProcessingInviteId(invitation.id);
        let roleCreated = false;
        try {
            // 1. Cek apakah sudah menjadi anggota atau coba buat peran baru
            try {
                await pb.collection('danusin_user_organization_roles').getFirstListItem(
                    `user="${currentUser.id}" && organization="${invitation.organization_id}"`
                );
                toast({ title: "Info", description: `Anda sudah menjadi anggota ${invitation.expand.organization_id.organization_name}.`, variant: "default" });
                roleCreated = true; // Anggap peran sudah ada
            } catch (roleError: any) {
                if (roleError instanceof ClientResponseError && roleError.status === 404) {
                    // Belum jadi anggota, buat peran baru
                    await pb.collection('danusin_user_organization_roles').create({
                        user: currentUser.id,
                        organization: invitation.organization_id,
                        role: invitation.role,
                    });
                    roleCreated = true;
                } else {
                    throw roleError; // Lempar error lain jika bukan "tidak ditemukan"
                }
            }

            // 2. Jika pembuatan/pengecekan peran berhasil, hapus record undangan
            if (roleCreated) {
                await pb.collection('danusin_session_invitation').delete(invitation.id); // <--- DIHAPUS
                toast({ title: "Undangan Diterima!", description: `Anda berhasil bergabung dengan ${invitation.expand.organization_id.organization_name} sebagai ${invitation.role}.` });
                setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
            }

        } catch (err: any) {
            console.error("Failed to accept invitation:", err);
            let errMsg = "Gagal menerima undangan.";
            if (err instanceof ClientResponseError && err.data?.data) { 
                const pbErrorKey = Object.keys(err.data.data)[0];
                const pbError = err.data.data[pbErrorKey] as { message?: string };
                if (pbError?.message) errMsg = pbError.message; 
            } else if (err.message) { 
                errMsg = err.message; 
            }
            toast({ title: "Error", description: errMsg, variant: "destructive" });
        } finally { 
            setProcessingInviteId(null); 
        }
    };

    const handleDeclineInvitation = async (invitationId: string) => {
        setProcessingInviteId(invitationId);
        try {
            await pb.collection('danusin_session_invitation').delete(invitationId); // <--- DIHAPUS
            toast({ title: "Undangan Ditolak", description: "Anda telah menolak undangan organisasi." });
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        } catch (err: any) { 
            console.error("Failed to decline invitation:", err); 
            toast({ title: "Error", description: "Gagal menolak undangan.", variant: "destructive" });
        } finally { 
            setProcessingInviteId(null); 
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-6"> <Mail className="mr-3 h-7 w-7 text-emerald-600 dark:text-emerald-400" /> <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Undangan Organisasi</h1> </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="shadow-sm animate-pulse">
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

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                 <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-semibold text-red-600 mb-2">Terjadi Kesalahan</h1>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => currentUser && fetchInvitations(currentUser.id)}>Coba Lagi</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6 md:mb-8"> 
                <Mail className="mr-3 h-7 w-7 text-emerald-600 dark:text-emerald-400" /> 
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Undangan Organisasi</h1> 
            </div>
            {invitations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card border border-dashed rounded-lg"> 
                    <Info className="mx-auto h-12 w-12 mb-4 text-gray-400" /> 
                    <p className="text-lg">Tidak ada undangan baru untuk Anda saat ini.</p> 
                </div>
            ) : (
                <div className="space-y-4">
                    {invitations.map((invitation) => {
                        const inviter = invitation.expand?.danuser_invite;
                        const organization = invitation.expand?.organization_id;
                        const inviterAvatar = inviter?.avatar && inviter.id && inviter.collectionId ? pb.getFileUrl(inviter, inviter.avatar, { thumb: '50x50' }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(inviter?.name || inviter?.username || 'U')}&background=random&size=50`;
                        const organizationImage = organization?.organization_image && organization.id && organization.collectionId ? pb.getFileUrl(organization, organization.organization_image, {thumb: '100x100'}) : `https://ui-avatars.com/api/?name=${encodeURIComponent(organization?.organization_name || 'Org')}&background=random&size=100&bold=true&color=fff&format=svg`;
                        
                        return (
                            <Card key={invitation.id} className="shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <Avatar className="h-12 w-12 border"> 
                                        <AvatarImage src={inviterAvatar} alt={inviter?.name || "Pengirim"} /> 
                                        <AvatarFallback>{(inviter?.name || inviter?.username || "U").substring(0,2).toUpperCase()}</AvatarFallback> 
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="text-sm text-muted-foreground"> 
                                            <span className="font-semibold text-foreground">{inviter?.name || inviter?.username || "Seseorang"}</span> mengundang Anda untuk bergabung dengan organisasi: 
                                        </p>
                                        <div className="flex items-center gap-2 mt-1"> 
                                            <Image src={organizationImage} alt={organization?.organization_name || "Org"} width={32} height={32} className="h-8 w-8 rounded-md object-cover border" onError={(e) => {const target = e.target as HTMLImageElement; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(organization?.organization_name || 'Org').charAt(0)}&background=random&size=32&bold=true&color=fff&format=svg`;}}/> 
                                            <Link href={`/dashboard/organization/view/${organization?.organization_slug || organization?.id}`} className="text-md font-semibold text-emerald-600 hover:underline"> 
                                                {organization?.organization_name || "Nama Organisasi Tidak Ada"} 
                                            </Link> 
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-x-1.5">
                                            <span>Sebagai:</span>
                                            <Badge variant="secondary" className="capitalize">{invitation.role}</Badge>
                                            <span>| Diterima pada: {new Date(invitation.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto mt-3 sm:mt-0 w-full sm:w-auto">
                                        <Button size="sm" variant="outline" className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-700/20 dark:hover:text-red-400" onClick={() => handleDeclineInvitation(invitation.id)} disabled={processingInviteId === invitation.id} > 
                                            {processingInviteId === invitation.id && invitation.status !== 'processing_accept' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Tolak 
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
        </div>
    );
}