"use client"

import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
    Dialog, DialogClose, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import {
    Building2,
    Check,
    ChevronsUpDown,
    Edit3,
    MapPin,
    MoreHorizontal,
    Phone,
    Trash2,
    UserPlus, Users as UsersIconList
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ClientResponseError, RecordModel } from "pocketbase";
import React, { JSX, useCallback, useEffect, useRef, useState } from "react";

// --- Definisi Tipe ---
type OrganizationInfoForMember = { id: string; name: string; organization_slug?: string; };
type UserDataForMember = RecordModel & { name?: string; email?: string; avatar?: string; username?: string; bio?: string; location_address?: string; phone?: string; otherOrganizations?: OrganizationInfoForMember[] | null; };
type OrganizationRoleType = "admin" | "moderator" | "member";
type OrganizationRoleRecord = RecordModel & { user: string; organization: string; role: OrganizationRoleType; expand?: { user?: UserDataForMember; }; };
type MemberDisplayItem = { id: string; user: UserDataForMember; role: OrganizationRoleType; created: string; };

interface OrganizationMemberItemProps {
    member: MemberDisplayItem;
    loggedInUserRole: string | null;
    currentUserId: string | undefined;
    onUpdateRole: (memberRoleId: string, newRole: OrganizationRoleType) => Promise<void>;
    onRemoveMember: (memberRoleId: string) => Promise<void>;
}

interface InviteMemberDialogProps {
    isOpen: boolean; onOpenChange: (isOpen: boolean) => void; selectedInvitedUserId: string | null;
    onSelectInvitedUser: (userId: string | null, userNameToDisplay?: string) => void;
    userSearchTerm: string; onUserSearchTermChange: (term: string) => void;
    searchableUsers: UserDataForMember[]; loadingSearchableUsers: boolean;
    isUserComboboxOpen: boolean; onUserComboboxOpenChange: (open: boolean) => void;
    currentMembers: MemberDisplayItem[]; inviteRole: OrganizationRoleType;
    onInviteRoleChange: (role: OrganizationRoleType) => void;
    onInviteMember: () => Promise<void>; isInviting: boolean;
}

interface MemberListEmptyStateProps { title: string; description: string; showButton: boolean; onInviteClick?: () => void; icon: React.ElementType;}

// --- Komponen Skeleton Lokal ---
function MemberListSkeleton(): JSX.Element {
    return (
        <div className="flex flex-col sm:flex-row items-start gap-5 p-5 rounded-xl border bg-card">
            <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 w-full mt-1 sm:mt-0">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-3/5 mb-1" />
                    <Skeleton className="h-5 w-1/5" />
                </div>
                <Skeleton className="h-4 w-4/5 mb-2" />
                <Skeleton className="h-3 w-1/2" />
                 <div className="flex justify-end gap-3 mt-auto pt-3">
                    <Skeleton className="h-8 w-24 rounded-md" />
                </div>
            </div>
        </div>
    );
}

// --- Komponen Tampilan Kosong Lokal ---
function MemberListEmptyState({ title, description, showButton, icon: Icon, onInviteClick }: MemberListEmptyStateProps): JSX.Element {
    return (
        <div className="text-center py-16 px-6 bg-gradient-to-br from-card to-muted/30 dark:from-card dark:to-zinc-800/40 rounded-xl border-2 border-dashed border-muted-foreground/20 shadow-lg">
            <div className="mb-6 inline-flex items-center justify-center p-6 rounded-full bg-gradient-to-tr from-emerald-500 to-green-500 text-white shadow-xl">
                <Icon className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-foreground">{title}</h3>
            <p className="mb-8 max-w-sm text-base text-muted-foreground mx-auto">{description}</p>
            {showButton && onInviteClick && (
                <Button onClick={onInviteClick} size="lg" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-95 transition-all shadow-md hover:shadow-lg transform hover:scale-105 rounded-lg px-6 py-3 text-base" >
                    <UserPlus className="mr-2 h-5 w-5" /> Invite Member
                </Button>
            )}
        </div>
    );
}

