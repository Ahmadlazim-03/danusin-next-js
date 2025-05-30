"use client";

import React, { useEffect, useRef, useState, useCallback, JSX } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogClose, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import {
    UserPlus, Users as UsersIconList, ChevronsUpDown, Check, Building2,
    MapPin, Phone, MoreHorizontal, Edit3, Trash2, ShieldQuestion
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ClientResponseError, RecordModel } from "pocketbase";
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";

// --- Definisi Tipe ---
type OrganizationInfoForMember = { id: string; name: string; organization_slug?: string; };
type UserDataForMember = RecordModel & { name?: string; email?: string; avatar?: string; username?: string; bio?: string; location_address?: string; phone?: string; otherOrganizations?: OrganizationInfoForMember[] | null; };
type OrganizationRoleType = "admin" | "moderator" | "member";
// Pastikan OrganizationRoleRecord memiliki 'created' dan 'updated' jika Anda mengaksesnya dari item
type OrganizationRoleRecord = RecordModel & { user: string; organization: string; role: OrganizationRoleType; expand?: { user?: UserDataForMember; }; created: string; updated: string; };
type MemberDisplayItem = {
    id: string; // Ini adalah ID dari record danusin_user_organization_roles
    user: UserDataForMember;
    role: OrganizationRoleType;
    created: string; // Ini adalah tanggal user ditambahkan ke organisasi (dari danusin_user_organization_roles.created)
};

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
        <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card">
            <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 w-full space-y-2 mt-1 sm:mt-0">
                <div className="flex flex-col xs:flex-row xs:justify-between items-start gap-1 xs:gap-2">
                    <Skeleton className="h-5 w-3/5 sm:h-6" />
                    <Skeleton className="h-5 w-1/4 sm:h-5 sm:w-1/5" />
                </div>
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
        </div>
    );
}

// --- Komponen Tampilan Kosong Lokal ---
function MemberListEmptyState({ title, description, showButton, icon: Icon, onInviteClick }: MemberListEmptyStateProps): JSX.Element {
    return (
        <div className="text-center py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-br from-card to-muted/30 dark:from-card dark:to-zinc-800/40 rounded-xl border-2 border-dashed border-muted-foreground/20 shadow-lg">
            <div className="mb-5 sm:mb-6 inline-flex items-center justify-center p-5 sm:p-6 rounded-full bg-gradient-to-tr from-emerald-500 to-green-500 text-white shadow-xl">
                <Icon className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-2 text-xl sm:text-2xl font-semibold text-foreground">{title}</h3>
            <p className="mb-6 sm:mb-8 max-w-xs sm:max-w-sm text-sm sm:text-base text-muted-foreground mx-auto">{description}</p>
            {showButton && onInviteClick && (
                <Button onClick={onInviteClick} size="lg" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-95 transition-all shadow-md hover:shadow-lg transform hover:scale-105 rounded-lg px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base" >
                    <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Invite Member
                </Button>
            )}
        </div>
    );
}

