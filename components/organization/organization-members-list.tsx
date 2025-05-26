"use client"

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { UserPlus, Users } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrganizationMemberItem } from "./organization-members-item"; // PASTIKAN PATH INI BENAR
import { ClientResponseError, RecordModel } from "pocketbase"; // Impor ClientResponseError dan RecordModel

// --- Definisi Tipe ---
type OrganizationInfo = {
    id: string;
    name: string;
    organization_slug?: string;
};

type UserData = RecordModel & {
    name?: string;
    email?: string;
    avatar?: string;
    username?: string;
    bio?: string;
    location_address?: string;
    phone?: string;
    otherOrganizations?: OrganizationInfo[] | null;
};

type OrganizationRole = RecordModel & {
    user: string | UserData;
    organization: string;
    role: string;
    expand?: {
        user?: UserData;
        organization?: RecordModel & {
            id: string;
            organization_name: string;
            organization_slug?: string;
        };
    };
};

type Member = {
    id: string;
    user: UserData;
    role: string;
    created: string;
};

// --- Komponen Skeleton Lokal ---
function MemberListSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row items-start gap-5 p-5 rounded-xl border bg-card">
            <Skeleton className="h-11 w-11 rounded-full sm:h-24 sm:w-24 sm:rounded-lg flex-shrink-0" />
            <div className="flex-1 w-full mt-2 sm:mt-0 flex flex-col min-h-[96px] sm:min-h-[150px]">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-3/5 sm:h-6" />
                        <Skeleton className="h-6 w-1/5 sm:h-5 sm:w-1/6" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex justify-end gap-3 mt-auto pt-3">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-9 sm:w-28 rounded-md" />
                </div>
            </div>
        </div>
    )
}

// --- Komponen Tampilan Kosong Lokal ---
interface MemberListEmptyStateProps {
    title: string;
    description: string;
    showButton: boolean;
    onInviteClick?: () => void;
    icon: React.ElementType;
}

function MemberListEmptyState({ title, description, showButton, icon: Icon, onInviteClick }: MemberListEmptyStateProps) {
    return (
        <div className="text-center py-16 px-6 bg-gradient-to-br from-card to-muted/30 dark:from-card dark:to-zinc-800/40 rounded-xl border-2 border-dashed border-muted-foreground/20 shadow-lg">
            <div className="mb-6 inline-flex items-center justify-center p-6 rounded-full bg-gradient-to-tr from-emerald-500 to-green-500 text-white shadow-xl">
                <Icon className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-foreground">{title}</h3>
            <p className="mb-8 max-w-sm text-base text-muted-foreground">
                {description}
            </p>
            {showButton && (
                <Button
                    onClick={onInviteClick}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-95 transition-all shadow-md hover:shadow-lg transform hover:scale-105 rounded-lg px-6 py-3 text-base"
                >
                    <UserPlus className="mr-2 h-5 w-5" /> Invite Member
                </Button>
            )}
        </div>
    );
}

// --- Komponen Dialog Undang Anggota Lokal ---
interface InviteMemberDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    inviteEmail: string;
    onInviteEmailChange: (email: string) => void;
    inviteRole: string;
    onInviteRoleChange: (role: string) => void;
    onInviteMember: () => Promise<void>;
    isInviting: boolean;
}