// --- Komponen Inline untuk Item Anggota dengan HoverCard & Aksi ---
function OrganizationMemberItem({ member, loggedInUserRole, currentUserId, onUpdateRole, onRemoveMember }: OrganizationMemberItemProps): JSX.Element {
    const user = member.user;
    const memberAvatarUrl = user.avatar && user.collectionId && user.id ? pb.getFileUrl(user, user.avatar, { thumb: '100x100' }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U')}&background=random&size=100`;
    const getRoleBadgeVariant = (role: OrganizationRoleType) => { switch (role) { case 'admin': return 'destructive'; case 'moderator': return 'secondary'; default: return 'outline'; } };
    const joinDateString = member.created;
    let displayDate = 'Tanggal tidak valid';
    if (joinDateString) { const dateObj = new Date(joinDateString); if (!isNaN(dateObj.getTime())) { displayDate = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', }); } } else { displayDate = 'Tanggal tidak tersedia'; }

    const isSelf = user.id === currentUserId;
    const showActions = !isSelf && (
        loggedInUserRole === 'admin' ||
        (loggedInUserRole === 'moderator' && member.role === 'member')
    );

    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div className="flex flex-col sm:flex-row items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer rounded-lg">
                    <Image src={memberAvatarUrl} alt={user.name || user.username || 'Avatar'} width={64} height={64} className="w-16 h-16 rounded-lg object-cover border flex-shrink-0" onError={(e) => {const target = e.target as HTMLImageElement; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U').charAt(0)}&background=random&size=100`;}} />
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-foreground truncate" title={user.name || user.username}>
                                {user.name || user.username}
                                {isSelf && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                            </h3>
                             <div className="flex items-center gap-2">
                                <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize text-xs px-2 py-0.5 flex-shrink-0">{member.role}</Badge>
                                {showActions && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 data-[state=open]:bg-muted">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Aksi untuk {user.name}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Kelola Anggota</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger disabled={loggedInUserRole !== 'admin'}> {/* Hanya admin bisa ubah peran */}
                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                    <span>Ubah Peran</span>
                                                </DropdownMenuSubTrigger>
                                                {loggedInUserRole === 'admin' && (
                                                    <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {(["member", "moderator", "admin"] as OrganizationRoleType[]).map((roleOption) => (
                                                            <DropdownMenuItem key={roleOption} onClick={() => onUpdateRole(member.id, roleOption)} disabled={member.role === roleOption}>
                                                                {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                                                                {member.role === roleOption && <Check className="ml-auto h-4 w-4" />}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                )}
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-400" onClick={() => onRemoveMember(member.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Keluarkan Anggota</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                             </div>
                        </div>
                        {user.email && <p className="text-sm text-muted-foreground break-all">{user.email}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Joined: {displayDate}</p>
                    </div>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 bg-card border-border shadow-2xl rounded-xl p-6" side="right" align="start">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                        <Image src={memberAvatarUrl} alt={user.name || 'Avatar'} width={56} height={56} className="h-14 w-14 rounded-full border-2 border-emerald-500 object-cover" onError={(e) => {const target = e.target as HTMLImageElement; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U').charAt(0)}&background=random&size=100`;}} />
                        <div className="min-w-0">
                            <h4 className="text-lg font-semibold text-foreground truncate">{user.name || user.username}</h4>
                            {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                            {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                        </div>
                    </div>
                    {user.bio && ( <div className="border-t border-border pt-4"> <h5 className="text-sm font-medium text-foreground mb-1">BIO</h5> <p className="text-sm text-muted-foreground leading-snug">{user.bio}</p> </div> )}
                    {(user.location_address || user.phone) && ( <div className="border-t border-border pt-4"> <h5 className="text-sm font-medium text-foreground mb-2">CONTACT INFO</h5> <div className="space-y-2 text-sm text-muted-foreground"> {user.location_address && ( <div className="flex items-start"> <MapPin className="h-4 w-4 mr-3 mt-0.5 text-emerald-500 flex-shrink-0" /> <span>{user.location_address}</span> </div> )} {user.phone && ( <div className="flex items-center"> <Phone className="h-4 w-4 mr-3 text-emerald-500 flex-shrink-0" /> <span>{user.phone}</span> </div> )} </div> </div> )}
                    {user.otherOrganizations && user.otherOrganizations.length > 0 && ( <div className="border-t border-border pt-4"> <h5 className="text-sm font-medium text-foreground mb-2">ALSO MEMBER OF</h5> <div className="space-y-1.5"> {user.otherOrganizations.map(org => ( <Link key={org.id} href={`/dashboard/organizations/${org.organization_slug || org.id}`} className="flex items-center group text-sm" > <Building2 className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-emerald-500 transition-colors flex-shrink-0" /> <span className="text-muted-foreground group-hover:text-primary group-hover:underline transition-colors truncate">{org.name}</span> </Link> ))} </div> </div> )}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

// --- Komponen InviteMemberDialog ---
function InviteMemberDialog({
    isOpen, onOpenChange, selectedInvitedUserId, onSelectInvitedUser,
    userSearchTerm, onUserSearchTermChange, searchableUsers, loadingSearchableUsers,
    isUserComboboxOpen, onUserComboboxOpenChange, currentMembers,
    inviteRole, onInviteRoleChange, onInviteMember, isInviting,
}: InviteMemberDialogProps): JSX.Element {
    const getSelectedUserName = () => {
        if (!selectedInvitedUserId) return "Pilih Pengguna...";
        let selectedUser = searchableUsers.find(u => u.id === selectedInvitedUserId);
        if (!selectedUser) { const member = currentMembers.find(m => m.user.id === selectedInvitedUserId); if (member) selectedUser = member.user; }
        return selectedUser?.name || selectedUser?.username || "Pengguna Terpilih";
    };
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) {onUserComboboxOpenChange(false); onUserSearchTermChange(""); onSelectInvitedUser(null, "Pilih Pengguna...");} }}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-95 transition-all shadow-md hover:shadow-lg transform hover:scale-105 rounded-lg px-5 py-2.5 text-sm"> <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Invite Member </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card rounded-lg shadow-xl">
                <DialogHeader> <DialogTitle className="text-xl font-semibold text-foreground">Invite New Member</DialogTitle> <DialogDescription className="text-muted-foreground"> Cari dan pilih pengguna lalu tentukan perannya untuk diundang. </DialogDescription> </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"> <Label htmlFor="user-combobox" className="text-sm font-medium">Nama Pengguna</Label>
                        <Popover open={isUserComboboxOpen} onOpenChange={onUserComboboxOpenChange}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={isUserComboboxOpen} className="w-full justify-between h-10 rounded-md border-border focus:ring-emerald-500 focus:border-emerald-500" id="user-combobox" >
                                    <span className="truncate">{getSelectedUserName()}</span> <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput placeholder="Cari nama atau username..." value={userSearchTerm} onValueChange={onUserSearchTermChange} />
                                    <CommandEmpty> {loadingSearchableUsers ? "Mencari..." : (userSearchTerm.trim().length < 1 ? "Ketik untuk mencari" : "Pengguna tidak ditemukan.")} </CommandEmpty>
                                    <CommandGroup> <CommandList>
                                        {searchableUsers.map((user) => {
                                            let avatarDisplayUrl = null; if(user.avatar && user.id && user.collectionId) { avatarDisplayUrl = pb.getFileUrl(user, user.avatar, { thumb: '50x50' }); }
                                            return ( <CommandItem key={user.id} value={`${user.name || ""}-${user.username || ""}-${user.id}`} onSelect={() => { onSelectInvitedUser(user.id, user.name || user.username); onUserComboboxOpenChange(false); }} className="flex items-center gap-2 cursor-pointer" >
                                                <Check className={cn("mr-2 h-4 w-4", selectedInvitedUserId === user.id ? "opacity-100" : "opacity-0")} />
                                                <Avatar className="h-6 w-6"> {avatarDisplayUrl && <AvatarImage src={avatarDisplayUrl} alt={user.name || user.username} />} <AvatarFallback className="text-xs">{(user.name || user.username || "U").substring(0,2).toUpperCase()}</AvatarFallback> </Avatar>
                                                <div className="flex flex-col"> <span className="text-sm truncate">{user.name || user.username}</span> {user.name && user.username && <span className="text-xs text-muted-foreground truncate">@{user.username}</span>} </div>
                                            </CommandItem> )})}
                                    </CommandList> </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2"> <Label htmlFor="role-invite-dialog" className="text-sm font-medium">Role</Label>
                        <Select value={inviteRole} onValueChange={(value) => onInviteRoleChange(value as OrganizationRoleType)}>
                            <SelectTrigger id="role-invite-dialog" className="h-10 rounded-md border-border focus:ring-emerald-500 focus:border-emerald-500"> <SelectValue placeholder="Select a role" /> </SelectTrigger>
                            <SelectContent className="rounded-md shadow-lg"> <SelectItem value="moderator">Moderator</SelectItem> <SelectItem value="member">Member</SelectItem> </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2 pt-2">
                    <DialogClose asChild><Button variant="outline" className="rounded-md w-full sm:w-auto" onClick={() => { onOpenChange(false); onUserComboboxOpenChange(false); onUserSearchTermChange(""); onSelectInvitedUser(null,"Pilih Pengguna...");}}>Cancel</Button></DialogClose>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md w-full sm:w-auto" onClick={onInviteMember} disabled={isInviting || !selectedInvitedUserId}> {isInviting ? "Sending Invite..." : "Send Invite"} </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Komponen Utama ---
// Props interface untuk OrganizationMembersList
interface OrganizationMembersListProps {
  organizationId: string;
  userRole: string | null;
  canInviteMembers?: boolean; // <-- FIX: Ditambahkan di sini
}

export function OrganizationMembersList({
    organizationId,
    userRole,
    canInviteMembers, // <-- FIX: Destructure prop baru di sini
}: OrganizationMembersListProps) {
    const [members, setMembers] = useState<MemberDisplayItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteRole, setInviteRole] = useState<OrganizationRoleType>("member");
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const isMountedRef = useRef(true);
    const { user: currentUser } = useAuth();
    // const isAdmin = userRole === "admin"; // 'isAdmin' is defined but not used. Consider using 'canInviteMembers' instead.
                                            // Atau, if 'isAdmin' is used elsewhere, 'canInviteMembers' might be redundant
                                            // depending on how it's derived in the parent (page.tsx).
                                            // For now, 'canInviteMembers' passed from parent is used.

    const [selectedInvitedUserId, setSelectedInvitedUserId] = useState<string | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [searchableUsers, setSearchableUsers] = useState<UserDataForMember[]>([]);
    const [loadingSearchableUsers, setLoadingSearchableUsers] = useState(false);
    const [isUserComboboxOpen, setIsUserComboboxOpen] = useState(false);
    const [selectedInvitedUserDisplayName, setSelectedInvitedUserDisplayName] = useState("Pilih Pengguna...");

    const isCancellationError = (error: any): boolean => (error.name === 'AbortError' || (error instanceof ClientResponseError && error.message.includes('autocancelled')) || (error instanceof ClientResponseError && error.status === 0));

    const fetchOtherOrgs = useCallback(async (userIdToFetch: string, currentOrgId: string, signal?: AbortSignal): Promise<OrganizationInfoForMember[]> => {
        try {
            const results = await pb.collection("danusin_user_organization_roles").getFullList<OrganizationRoleRecord>({ filter: `user="${userIdToFetch}" && organization!="${currentOrgId}"`, expand: "organization", fields: "expand.organization.id,expand.organization.organization_name,expand.organization.organization_slug", signal: signal, $autoCancel: false, });
            return results.map(item => item.expand?.organization).filter((org): org is RecordModel & { id: string; organization_name: string; organization_slug?: string } => !!org).map(org => ({ id: org.id, name: org.organization_name || "Unknown Org Name", organization_slug: org.organization_slug, }));
        } catch (error: any) { if (!isCancellationError(error)) { console.warn(`Failed to fetch other organizations for user ${userIdToFetch}:`, error); } return []; }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        const controller = new AbortController();
        const fetchMembers = async () => {
            if (!organizationId) { if(isMountedRef.current) { setLoading(false); setMembers([]); } return; }
            if(isMountedRef.current) setLoading(true);
            try {
                const result = await pb.collection("danusin_user_organization_roles").getList<OrganizationRoleRecord>(1, 100, { filter: `organization="${organizationId}"`, expand: "user", signal: controller.signal, $autoCancel: false, });
                if (!isMountedRef.current || controller.signal.aborted) return;
                if (result.items.length === 0) { if(isMountedRef.current) setMembers([]); }
                else {
                    const memberPromises = result.items.map(async (item) => {
                        const expandedUser = item.expand?.user as UserDataForMember | undefined;
                        let finalUserData: UserDataForMember;
                        if (expandedUser && expandedUser.id) {
                            finalUserData = { ...expandedUser };
                            if (!controller.signal.aborted) {
                                const otherOrganizationsData = await fetchOtherOrgs(expandedUser.id, organizationId, controller.signal);
                                if (controller.signal.aborted) throw new DOMException('Aborted during fetchOtherOrgs', 'AbortError');
                                finalUserData.otherOrganizations = otherOrganizationsData;
                            }
                        } else { finalUserData = { id: item.user, name: "User Load Error", collectionId: '', collectionName: '', created:'', updated:'' }; }
                        return { id: item.id, user: finalUserData, role: item.role, created: item.created };
                    });
                    const membersData = await Promise.all(memberPromises);
                     if (isMountedRef.current && !controller.signal.aborted) {
                        membersData.sort((a, b) => { const roleOrder: Record<string, number> = { admin: 0, moderator: 1, member: 2 }; const orderA = roleOrder[a.role] ?? 99; const orderB = roleOrder[b.role] ?? 99; if (orderA !== orderB) { return orderA - orderB; } return new Date(a.created).getTime() - new Date(b.created).getTime(); });
                        setMembers(membersData);
                    }
                }
            } catch (error: any) { if (!isCancellationError(error)) { if (isMountedRef.current) { console.error("Error fetching members:", error); toast({ title: "Error Memuat Anggota", description: `Gagal memuat daftar anggota.`, variant: "destructive" }); setMembers([]); } } }
            finally { if (isMountedRef.current && !controller.signal.aborted) { setLoading(false); } }
        };
        fetchMembers();
        return () => { isMountedRef.current = false; controller.abort(); };
    }, [organizationId, fetchOtherOrgs]);

     useEffect(() => {
        if (!isUserComboboxOpen || userSearchTerm.trim().length < 1) { setSearchableUsers([]); if (userSearchTerm.trim().length === 0) setLoadingSearchableUsers(false); return; }
        setLoadingSearchableUsers(true);
        const delayDebounceFn = setTimeout(async () => {
            if (!isMountedRef.current) return;
            try {
                const existingMemberIds = members.map(m => m.user.id);
                if(currentUser?.id) existingMemberIds.push(currentUser.id);
                let filterQuery = `(name ~ "${userSearchTerm}" || username ~ "${userSearchTerm}")`;
                if (existingMemberIds.length > 0) { const existingMemberFilters = existingMemberIds.map(id => `id != "${id}"`).join(" && "); if (existingMemberFilters) filterQuery = `(${filterQuery}) && (${existingMemberFilters})`; }
                const usersResult = await pb.collection("danusin_users").getList<UserDataForMember>(1, 10, { filter: filterQuery });
                if(isMountedRef.current) setSearchableUsers(usersResult.items);
            } catch (error) { if(isMountedRef.current) { console.error("Error fetching users for invite:", error); setSearchableUsers([]); toast({ title: "Error", description: "Gagal mencari pengguna.", variant: "destructive" }); }
            } finally { if(isMountedRef.current) setLoadingSearchableUsers(false); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [userSearchTerm, isUserComboboxOpen, members, currentUser?.id]);

    const handleInviteMember = async () => {
        if (!selectedInvitedUserId) { toast({ title: "Error", description: "Silakan pilih pengguna yang akan diundang.", variant: "destructive" }); return; }
        if (!currentUser) { toast({ title: "Error", description: "Anda harus login untuk mengundang.", variant: "destructive" }); return; }
        setIsInviting(true);
        try {
            try { await pb.collection("danusin_user_organization_roles").getFirstListItem(`user="${selectedInvitedUserId}" && organization="${organizationId}"`); toast({ title: "Info", description: "Pengguna ini sudah menjadi anggota organisasi.", variant: "default" }); setIsInviting(false); return; }
            catch (error: any) { if (!(error instanceof ClientResponseError && error.status === 404)) throw error; }
            try { await pb.collection("danusin_session_invitation").getFirstListItem(`danuser_invited="${selectedInvitedUserId}" && organization_id="${organizationId}" && status="waiting"`); toast({ title: "Info", description: "Pengguna ini sudah memiliki undangan yang tertunda untuk organisasi ini.", variant: "default" }); setIsInviting(false); return; }
            catch (error: any) { if (!(error instanceof ClientResponseError && error.status === 404)) throw error; }
            await pb.collection("danusin_session_invitation").create({
                danuser_invite: currentUser.id, organization_id: organizationId,
                danuser_invited: selectedInvitedUserId, status: "waiting", role: inviteRole,
            });
            toast({ title: "Success", description: `Undangan telah dikirim sebagai ${inviteRole} kepada ${selectedInvitedUserDisplayName === "Pilih Pengguna..." ? "pengguna terpilih" : selectedInvitedUserDisplayName}.` });
            setSelectedInvitedUserId(null); setUserSearchTerm(""); setSearchableUsers([]); setInviteRole("member"); setIsInviteDialogOpen(false); setSelectedInvitedUserDisplayName("Pilih Pengguna...");
        } catch (error) { console.error("Error inviting member:", error); toast({ title: "Error", description: "Gagal mengirim undangan.", variant: "destructive" });
        } finally { setIsInviting(false); }
    };

    const handleUpdateRole = async (memberRoleId: string, newRole: OrganizationRoleType) => {
        const memberToUpdate = members.find(m => m.id === memberRoleId);
        if (!memberToUpdate) { toast({ title: "Error", description: "Anggota tidak ditemukan.", variant: "destructive"}); return; }
        if (userRole !== 'admin' && !(userRole === 'moderator' && newRole === 'member' && memberToUpdate.role !== 'admin')) { toast({ title: "Akses Ditolak", description: "Anda tidak memiliki izin untuk mengubah peran ini.", variant: "destructive" }); return; }
        const adminCount = members.filter(m => m.role === 'admin').length;
        if (memberToUpdate.user.id === currentUser?.id && memberToUpdate.role === 'admin' && newRole !== 'admin' && adminCount <=1 ) { toast({ title: "Aksi Ditolak", description: "Tidak dapat mengubah peran admin terakhir.", variant: "destructive" }); return; }
        if (memberToUpdate.role === 'admin' && newRole !== 'admin' && adminCount <= 1) { toast({ title: "Aksi Ditolak", description: "Tidak dapat mengubah peran admin terakhir.", variant: "destructive" }); return;}


        try {
            await pb.collection("danusin_user_organization_roles").update(memberRoleId, { role: newRole });
            setMembers(prevMembers => {
                const updatedMembers = prevMembers.map(m => m.id === memberRoleId ? { ...m, role: newRole } : m);
                updatedMembers.sort((a, b) => { const roleOrder: Record<string, number> = { admin: 0, moderator: 1, member: 2 }; const orderA = roleOrder[a.role] ?? 99; const orderB = roleOrder[b.role] ?? 99; if (orderA !== orderB) { return orderA - orderB; } return new Date(a.created).getTime() - new Date(b.created).getTime(); });
                return updatedMembers;
            });
            toast({ title: "Sukses", description: `Peran untuk ${memberToUpdate.user.name || memberToUpdate.user.username} telah diubah menjadi ${newRole}.` });
        } catch (error) { console.error("Error updating role:", error); toast({ title: "Error", description: "Gagal memperbarui peran anggota.", variant: "destructive" }); }
    };

    const handleRemoveMember = async (memberRoleId: string) => {
        const memberToRemove = members.find(m => m.id === memberRoleId);
        if (!memberToRemove) { toast({ title: "Error", description: "Anggota tidak ditemukan.", variant: "destructive"}); return; }
        if (userRole !== 'admin' && !(userRole === 'moderator' && memberToRemove.role === 'member')) { toast({ title: "Akses Ditolak", description: "Anda tidak memiliki izin untuk mengeluarkan anggota ini.", variant: "destructive" }); return; }
        const adminCount = members.filter(m => m.role === 'admin').length;
        if (memberToRemove.role === 'admin' && adminCount <= 1) { toast({ title: "Aksi Ditolak", description: "Tidak dapat mengeluarkan admin terakhir dari organisasi.", variant: "destructive" }); return; }
        if (memberToRemove.user.id === currentUser?.id) { toast({ title: "Aksi Ditolak", description: "Anda tidak dapat mengeluarkan diri sendiri.", variant: "destructive" }); return; }

        if (!window.confirm(`Apakah Anda yakin ingin mengeluarkan ${memberToRemove.user.name || memberToRemove.user.username} dari organisasi ini?`)) { return; }
        try {
            await pb.collection("danusin_user_organization_roles").delete(memberRoleId);
            setMembers(prevMembers => prevMembers.filter(m => m.id !== memberRoleId));
            toast({ title: "Sukses", description: `${memberToRemove.user.name || memberToRemove.user.username} telah dikeluarkan dari organisasi.` });
        } catch (error) { console.error("Error removing member:", error); toast({ title: "Error", description: "Gagal mengeluarkan anggota.", variant: "destructive" }); }
    };

    if (loading) { return <div className="space-y-3">{[...Array(3)].map((_, i) => ( <MemberListSkeleton key={i} /> ))}</div>; }

    return (
        <div className="space-y-6">
            {/*
              Conditionally render the invite button based on the canInviteMembers prop.
              Previously, it was `isAdmin`. If `canInviteMembers` is directly passed from the parent
              (page.tsx) based on `userRole === "admin"`, then using `canInviteMembers` here is correct.
            */}
            {canInviteMembers && (
                <div className="flex justify-end">
                    <InviteMemberDialog
                        isOpen={isInviteDialogOpen}
                        onOpenChange={setIsInviteDialogOpen}
                        selectedInvitedUserId={selectedInvitedUserId}
                        onSelectInvitedUser={(userId, userNameToDisplay) => { setSelectedInvitedUserId(userId); setSelectedInvitedUserDisplayName(userNameToDisplay || (userId ? "Pengguna Terpilih" : "Pilih Pengguna...")); }}
                        userSearchTerm={userSearchTerm}
                        onUserSearchTermChange={setUserSearchTerm}
                        searchableUsers={searchableUsers}
                        loadingSearchableUsers={loadingSearchableUsers}
                        isUserComboboxOpen={isUserComboboxOpen}
                        onUserComboboxOpenChange={setIsUserComboboxOpen}
                        currentMembers={members}
                        inviteRole={inviteRole}
                        onInviteRoleChange={(role) => setInviteRole(role as OrganizationRoleType)}
                        onInviteMember={handleInviteMember}
                        isInviting={isInviting}
                    />
                </div>
            )}
            {members.length === 0 ? (
                <MemberListEmptyState
                  title="No Members Yet"
                  description={`This organization is looking for its first members! ${canInviteMembers ? "Why not invite someone to collaborate?" : ""}`}
                  showButton={!!canInviteMembers && !isInviteDialogOpen} // Ensure canInviteMembers is boolean for showButton
                  onInviteClick={() => setIsInviteDialogOpen(true)}
                  icon={UsersIconList}
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
    )
}