// --- Komponen Inline untuk Item Anggota dengan HoverCard & Aksi (DIPERBARUI) ---
function OrganizationMemberItem({ member, loggedInUserRole, currentUserId, onUpdateRole, onRemoveMember }: OrganizationMemberItemProps): JSX.Element {
    const user = member.user; // user adalah UserDataForMember
    // Pastikan user.id ada sebelum digunakan, terutama jika UserDataForMember bisa parsial
    const isSelf = user && user.id === currentUserId;

    const memberAvatarUrl = user?.avatar && user.collectionId && user.id
        ? pb.getFileUrl(user, user.avatar, { thumb: '100x100' })
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.username || 'U').charAt(0)}&background=random&size=100&font-size=0.5&bold=true`;

    const getRoleBadgeVariant = (role: OrganizationRoleType) => {
        switch (role) {
            case 'admin': return 'destructive';
            case 'moderator': return 'secondary';
            default: return 'outline';
        }
    };

    // PERBAIKAN TAMPILAN TANGGAL
    const joinDateString = member.created; // Ini adalah 'created' dari danusin_user_organization_roles
    let displayDate = 'Tanggal gabung tidak tersedia';
    if (joinDateString) {
        const dateObj = new Date(joinDateString);
        if (!isNaN(dateObj.getTime())) { // Cek apakah tanggal valid
            displayDate = dateObj.toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
        } else {
            displayDate = 'Format tanggal salah';
        }
    }

    const showActions = !isSelf && user && ( // Pastikan user ada
        loggedInUserRole === 'admin' ||
        (loggedInUserRole === 'moderator' && member.role === 'member')
    );

    if (!user || !user.id) { // Fallback jika data user tidak lengkap
        return <div className="p-4 text-muted-foreground">Data anggota tidak lengkap.</div>;
    }

    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                {/* PERUBAHAN RESPONSIVITAS ITEM ANGGOTA */}
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/50 dark:hover:bg-zinc-700/30 transition-colors cursor-pointer rounded-lg">
                    <Image
                        src={memberAvatarUrl}
                        alt={user.name || user.username || 'Avatar'}
                        width={48} // Ukuran dasar untuk mobile
                        height={48}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border flex-shrink-0"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U').charAt(0)}&background=random&size=100&font-size=0.5&bold=true`;
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:justify-between items-start gap-0.5 xs:gap-2 mb-0.5 xs:mb-0">
                            {/* Nama dan Indikator (You) */}
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-semibold text-foreground truncate" title={user.name || user.username}>
                                    {user.name || user.username || "Nama Tidak Ada"}
                                </h3>
                                {isSelf && (
                                    <Badge variant="outline" className="text-[9px] xs:text-[10px] px-1.5 py-0.5 border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700 flex-shrink-0 leading-tight">
                                        You
                                    </Badge>
                                )}
                            </div>
                            {/* Badge Peran dan Dropdown Aksi */}
                            <div className="flex items-center gap-1 xs:gap-2 mt-0.5 xs:mt-0">
                                <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize text-[10px] xs:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0 leading-tight">
                                    {member.role}
                                </Badge>
                                {showActions && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 xs:h-7 xs:w-7 data-[state=open]:bg-muted flex-shrink-0">
                                                <MoreHorizontal className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                                <span className="sr-only">Aksi untuk {user.name}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Kelola Anggota</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger disabled={loggedInUserRole !== 'admin'}>
                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                    <span>Ubah Peran</span>
                                                </DropdownMenuSubTrigger>
                                                {loggedInUserRole === 'admin' && ( // Hanya admin yang bisa melihat sub-menu ubah peran
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
                                            <DropdownMenuItem
                                                className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/50 dark:focus:text-red-400"
                                                onClick={() => onRemoveMember(member.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Keluarkan</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                        {user.email && <p className="text-xs sm:text-sm text-muted-foreground break-all truncate">{user.email}</p>}
                       <p className="text-xs text-muted-foreground mt-1">Bergabung: {user.created ? new Date(user.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal tidak tersedia'}</p>
                    </div>
                </div>
            </HoverCardTrigger>
            <HoverCardContent
                className="w-auto max-w-[calc(100vw-2rem)] xs:max-w-xs sm:w-80 bg-card border-border shadow-xl rounded-xl p-0 overflow-hidden z-50"
                side="top"  // <-- PERUBAHAN DI SINI: dari "right" menjadi "top"
                align="center"
                sideOffset={10}
                collisionPadding={16} // Menjaga padding agar tidak terpotong viewport
            >
                <div className="max-h-[70vh] sm:max-h-[450px] overflow-y-auto p-4 sm:p-5">
                    <div className="flex flex-col space-y-3 sm:space-y-4">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <Image src={memberAvatarUrl} alt={user.name || 'Avatar'} width={48} height={48} className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-emerald-500 object-cover" onError={(e) => {const target = e.target as HTMLImageElement; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U').charAt(0)}&background=random&size=100&font-size=0.5&bold=true`;}} />
                            <div className="min-w-0">
                                <h4 className="text-base sm:text-lg font-semibold text-foreground truncate">{user.name || user.username}</h4>
                                {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                                {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                            </div>
                        </div>
                        {user.bio && ( <div className="border-t border-border pt-3 sm:pt-4"> <h5 className="text-xs sm:text-sm font-medium text-foreground mb-1">BIO</h5> <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-4">{user.bio}</p> </div> )}
                        {(user.location_address || user.phone) && ( <div className="border-t border-border pt-3 sm:pt-4"> <h5 className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">KONTAK</h5> <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground"> {user.location_address && ( <div className="flex items-start"> <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 mt-0.5 text-emerald-500 flex-shrink-0" /> <span>{user.location_address}</span> </div> )} {user.phone && ( <div className="flex items-center"> <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 text-emerald-500 flex-shrink-0" /> <span>{user.phone}</span> </div> )} </div> </div> )}
                        {user.otherOrganizations && user.otherOrganizations.length > 0 && ( <div className="border-t border-border pt-3 sm:pt-4"> <h5 className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">JUGA ANGGOTA DARI</h5> <div className="space-y-1 sm:space-y-1.5"> {user.otherOrganizations.slice(0,3).map(org => ( <Link key={org.id} href={`/dashboard/organization/view/${org.organization_slug || org.id}`} className="flex items-center group text-xs sm:text-sm" > <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 text-muted-foreground group-hover:text-emerald-500 transition-colors flex-shrink-0" /> <span className="text-muted-foreground group-hover:text-primary group-hover:underline transition-colors truncate">{org.name}</span> </Link> ))} </div> </div> )}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

// --- Komponen InviteMemberDialog (Tidak ada perubahan signifikan, hanya pastikan props sesuai) ---
function InviteMemberDialog({
    isOpen, onOpenChange, selectedInvitedUserId, onSelectInvitedUser,
    userSearchTerm, onUserSearchTermChange, searchableUsers, loadingSearchableUsers,
    isUserComboboxOpen, onUserComboboxOpenChange, currentMembers,
    inviteRole, onInviteRoleChange, onInviteMember, isInviting,
}: InviteMemberDialogProps): JSX.Element {
    const getSelectedUserName = () => {
        if (!selectedInvitedUserId) return "Pilih Pengguna...";
        // Coba cari di searchableUsers dulu, lalu fallback ke currentMembers jika perlu (misalnya jika user sudah dipilih sebelumnya)
        let selectedUser = searchableUsers.find(u => u.id === selectedInvitedUserId);
        if (!selectedUser) {
            const member = currentMembers.find(m => m.user.id === selectedInvitedUserId);
            if (member) selectedUser = member.user;
        }
        return selectedUser?.name || selectedUser?.username || (selectedInvitedUserId ? "Pengguna Terpilih" : "Pilih Pengguna...");
    };
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) {onUserComboboxOpenChange(false); onUserSearchTermChange(""); onSelectInvitedUser(null, "Pilih Pengguna...");} }}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:opacity-95 transition-all shadow-md hover:shadow-lg transform hover:scale-105 rounded-lg px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm">
                    <UserPlus className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" /> Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card rounded-lg shadow-xl">
                <DialogHeader> <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">Invite New Member</DialogTitle> <DialogDescription className="text-xs sm:text-sm text-muted-foreground"> Cari dan pilih pengguna lalu tentukan perannya untuk diundang. </DialogDescription> </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-1.5 sm:space-y-2"> <Label htmlFor="user-combobox" className="text-xs sm:text-sm font-medium">Nama Pengguna</Label>
                        <Popover open={isUserComboboxOpen} onOpenChange={onUserComboboxOpenChange}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={isUserComboboxOpen} className="w-full justify-between h-9 sm:h-10 rounded-md border-border focus:ring-emerald-500 focus:border-emerald-500 text-xs sm:text-sm" id="user-combobox" >
                                    <span className="truncate">{getSelectedUserName()}</span> <ChevronsUpDown className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput placeholder="Cari nama atau username..." value={userSearchTerm} onValueChange={onUserSearchTermChange} className="text-xs sm:text-sm" />
                                    <CommandEmpty className="text-xs sm:text-sm p-2"> {loadingSearchableUsers ? "Mencari..." : (userSearchTerm.trim().length < 1 ? "Ketik untuk mencari" : "Pengguna tidak ditemukan.")} </CommandEmpty>
                                    <CommandGroup> <CommandList>
                                        {searchableUsers.map((user) => {
                                            let avatarDisplayUrl = null; if(user.avatar && user.id && user.collectionId) { avatarDisplayUrl = pb.getFileUrl(user, user.avatar, { thumb: '50x50' }); }
                                            return ( <CommandItem key={user.id} value={`${user.name || ""}-${user.username || ""}-${user.id}`} onSelect={() => { onSelectInvitedUser(user.id, user.name || user.username); onUserComboboxOpenChange(false); }} className="flex items-center gap-2 cursor-pointer" >
                                                <Check className={cn("mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4", selectedInvitedUserId === user.id ? "opacity-100" : "opacity-0")} />
                                                <Avatar className="h-5 w-5 sm:h-6 sm:w-6"> {avatarDisplayUrl && <AvatarImage src={avatarDisplayUrl} alt={user.name || user.username} />} <AvatarFallback className="text-[10px] sm:text-xs">{(user.name || user.username || "U").substring(0,2).toUpperCase()}</AvatarFallback> </Avatar>
                                                <div className="flex flex-col"> <span className="text-xs sm:text-sm truncate">{user.name || user.username}</span> {user.name && user.username && <span className="text-[10px] sm:text-xs text-muted-foreground truncate">@{user.username}</span>} </div>
                                            </CommandItem> )})}
                                    </CommandList> </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2"> <Label htmlFor="role-invite-dialog" className="text-xs sm:text-sm font-medium">Role</Label>
                        <Select value={inviteRole} onValueChange={(value) => onInviteRoleChange(value as OrganizationRoleType)}>
                            <SelectTrigger id="role-invite-dialog" className="h-9 sm:h-10 rounded-md border-border focus:ring-emerald-500 focus:border-emerald-500 text-xs sm:text-sm"> <SelectValue placeholder="Select a role" /> </SelectTrigger>
                            <SelectContent className="rounded-md shadow-lg text-xs sm:text-sm"> <SelectItem value="moderator">Moderator</SelectItem> <SelectItem value="member">Member</SelectItem> </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex flex-col-reverse xs:flex-row xs:justify-end gap-2 pt-2">
                    <DialogClose asChild><Button variant="outline" className="rounded-md w-full xs:w-auto text-xs sm:text-sm" onClick={() => { onOpenChange(false); onUserComboboxOpenChange(false); onUserSearchTermChange(""); onSelectInvitedUser(null,"Pilih Pengguna...");}}>Cancel</Button></DialogClose>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md w-full xs:w-auto text-xs sm:text-sm" onClick={onInviteMember} disabled={isInviting || !selectedInvitedUserId}> {isInviting ? "Mengirim..." : "Kirim Undangan"} </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Komponen Utama ---
// Diasumsikan ini adalah komponen yang sudah ada dari file Anda, saya hanya menyalin strukturnya.
// Pastikan props `organizationId` dan `userRole` diteruskan dengan benar ke komponen ini.
export function OrganizationMembersList({
    organizationId,
    userRole, // Peran pengguna yang sedang login DI DALAM organisasi ini
}: { organizationId: string; userRole: string | null }) {
    const [members, setMembers] = useState<MemberDisplayItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteRole, setInviteRole] = useState<OrganizationRoleType>("member");
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const isMountedRef = useRef(true);
    const { user: currentUser } = useAuth(); // Pengguna yang sedang login secara global
    const isAdmin = userRole === "admin"; // Apakah pengguna yang login adalah admin DARI ORGANISASI INI

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
            return results.map(item => item.expand?.organization).filter((org): org is RecordModel & { id: string; organization_name: string; organization_slug?: string } => !!org).map(org => ({ id: org.id, name: org.organization_name || "Nama Organisasi Tidak Ada", organization_slug: org.organization_slug, }));
        } catch (error: any) { if (!isCancellationError(error)) { console.warn(`Gagal mengambil organisasi lain untuk pengguna ${userIdToFetch}:`, error); } return []; }
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

                if (result.items.length === 0) {
                    if(isMountedRef.current) setMembers([]);
                } else {
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
                        } else {
                            // Fallback jika expand user gagal atau user tidak lengkap
                            finalUserData = {
                                id: item.user,
                                name: "Data Pengguna Error",
                                username: "N/A",
                                email: "N/A",
                                avatar: "",
                                collectionId: '', // Perlu diisi jika ingin getFileUrl bekerja
                                collectionName: '', // Perlu diisi
                                created: item.created || '', // Dari role record
                                updated: item.updated || '', // Dari role record
                            };
                        }
                        // 'id' untuk MemberDisplayItem adalah ID dari record peran (danusin_user_organization_roles)
                        // 'created' untuk MemberDisplayItem adalah tanggal user join organisasi (dari danusin_user_organization_roles.created)
                        return { id: item.id, user: finalUserData, role: item.role, created: item.created };
                    });
                    const membersData = await Promise.all(memberPromises);
                     if (isMountedRef.current && !controller.signal.aborted) {
                        membersData.sort((a, b) => {
                            const roleOrder: Record<string, number> = { admin: 0, moderator: 1, member: 2 };
                            const orderA = roleOrder[a.role] ?? 99;
                            const orderB = roleOrder[b.role] ?? 99;
                            if (orderA !== orderB) { return orderA - orderB; }
                            // Pastikan created adalah string tanggal yang valid sebelum membuat Date object
                            const timeA = a.created ? new Date(a.created).getTime() : 0;
                            const timeB = b.created ? new Date(b.created).getTime() : 0;
                            return timeA - timeB;
                        });
                        setMembers(membersData);
                    }
                }
            } catch (error: any) {
                if (!isCancellationError(error)) {
                    if (isMountedRef.current) {
                        console.error("Error fetching members:", error);
                        toast({ title: "Error Memuat Anggota", description: `Gagal memuat daftar anggota.`, variant: "destructive" });
                        setMembers([]);
                    }
                }
            }
            finally { if (isMountedRef.current && !controller.signal.aborted) { setLoading(false); } }
        };
        fetchMembers();
        return () => { isMountedRef.current = false; controller.abort(); };
    }, [organizationId, fetchOtherOrgs]); // Hanya organizationId dan fetchOtherOrgs

    useEffect(() => {
        if (!isUserComboboxOpen || userSearchTerm.trim().length < 1) { setSearchableUsers([]); if (userSearchTerm.trim().length === 0) setLoadingSearchableUsers(false); return; }
        setLoadingSearchableUsers(true);
        const delayDebounceFn = setTimeout(async () => {
            if (!isMountedRef.current) return;
            try {
                const existingMemberIds = members.map(m => m.user.id);
                if(currentUser?.id && !existingMemberIds.includes(currentUser.id) ) { // Jangan tambahkan jika sudah ada (meski seharusnya tidak)
                    existingMemberIds.push(currentUser.id);
                }

                let filterQuery = `(name ~ "${userSearchTerm.replace(/"/g, '""')}" || username ~ "${userSearchTerm.replace(/"/g, '""')}")`;
                if (existingMemberIds.length > 0) {
                    const existingMemberFilters = existingMemberIds.map(id => `id != "${id}"`).join(" && ");
                    if (existingMemberFilters) filterQuery = `(${filterQuery}) && (${existingMemberFilters})`;
                }
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
            try { await pb.collection("danusin_user_organization_roles").getFirstListItem(`user="${selectedInvitedUserId}" && organization="${organizationId}"`); toast({ title: "Info", description: `${selectedInvitedUserDisplayName} sudah menjadi anggota organisasi ini.`, variant: "default" }); setIsInviting(false); return; }
            catch (error: any) { if (!(error instanceof ClientResponseError && error.status === 404)) {console.error(error); throw error;} }

            try { await pb.collection("danusin_session_invitation").getFirstListItem(`danuser_invited="${selectedInvitedUserId}" && organization_id="${organizationId}" && status="waiting"`); toast({ title: "Info", description: `${selectedInvitedUserDisplayName} sudah memiliki undangan yang tertunda untuk organisasi ini.`, variant: "default" }); setIsInviting(false); return; }
            catch (error: any) { if (!(error instanceof ClientResponseError && error.status === 404)) {console.error(error); throw error;} }

            await pb.collection("danusin_session_invitation").create({
                danuser_invite: currentUser.id, organization_id: organizationId,
                danuser_invited: selectedInvitedUserId, status: "waiting", role: inviteRole,
            });
            toast({ title: "Sukses", description: `Undangan telah dikirim sebagai ${inviteRole} kepada ${selectedInvitedUserDisplayName}.` });
            setSelectedInvitedUserId(null); setUserSearchTerm(""); setSearchableUsers([]); setInviteRole("member"); setIsInviteDialogOpen(false); setSelectedInvitedUserDisplayName("Pilih Pengguna...");
        } catch (error) { console.error("Error inviting member:", error); toast({ title: "Error", description: "Gagal mengirim undangan.", variant: "destructive" });
        } finally { setIsInviting(false); }
    };

    const handleUpdateRole = async (memberRoleId: string, newRole: OrganizationRoleType) => {
        const memberToUpdate = members.find(m => m.id === memberRoleId);
        if (!memberToUpdate) { toast({ title: "Error", description: "Anggota tidak ditemukan.", variant: "destructive"}); return; }

        // Logika perizinan yang lebih ketat
        if (userRole !== 'admin') { // Hanya admin yang bisa ubah peran siapa pun
             toast({ title: "Akses Ditolak", description: "Hanya admin organisasi yang dapat mengubah peran.", variant: "destructive" }); return;
        }
        // Admin tidak bisa mengubah perannya sendiri menjadi lebih rendah jika dia satu-satunya admin
        const adminCount = members.filter(m => m.role === 'admin').length;
        if (memberToUpdate.user.id === currentUser?.id && memberToUpdate.role === 'admin' && newRole !== 'admin' && adminCount <=1 ) {
            toast({ title: "Aksi Ditolak", description: "Tidak dapat mengubah peran diri sendiri jika Anda adalah admin terakhir.", variant: "destructive" }); return;
        }
        // Admin tidak bisa mengubah peran admin lain menjadi lebih rendah jika hanya ada satu admin tersisa (yaitu admin yang diubah)
         if (memberToUpdate.role === 'admin' && newRole !== 'admin' && adminCount <= 1 && memberToUpdate.user.id !== currentUser?.id) {
            toast({ title: "Aksi Ditolak", description: "Organisasi harus memiliki setidaknya satu admin.", variant: "destructive" }); return;
        }


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

        // Logika perizinan yang lebih ketat
        if (userRole !== 'admin' && !(userRole === 'moderator' && memberToRemove.role === 'member')) {
            toast({ title: "Akses Ditolak", description: "Anda tidak memiliki izin untuk mengeluarkan anggota ini.", variant: "destructive" }); return;
        }
        const adminCount = members.filter(m => m.role === 'admin').length;
        if (memberToRemove.role === 'admin' && adminCount <= 1) {
            toast({ title: "Aksi Ditolak", description: "Tidak dapat mengeluarkan admin terakhir dari organisasi.", variant: "destructive" }); return;
        }
        // Pengguna tidak bisa mengeluarkan diri sendiri dengan tombol ini (mereka harus punya tombol "Keluar Organisasi" sendiri jika bukan kreator)
        if (memberToRemove.user.id === currentUser?.id) {
            toast({ title: "Info", description: "Untuk keluar dari organisasi, gunakan opsi 'Keluar Organisasi' di halaman daftar organisasi Anda.", variant: "default" }); return;
        }

        if (!window.confirm(`Apakah Anda yakin ingin mengeluarkan ${memberToRemove.user.name || memberToRemove.user.username} dari organisasi ini?`)) { return; }
        try {
            await pb.collection("danusin_user_organization_roles").delete(memberRoleId);
            setMembers(prevMembers => prevMembers.filter(m => m.id !== memberRoleId));
            toast({ title: "Sukses", description: `${memberToRemove.user.name || memberToRemove.user.username} telah dikeluarkan dari organisasi.` });
        } catch (error) { console.error("Error removing member:", error); toast({ title: "Error", description: "Gagal mengeluarkan anggota.", variant: "destructive" }); }
    };

    if (loading) { return <div className="space-y-3">{[...Array(3)].map((_, i) => ( <MemberListSkeleton key={i} /> ))}</div>; }

    return (
        <div className="space-y-4 sm:space-y-6"> {/* Mengurangi space-y utama */}
            { (userRole === 'admin' || userRole === 'moderator') && ( // Tombol invite hanya untuk admin & moderator
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
                    title="Belum Ada Anggota"
                    description={`Organisasi ini belum memiliki anggota. ${(userRole === 'admin' || userRole === 'moderator') ? "Undang seseorang untuk berkolaborasi!" : ""}`}
                    showButton={(userRole === 'admin' || userRole === 'moderator') && !isInviteDialogOpen}
                    onInviteClick={() => setIsInviteDialogOpen(true)}
                    icon={UsersIconList}
                />
            ) : (
                <div className="bg-card shadow-sm sm:shadow-md rounded-lg sm:rounded-xl border border-border divide-y divide-border dark:divide-zinc-700/80">
                    {members.map((memberItem) => (
                        <OrganizationMemberItem
                            key={memberItem.id}
                            member={memberItem}
                            loggedInUserRole={userRole} // Peran pengguna yang login DI ORGANISASI INI
                            currentUserId={currentUser?.id} // ID pengguna yang login secara global
                            onUpdateRole={handleUpdateRole}
                            onRemoveMember={handleRemoveMember}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}