function InviteMemberDialog({
    isOpen,
    onOpenChange,
    inviteEmail,
    onInviteEmailChange,
    inviteRole,
    onInviteRoleChange,
    onInviteMember,
    isInviting,
}: InviteMemberDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-95 transition-all shadow-md hover:shadow-lg transform hover:scale-105 rounded-lg px-5 py-2.5 text-sm">
                    <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card rounded-lg shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">Invite New Member</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Enter the email address and select a role for the new member.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-invite-dialog" className="text-sm font-medium">Email Address</Label>
                        <Input
                            id="email-invite-dialog"
                            type="email"
                            placeholder="member@example.com"
                            value={inviteEmail}
                            onChange={(e) => onInviteEmailChange(e.target.value)}
                            className="h-10 rounded-md border-border focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role-invite-dialog" className="text-sm font-medium">Role</Label>
                        <Select value={inviteRole} onValueChange={onInviteRoleChange}>
                            <SelectTrigger id="role-invite-dialog" className="h-10 rounded-md border-border focus:ring-emerald-500 focus:border-emerald-500">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md shadow-lg">
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2 pt-2">
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-md w-full sm:w-auto" onClick={() => onOpenChange(false)}>Cancel</Button>
                    </DialogClose>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md w-full sm:w-auto" onClick={onInviteMember} disabled={isInviting || !inviteEmail.trim()}>
                        {isInviting ? "Inviting..." : "Send Invite"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Komponen Utama ---
export function OrganizationMembersList({
    organizationId,
    userRole,
}: { organizationId: string; userRole: string | null }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const isMountedRef = useRef(true);

    const { user: currentUser } = useAuth();
    const isAdmin = userRole === "admin";

    // Fungsi untuk memeriksa apakah error adalah pembatalan
    const isCancellationError = (error: any): boolean => {
        return (
            error.name === 'AbortError' ||
            (error instanceof ClientResponseError && error.message.includes('autocancelled')) ||
            (error instanceof ClientResponseError && error.status === 0)
        );
    };

    const fetchOtherOrgs = async (userId: string, currentOrgId: string, signal?: AbortSignal): Promise<OrganizationInfo[]> => {
        try {
            const results = await pb.collection("danusin_user_organization_roles").getFullList<OrganizationRole>({
                filter: `user.id="${userId}" && organization.id!="${currentOrgId}"`,
                expand: "organization",
                fields: "expand.organization.id,expand.organization.organization_name,expand.organization.organization_slug",
                signal: signal,
                $autoCancel: false,
            });
            return results
                .map(item => item.expand?.organization)
                .filter((org): org is RecordModel & { id: string; organization_name: string; organization_slug?: string } => !!org)
                .map(org => ({
                    id: org.id,
                    name: org.organization_name || "Unknown Org Name",
                    organization_slug: org.organization_slug,
                }));
        } catch (error: any) {
            if (!isCancellationError(error)) {
                console.warn(`Failed to fetch other organizations for user ${userId}:`, error);
            } else {
                console.log(`Other orgs fetch cancelled for user ${userId}.`);
            }
            return [];
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        const controller = new AbortController();

        const fetchMembers = async () => {
            setLoading(true);
            try {
                const result = await pb.collection("danusin_user_organization_roles").getList<OrganizationRole>(1, 100, {
                    filter: `organization="${organizationId}"`,
                    expand: "user",
                    signal: controller.signal,
                    $autoCancel: false,
                });

                if (!isMountedRef.current) return;

                const memberPromises = result.items.map(async (item) => {
                    const expandedUser = item.expand?.user;
                    let otherOrganizationsData: OrganizationInfo[] | null = null;

                    if (expandedUser) {
                        otherOrganizationsData = await fetchOtherOrgs(expandedUser.id, organizationId, controller.signal);
                    }

                    const userData: UserData = expandedUser ?? {
                        id: item.user as string,
                        collectionId: 'users', collectionName: 'users',
                        name: "User (Loading...)", email: "N/A", avatar: "", username: "", bio: "", location_address: "", phone: "",
                        otherOrganizations: null, created: '', updated: ''
                    };

                    return {
                        id: item.id,
                        user: { ...userData, otherOrganizations: otherOrganizationsData },
                        role: item.role,
                        created: item.created,
                    };
                });

                const membersData = await Promise.all(memberPromises);

                if (isMountedRef.current) {
                    setMembers(membersData.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()));
                }

            } catch (error: any) {
                if (!isCancellationError(error)) {
                    if (isMountedRef.current) {
                        console.error("Error fetching members:", error);
                        toast({ title: "Error", description: "Failed to fetch members list.", variant: "destructive" });
                    }
                } else {
                    console.log("Fetch members request cancelled (expected behavior).");
                }
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };

        if (organizationId) {
            fetchMembers();
        } else {
            setLoading(false);
            setMembers([]);
        }

        return () => {
            isMountedRef.current = false;
            controller.abort();
        };
    }, [organizationId]);

    const handleInviteMember = async () => {
        const email = inviteEmail.trim();
        if (!email) {
            toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
            return;
        }
        setIsInviting(true);
        try {
            let targetUser: UserData;
            try {
                targetUser = await pb.collection("users").getFirstListItem<UserData>(`email="${email}"`);
            } catch (error: any) {
                if (error instanceof ClientResponseError && error.status === 404) {
                    toast({ title: "Error", description: `User with email ${email} doesn't exist.`, variant: "destructive" });
                } else {
                    console.error("Error finding user:", error);
                    toast({ title: "Error", description: "Failed to find user.", variant: "destructive" });
                }
                setIsInviting(false);
                return;
            }

            try {
                await pb.collection("danusin_user_organization_roles").getFirstListItem(`user="${targetUser.id}" && organization="${organizationId}"`);
                toast({ title: "Info", description: "User is already a member of this organization.", variant: "default" });
                setIsInviting(false);
                return;
            } catch (error: any) {
                if (!(error instanceof ClientResponseError && error.status === 404)) throw error;
            }

            const newRoleRecord = await pb.collection("danusin_user_organization_roles").create<OrganizationRole>({
                user: targetUser.id,
                organization: organizationId,
                role: inviteRole,
            });

            const otherOrganizationsData = await fetchOtherOrgs(targetUser.id, organizationId);

            const newMember: Member = {
                id: newRoleRecord.id,
                user: { ...targetUser, otherOrganizations: otherOrganizationsData },
                role: newRoleRecord.role,
                created: newRoleRecord.created,
            };

            setMembers(prevMembers =>
                [...prevMembers, newMember].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
            );

            toast({ title: "Success", description: `${email} has been added as ${inviteRole}.` });
            setInviteEmail("");
            setInviteRole("member");
            setIsInviteDialogOpen(false);

        } catch (error) {
            console.error("Error inviting member:", error);
            toast({ title: "Error", description: "Failed to invite member. Please try again.", variant: "destructive" });
        } finally {
            setIsInviting(false);
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        const memberToUpdate = members.find(m => m.id === memberId);
        if (!memberToUpdate) return;

        if (!isAdmin && userRole !== "moderator") {
            toast({ title: "Permission Denied", description: "You cannot update roles.", variant: "destructive" });
            return;
        }
        if (userRole === "moderator" && (newRole === "admin" || newRole === "moderator")) {
            toast({ title: "Permission Denied", description: "Moderators can only change roles to 'member'.", variant: "destructive" });
            return;
        }
        if (memberToUpdate.role === 'admin' && userRole === "moderator") {
            toast({ title: "Permission Denied", description: "Moderators cannot change an admin's role.", variant: "destructive" });
            return;
        }
        const isLastAdmin = members.filter(m => m.role === 'admin').length <= 1;
        if (memberToUpdate.user.id === currentUser?.id && memberToUpdate.role === 'admin' && newRole !== 'admin' && isLastAdmin) {
            toast({ title: "Action Denied", description: "Cannot change the role of the only admin.", variant: "destructive" });
            return;
        }

        try {
            await pb.collection("danusin_user_organization_roles").update(memberId, { role: newRole });
            setMembers(members.map((member) => (member.id === memberId ? { ...member, role: newRole } : member)));
            toast({ title: "Success", description: `Member role updated to ${newRole}.` });
        } catch (error) {
            console.error("Error updating role:", error);
            toast({ title: "Error", description: "Failed to update member role.", variant: "destructive" });
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        const memberToRemove = members.find(m => m.id === memberId);
        if (!memberToRemove) return;

        if (!isAdmin && userRole !== "moderator") {
            toast({ title: "Permission Denied", description: "You cannot remove members.", variant: "destructive" });
            return;
        }
        const isLastAdmin = members.filter(m => m.role === 'admin').length <= 1;
        if (memberToRemove.role === 'admin' && isLastAdmin) {
             toast({ title: "Action Denied", description: "Cannot remove the only admin.", variant: "destructive" });
             return;
        }
        if (memberToRemove.role === 'admin' && userRole === "moderator") {
            toast({ title: "Permission Denied", description: "Moderators cannot remove an admin.", variant: "destructive" });
            return;
        }
        if (memberToRemove.role === 'moderator' && userRole === "moderator" && memberToRemove.user.id !== currentUser?.id) {
            toast({ title: "Permission Denied", description: "Moderators cannot remove other moderators.", variant: "destructive" });
            return;
        }

        try {
            await pb.collection("danusin_user_organization_roles").delete(memberId);
            setMembers(members.filter((member) => member.id !== memberId));
            toast({ title: "Success", description: "Member removed from organization." });
        } catch (error) {
            console.error("Error removing member:", error);
            toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <MemberListSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={300}>
            <div className="space-y-6">
                {isAdmin && (
                    <div className="flex justify-end">
                        <InviteMemberDialog
                            isOpen={isInviteDialogOpen}
                            onOpenChange={setIsInviteDialogOpen}
                            inviteEmail={inviteEmail}
                            onInviteEmailChange={setInviteEmail}
                            inviteRole={inviteRole}
                            onInviteRoleChange={setInviteRole}
                            onInviteMember={handleInviteMember}
                            isInviting={isInviting}
                        />
                    </div>
                )}

                {members.length === 0 ? (
                    <MemberListEmptyState
                        title="No Members Yet"
                        description={`This organization is looking for its first members! ${isAdmin ? "Why not invite someone to collaborate?" : ""}`}
                        showButton={isAdmin && !isInviteDialogOpen}
                        onInviteClick={() => setIsInviteDialogOpen(true)}
                        icon={Users}
                    />
                ) : (
                    <div className="bg-card shadow-md rounded-xl border border-border divide-y divide-border dark:divide-zinc-700/80">
                        {members.map((memberItem) => (
                            <OrganizationMemberItem
                                key={memberItem.id}
                                member={memberItem}
                                loggedInUserRole={userRole}
                                currentUserId={currentUser?.id}
                                onUpdateRole={handleUpdateRole}
                                onRemoveMember={handleRemoveMember}
                            />
                        ))}
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}