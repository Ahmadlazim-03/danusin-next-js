"use client";

import React, { useEffect, useState, useCallback, useRef, JSX } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Building2, UserCircle, Link2 as WhatsAppIcon,
    Package, Info, ExternalLink as ViewProductIcon, Users,
    Heart as HeartIcon, ExternalLink, User, Loader2,
    Mail, Phone, MapPin
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { ClientResponseError, RecordModel } from 'pocketbase';
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/auth-provider";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

// --- TIPE DATA ---
interface UserDataExpanded extends RecordModel { name?: string; username?: string; avatar?: string; }
interface OrganizationViewData extends RecordModel { organization_name: string; organization_description: string; organization_slug: string; organization_image?: string; target?: number; target_progress?: number; group_phone?: string; created_by: string; expand?: { created_by?: UserDataExpanded; }; }
interface ExpandedOrg { id: string; organization_name: string; organization_slug: string; }
interface ExpandedUser { id: string; name: string; username?: string; } // Username bisa opsional
interface ExpandedCatalog { id: string; name: string; }
interface ProductListItemData extends RecordModel { product_name: string; slug: string; price: number; discount?: number; product_image: string[]; by_organization?: string; added_by?: string; catalog?: string[]; expand?: { by_organization?: ExpandedOrg; added_by?: ExpandedUser; catalog?: ExpandedCatalog[]; }; }
type OrganizationInfoForMemberList = { id: string; name: string; organization_slug?: string; };
type UserDataForMemberList = RecordModel & { name?: string; email?: string; avatar?: string; username?: string; bio?: string; location_address?: string; phone?: string; otherOrganizations?: OrganizationInfoForMemberList[] | null; };
type RoleType = 'admin' | 'moderator' | 'member';
type OrganizationRole = RecordModel & { user: string | UserDataForMemberList; organization: string; role: RoleType; expand?: { user?: UserDataForMemberList; organization?: RecordModel & { id: string; organization_name: string; organization_slug?: string; }; }; };
type Member = { id: string; user: UserDataForMemberList; role: RoleType; created: string; };
type FavoriteRecord = RecordModel & { danusers_id: string; products_id: string[]; };
interface NewProductCardProps { product: ProductListItemData; currentUser: any | null; favoriteIds: Set<string>; favoriteRecordId: string | null; updateLocalFavorites: (productId: string, action: 'add' | 'remove') => void; refreshFavorites: () => Promise<void>; }
interface OrganizationMemberItemProps { member: Member; }


// --- Komponen Skeleton ---
function ViewOrganizationSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6"> <Skeleton className="h-9 w-9 rounded-md" /> <Skeleton className="h-8 w-64" /> </div>
            <div className="w-full mb-4"> <div className="grid w-full grid-cols-3 gap-1.5 bg-neutral-100/90 dark:bg-zinc-800/70 p-1.5 border border-neutral-200/90 dark:border-zinc-700/50 rounded-lg"> {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-9 sm:h-10 rounded-[0.3rem] w-full" /> ))} </div> </div>
            <Card> <CardHeader> <Skeleton className="h-7 w-1/2 mb-2" /> <Skeleton className="h-64 w-full rounded-lg bg-muted" /> </CardHeader> <CardContent className="space-y-6 pt-6"> <div> <Skeleton className="h-5 w-1/4 mb-2" /> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-full mt-1" /> <Skeleton className="h-4 w-5/6 mt-1" /> </div> <div className="pt-2"> <Skeleton className="h-5 w-1/3 mb-2" /> <Skeleton className="h-3 w-full mb-1" /> <Skeleton className="h-4 w-1/2 ml-auto" /> </div> <div> <Skeleton className="h-5 w-1/4 mb-2" /> <Skeleton className="h-10 w-40" /> </div> <div> <Skeleton className="h-5 w-1/4 mb-2" /> <div className="flex items-center gap-2"> <Skeleton className="h-8 w-8 rounded-full" /> <Skeleton className="h-4 w-32" /> </div> </div> <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t"> <Skeleton className="h-3 w-1/3"/> <Skeleton className="h-3 w-1/2"/> <Skeleton className="h-3 w-1/2"/> </div> </CardContent> </Card>
        </div>
    );
}

// --- KOMPONEN KARTU PRODUK BARU ---
function NewProductCard({ product, currentUser, favoriteIds, favoriteRecordId, updateLocalFavorites, refreshFavorites }: NewProductCardProps): JSX.Element {
    const { toast } = useToast();
    const [loadingFavorite, setLoadingFavorite] = useState(false);
    const isFavorited = favoriteIds.has(product.id);
    const imageUrl = product.product_image && product.product_image.length > 0 && product.collectionId ? pb.getFileUrl(product, product.product_image[0], { thumb: '500x300' }) : "/placeholder.svg?height=300&width=500&text=" + encodeURIComponent(product.product_name.substring(0, 2).toUpperCase());
    const displayPrice = product.discount && product.discount > 0 ? ( <><span className="line-through text-neutral-500 dark:text-zinc-500 font-normal text-[11px] sm:text-xs">Rp{product.price.toLocaleString('id-ID')}</span><span className="text-emerald-600 font-semibold">Rp{product.discount.toLocaleString('id-ID')}</span></> ) : ( <span className="font-semibold">Rp{product.price.toLocaleString('id-ID')}</span> );
    const productLink = `/dashboard/products/${product.id}`;
    const organization = product.expand?.by_organization;
    const addedBy = product.expand?.added_by;
    const catalogs = product.expand?.catalog;

    const handleToggleFavorite = async () => {
        if (!currentUser) { toast({ title: "Harap Login", description: "Anda harus login untuk mengubah favorit.", variant: "destructive" }); return; }
        setLoadingFavorite(true);
        const wasFavorited = isFavorited;
        const currentRecordId = favoriteRecordId;
        try {
            const currentProducts = Array.from(favoriteIds);
            let newProducts: string[] = wasFavorited ? currentProducts.filter(id => id !== product.id) : [...currentProducts, product.id];
            newProducts = [...new Set(newProducts)];
            if (currentRecordId) { await pb.collection('danusin_favorite').update(currentRecordId, { products_id: newProducts }); updateLocalFavorites(product.id, wasFavorited ? 'remove' : 'add'); }
            else { await pb.collection('danusin_favorite').create<FavoriteRecord>({ danusers_id: currentUser.id, products_id: newProducts }); await refreshFavorites(); }
            toast({ title: "Favorit Diperbarui", description: `${product.product_name} ${wasFavorited ? 'dihapus dari' : 'ditambahkan ke'} favorit.` });
        } catch (error: any) {
             console.error("Error toggling favorite:", error);
             let errMsg = "Gagal memperbarui favorit.";
             if (error instanceof ClientResponseError) { errMsg = error.response?.message || errMsg; }
             else if (error instanceof Error) { errMsg = error.message; }
             toast({ title: "Error", description: errMsg, variant: "destructive" });
             await refreshFavorites();
        } finally { setLoadingFavorite(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} className="h-full" >
            <Card className="bg-white dark:bg-zinc-800/70 backdrop-blur-sm border border-neutral-200/80 dark:border-zinc-700/60 overflow-hidden group relative h-full transition-shadow duration-300 hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 flex flex-col">
                <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 dark:group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-lg`} />
                <div className="aspect-video relative overflow-hidden">
                    <Link href={productLink} passHref className="block w-full h-full">
                         <Image src={imageUrl} alt={product.product_name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=300&width=500&text=Error"; }} />
                    </Link>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="flex justify-between items-center pointer-events-auto">
                            <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 text-xs px-3 py-1.5 h-auto rounded-md">
                                <Link href={productLink}><ExternalLink className="h-3 w-3 mr-1.5" /> Lihat Produk</Link>
                            </Button>
                            <Button variant="outline" size="icon" className="bg-white/20 dark:bg-zinc-800/70 border-white/30 dark:border-zinc-700 text-white dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 w-8 h-8 disabled:opacity-50" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(); }} aria-label={isFavorited ? "Hapus dari Wishlist" : "Tambah ke Wishlist"} disabled={loadingFavorite || !currentUser} >
                                {loadingFavorite ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartIcon className={`w-4 h-4 transition-all ${isFavorited ? "fill-rose-500 stroke-rose-500" : "stroke-current group-hover:stroke-rose-400"}`} /> }
                            </Button>
                        </div>
                    </div>
                </div>
                <CardContent className="p-3 sm:p-4 relative z-10 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-1 text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 mb-1">
                        <Link href={productLink}>{product.product_name}</Link>
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
                         {catalogs?.slice(0, 2).map((cat) => ( <Link key={cat.id} href={`/dashboard/catalog/${encodeURIComponent(cat.id)}`} passHref className="no-underline"> <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-normal border-neutral-300 dark:border-zinc-600 text-neutral-600 dark:text-zinc-400 group-hover:border-emerald-500/40 dark:group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-all duration-300 cursor-pointer hover:shadow-sm"> {cat.name} </Badge> </Link> ))}
                    </div>
                    <div className="text-base sm:text-lg text-neutral-900 dark:text-white mb-2"> {displayPrice} </div>
                    <div className="flex-1"></div>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 border-t border-neutral-200 dark:border-zinc-700/60 pt-2 mt-2">
                        <div className="flex items-center gap-1 truncate"> <Building2 className="h-3 w-3 flex-shrink-0" /> <span className="truncate" title={organization?.organization_name || 'N/A'}> {organization?.organization_name || 'N/A'} </span> </div>
                        <div className="flex items-center gap-1 truncate"> <User className="h-3 w-3 flex-shrink-0" /> <span className="truncate" title={addedBy?.name || 'N/A'}> {addedBy?.name || 'N/A'} </span> </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// --- KOMPONEN UNTUK LIST MEMBER ---
function MemberListSkeleton() {
    return ( <div className="flex flex-col sm:flex-row items-start gap-5 p-5 rounded-xl border bg-card"> <Skeleton className="h-11 w-11 rounded-full sm:h-24 sm:w-24 sm:rounded-lg flex-shrink-0" /> <div className="flex-1 w-full mt-2 sm:mt-0 flex flex-col min-h-[96px] sm:min-h-[150px]"> <div className="space-y-3"> <div className="flex justify-between items-center"> <Skeleton className="h-5 w-3/5 sm:h-6" /> <Skeleton className="h-6 w-1/5 sm:h-5 sm:w-1/6" /> </div> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-5/6" /> </div> </div> </div> )
}
interface MemberListEmptyStateProps { title: string; description: string; icon: React.ElementType; }
function MemberListEmptyState({ title, description, icon: Icon }: MemberListEmptyStateProps): JSX.Element {
    return (
        <div className="text-center py-16 px-6 bg-gradient-to-br from-card to-muted/30 dark:from-card dark:to-zinc-800/40 rounded-xl border-2 border-dashed border-muted-foreground/20 shadow-lg">
            <div className="mb-6 inline-flex items-center justify-center p-6 rounded-full bg-gradient-to-tr from-emerald-500 to-green-500 text-white shadow-xl">
                <Icon className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-foreground">{title}</h3>
            <p className="mb-8 max-w-sm text-base text-muted-foreground mx-auto">{description}</p>
        </div>
    );
}

// --- OrganizationMemberItem dengan HoverCard ---
function OrganizationMemberItem({ member }: OrganizationMemberItemProps): JSX.Element {
    const user = member.user;
    const memberAvatarUrl = user.avatar && user.collectionId ? pb.getFileUrl(user, user.avatar, { thumb: '100x100' }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U')}&background=random&size=100`;
    const getRoleBadgeVariant = (role: RoleType) => { switch (role) { case 'admin': return 'destructive'; case 'moderator': return 'secondary'; default: return 'outline'; } };
    const joinDateString = member.created;
    let displayDate = 'Tanggal tidak valid';
    if (joinDateString) { const dateObj = new Date(joinDateString); if (!isNaN(dateObj.getTime())) { displayDate = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', }); } } else { displayDate = 'Tanggal tidak tersedia'; }

    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                <div className="flex flex-col sm:flex-row items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer rounded-lg">
                    <Image src={memberAvatarUrl} alt={user.name || user.username || 'Avatar'} width={64} height={64} className="w-16 h-16 rounded-lg object-cover border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-foreground truncate" title={user.name || user.username}>{user.name || user.username}</h3>
                            <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize text-xs px-2 py-0.5 flex-shrink-0">{member.role}</Badge>
                        </div>
                        {user.email && <p className="text-sm text-muted-foreground break-all">{user.email}</p>}
                        <p className="text-xs text-muted-foreground mt-1">Joined: {displayDate}</p>
                    </div>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 bg-card border-border shadow-2xl rounded-xl p-6" side="right" align="start">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                        <Image src={memberAvatarUrl} alt={user.name || 'Avatar'} width={56} height={56} className="h-14 w-14 rounded-full border-2 border-emerald-500 object-cover" />
                        <div className="min-w-0">
                            <h4 className="text-lg font-semibold text-foreground truncate">{user.name || user.username}</h4>
                            {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                            {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                        </div>
                    </div>
                    {user.bio && ( <div className="border-t border-border pt-4"> <h5 className="text-sm font-medium text-foreground mb-1">BIO</h5> <p className="text-sm text-muted-foreground leading-snug">{user.bio}</p> </div> )}
                    {(user.location_address || user.phone) && ( <div className="border-t border-border pt-4"> <h5 className="text-sm font-medium text-foreground mb-2">CONTACT INFO</h5> <div className="space-y-2 text-sm text-muted-foreground"> {user.location_address && ( <div className="flex items-start"> <MapPin className="h-4 w-4 mr-3 mt-0.5 text-emerald-500 flex-shrink-0" /> <span>{user.location_address}</span> </div> )} {user.phone && ( <div className="flex items-center"> <Phone className="h-4 w-4 mr-3 text-emerald-500 flex-shrink-0" /> <span>{user.phone}</span> </div> )} </div> </div> )}
                    {user.otherOrganizations && user.otherOrganizations.length > 0 && ( <div className="border-t border-border pt-4"> <h5 className="text-sm font-medium text-foreground mb-2">ALSO MEMBER OF</h5> <div className="space-y-1.5"> {user.otherOrganizations.map(org => ( <Link key={org.id} href={`/dashboard/organization/view/${org.id}`} className="flex items-center group text-sm" > <Building2 className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-emerald-500 transition-colors flex-shrink-0" /> <span className="text-muted-foreground group-hover:text-primary group-hover:underline transition-colors truncate">{org.name}</span> </Link> ))} </div> </div> )}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

// --- OrganizationMembersList ---
function OrganizationMembersList({ organizationId }: { organizationId: string }): JSX.Element {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const isMountedRef = useRef(true);
    const { toast: showToastHook } = useToast();
    const isCancellationError = (error: any): boolean => ( error.name === 'AbortError' || (error instanceof ClientResponseError && error.message.includes('autocancelled')) || (error instanceof ClientResponseError && error.status === 0) );

    const fetchOtherOrgs = useCallback(async (userId: string, currentOrgId: string, signal?: AbortSignal): Promise<OrganizationInfoForMemberList[]> => {
        try {
            const results = await pb.collection("danusin_user_organization_roles").getFullList<OrganizationRole>({ filter: `user.id="${userId}" && organization.id!="${currentOrgId}"`, expand: "organization", fields: "expand.organization.id,expand.organization.organization_name,expand.organization.organization_slug", signal, $autoCancel: false, });
            return results.map(item => item.expand?.organization).filter((org): org is RecordModel & { id: string; organization_name: string; organization_slug?: string } => !!org).map(org => ({ id: org.id, name: org.organization_name || "Unknown Org Name", organization_slug: org.organization_slug, }));
        } catch (error: any) { if (!isCancellationError(error)) { console.warn(`Failed to fetch other organizations for user ${userId}:`, error); } else { console.log(`Other orgs fetch cancelled for user ${userId}.`); } return []; }
    },[]);

    useEffect(() => {
        isMountedRef.current = true; const controller = new AbortController();
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const result = await pb.collection("danusin_user_organization_roles").getList<OrganizationRole>(1, 100, { filter: `organization="${organizationId}"`, expand: "user", signal: controller.signal, $autoCancel: false, });
                if (!isMountedRef.current || controller.signal.aborted) return;
                const memberPromises = result.items.map(async (item) => {
                    const expandedUser = item.expand?.user as UserDataForMemberList | undefined; // Type assertion
                    let otherOrganizationsData: OrganizationInfoForMemberList[] | null = null;
                    if (expandedUser && !controller.signal.aborted) { otherOrganizationsData = await fetchOtherOrgs(expandedUser.id, organizationId, controller.signal); }
                    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    const userData: UserDataForMemberList = expandedUser ? { ...expandedUser, id: expandedUser.id || item.user as string, otherOrganizations: otherOrganizationsData } : { id: item.user as string, collectionId: 'users', collectionName: 'users', name: "User (Loading...)", email: "N/A", avatar: "", username: "", bio: "", location_address: "", phone: "", otherOrganizations: null, created: '', updated: '' };
                    return { id: item.id, user: userData, role: item.role, created: item.created, };
                });
                const membersData = await Promise.all(memberPromises);
                if (isMountedRef.current && !controller.signal.aborted) {
                     membersData.sort((a, b) => { const roleOrder: Record<RoleType, number> = { admin: 0, moderator: 1, member: 2 }; const orderA = roleOrder[a.role] ?? 99; const orderB = roleOrder[b.role] ?? 99; if (orderA !== orderB) { return orderA - orderB; } const timeA = new Date(a.created).getTime() || 0; const timeB = new Date(b.created).getTime() || 0; return timeA - timeB; });
                    setMembers(membersData);
                }
            } catch (error: any) { if (!isCancellationError(error)) { if (isMountedRef.current) { console.error("Error fetching members:", error); showToastHook({ title: "Error Fetching Members", description: `Gagal mengambil daftar anggota. Error: ${error.message || 'Unknown error'}. Cek API Rules Pocketbase Anda.`, variant: "destructive" }); } } else { console.log("Fetch members request cancelled (expected behavior)."); } }
            finally { if (isMountedRef.current && !controller.signal.aborted) { setLoading(false); } }
        };
        if (organizationId) { fetchMembers(); } else { setLoading(false); setMembers([]); }
        return () => { isMountedRef.current = false; controller.abort(); };
    }, [organizationId, showToastHook, fetchOtherOrgs]);

    if (loading) { return <div className="space-y-3">{[...Array(3)].map((_, i) => (<MemberListSkeleton key={i} />))}</div>; }

    return (
        <div className="space-y-6"> {members.length === 0 ? ( <MemberListEmptyState title="Belum Ada Anggota" description="Organisasi ini belum memiliki anggota." icon={Users} /> ) : ( <div className="bg-card shadow-md rounded-xl border border-border divide-y divide-border dark:divide-zinc-700/80"> {members.map((memberItem) => ( <OrganizationMemberItem key={memberItem.id} member={memberItem} /> ))} </div> )} </div>
    );
}

// --- Komponen Halaman Utama (ViewOrganizationPage) ---
export default function ViewOrganizationPage(): JSX.Element {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [organization, setOrganization] = useState<OrganizationViewData | null>(null);
    const [products, setProducts] = useState<ProductListItemData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
    const [loadingFavorites, setLoadingFavorites] = useState(true);
    const organizationIdFromUrl = params.slug as string;

    const fetchUserFavorites = useCallback(async (signal?: AbortSignal) => {
        if (!currentUser || !pb.authStore.isValid) { setLoadingFavorites(false); return; }
        setLoadingFavorites(true);
        try { const record = await pb.collection('danusin_favorite').getFirstListItem<FavoriteRecord>(`danusers_id = "${currentUser.id}"`, { signal }); if (!signal?.aborted) { setFavoriteIds(new Set(record.products_id || [])); setFavoriteRecordId(record.id); }
        } catch (err: any) { if (!signal?.aborted) { if ((err instanceof ClientResponseError && err.status === 0) || err.name === 'AbortError') { console.warn("Favorite fetch was cancelled (Ignored)."); } else if (err.status === 404) { setFavoriteIds(new Set()); setFavoriteRecordId(null); } else { console.error("Failed to fetch favorites:", err); setFavoriteIds(new Set()); setFavoriteRecordId(null); } } }
        finally { if (!signal?.aborted) { setLoadingFavorites(false); } }
    }, [currentUser]);

    useEffect(() => { const controller = new AbortController(); fetchUserFavorites(controller.signal); return () => { controller.abort(); }; }, [fetchUserFavorites]);

    const updateLocalFavorites = useCallback((productId: string, action: 'add' | 'remove') => { setFavoriteIds(prevIds => { const newIds = new Set(prevIds); if (action === 'add') { newIds.add(productId); } else { newIds.delete(productId); } return newIds; }); }, []);

    useEffect(() => {
        if (!organizationIdFromUrl) { setError("ID Organisasi tidak ditemukan di URL."); setLoading(false); setLoadingProducts(false); return; }
        const controller = new AbortController(); const signal = controller.signal; let isMounted = true;
        const fetchAllData = async () => {
            if(!isMounted) return; setLoading(true); setLoadingProducts(true); setError(null);
            try {
                const orgResult = await pb.collection('danusin_organization').getOne<OrganizationViewData>(organizationIdFromUrl, { expand: 'created_by', signal }); if (!isMounted || signal.aborted) return; setOrganization(orgResult);
                if (orgResult) { const productResults = await pb.collection('danusin_product').getFullList<ProductListItemData>({ filter: `by_organization="${orgResult.id}"`, sort: '-created', signal, expand: 'by_organization,added_by,catalog' }); if(isMounted && !signal.aborted) setProducts(productResults); }
            } catch (err: any) { if (!isMounted || signal.aborted) return; if (err.name !== "AbortError" && !((err instanceof ClientResponseError && err.status === 0) || err.message?.includes('autocancelled'))) { console.error("Gagal mengambil data:", err); setError(err.status === 404 ? "Organisasi tidak ditemukan." : "Gagal memuat detail organisasi.");} }
            finally { if (isMounted && !signal.aborted) { setLoading(false); setLoadingProducts(false); } }
        };
        fetchAllData(); return () => { isMounted = false; controller.abort(); }
    }, [organizationIdFromUrl]);

    if (loading || loadingFavorites) { return <div className="w-full"><ViewOrganizationSkeleton /></div>; }
    if (error) { return ( <div className="p-4 md:p-8 w-full"> <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto"> <Building2 className="mb-4 h-16 w-16 text-destructive/70" /> <h2 className="mb-3 text-2xl font-bold text-destructive">{error}</h2> <Button onClick={() => router.back()} variant="outline" className="mt-6"><span>Kembali</span></Button> </div> </div> ); }
    if (!organization) { return ( <div className="p-4 md:p-8 w-full"> <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto"> <Package className="mb-4 h-16 w-16 text-muted-foreground/60" /> <h2 className="mb-2 text-2xl font-bold">Data Organisasi Tidak Ditemukan</h2> <Button onClick={() => router.back()} variant="outline" className="mt-6"><span>Kembali</span></Button> </div> </div> ); }

    const org = organization;
    const imageUrl = org.organization_image && org.collectionId ? pb.getFileUrl(org, org.organization_image) : "/placeholder.svg?height=300&width=600&text=" + encodeURIComponent(org.organization_name.substring(0,2).toUpperCase());
    const canShowProgress = org.target != null && org.target > 0;
    const progressPercentage = canShowProgress && org.target_progress != null ? Math.min(Math.round((org.target_progress / org.target!) * 100), 100) : 0;
    const creatorInfo = org.expand?.created_by;
    const creatorName = creatorInfo?.name || creatorInfo?.username || org.created_by;
    const creatorAvatar = (creatorInfo && creatorInfo.avatar && creatorInfo.collectionId) ? pb.getFileUrl(creatorInfo, creatorInfo.avatar, { thumb: '50x50' }) : null;
    const tabsConfig = [ { value: "detail", label: "Detail", icon: Info }, { value: "products", label: "Produk", icon: Package }, { value: "members", label: "Anggota", icon: Users }, ];

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-6"> <Button variant="outline" size="icon" className="rounded-md flex-shrink-0" onClick={() => router.back()} aria-label="Kembali ke Halaman Sebelumnya" > <span><ArrowLeft className="h-4 w-4" /></span> </Button> <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words" title={org.organization_name}> {org.organization_name} </h1> </div>
            <Tabs defaultValue="detail" className="w-full">
                <div className="w-full mb-4"> <TabsList className="h-10 items-center justify-center text-muted-foreground bg-neutral-100/90 dark:bg-zinc-800/70 backdrop-blur-sm mb-5 md:mb-6 p-1.5 border border-neutral-200/90 dark:border-zinc-700/50 rounded-lg flex w-full space-x-1 sm:space-x-1.5"> {tabsConfig.map(tab => ( <TabsTrigger key={tab.value} value={tab.value} className="py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all duration-200 w-full whitespace-nowrap text-neutral-600 hover:bg-neutral-200/70 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:text-emerald-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:opacity-90 flex items-center justify-center gap-2" > <tab.icon className="h-4 w-4" /> {tab.label} </TabsTrigger> ))} </TabsList> </div>
                <TabsContent value="detail" className="mt-0">
                    <Card className="overflow-hidden shadow-lg">
                        {org.organization_image && ( <div className="w-full h-48 md:h-72 xl:h-80 relative bg-muted border-b"> <Image src={imageUrl} alt={`Gambar ${org.organization_name}`} fill style={{ objectFit: "cover" }} onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=300&width=600&text=Gagal+Muat"; }} priority /> </div> )}
                        <CardHeader className={org.organization_image ? "pt-6" : ""}> <CardTitle className="text-3xl mb-1">{org.organization_name}</CardTitle> <CardDescription> Slug: <Badge variant="secondary" className="ml-1 cursor-default">{org.organization_slug}</Badge> </CardDescription> </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            {org.organization_description && ( <div className="prose dark:prose-invert max-w-none text-muted-foreground"> <h3 className="text-lg font-semibold text-foreground mb-2 border-b pb-2">Deskripsi</h3> <div dangerouslySetInnerHTML={{ __html: org.organization_description }} /> </div> )}
                            {canShowProgress && ( <div className="pt-2"> <h3 className="text-lg font-semibold text-foreground mb-2">Progres Target</h3> <div className="flex justify-between items-baseline text-sm text-muted-foreground mb-1"> <span>Rp{(org.target_progress ?? 0).toLocaleString('id-ID')} terkumpul</span> <span className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{progressPercentage}%</span> </div> <Progress value={progressPercentage} className="w-full h-3 mb-1 rounded-full" /> <div className="text-sm text-muted-foreground text-right"> dari target Rp{(org.target ?? 0).toLocaleString('id-ID')} </div> </div> )}
                            <div className="space-y-3 pt-4 border-t mt-6"> <h3 className="text-lg font-semibold text-foreground mb-2">Informasi Tambahan</h3> {org.group_phone && ( <div className="flex items-center gap-2"> <WhatsAppIcon className="h-5 w-5 text-green-500 flex-shrink-0" /> <a href={org.group_phone} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all"> {org.group_phone} </a> </div> )} <div className="flex items-center gap-2 pt-1"> <UserCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" /> <p className="text-sm text-muted-foreground"> Dibuat oleh: <span className="font-medium text-foreground ml-1">{creatorName}</span> {creatorAvatar && <Image src={creatorAvatar} alt={creatorName || "Avatar"} width={20} height={20} className="rounded-full inline-block ml-2 align-middle" />} </p> </div> <p className="text-xs text-muted-foreground">ID Organisasi: {org.id}</p> <p className="text-xs text-muted-foreground">Dibuat pada: {new Date(org.created).toLocaleString('id-ID', { dateStyle:'long', timeStyle:'short' })}</p> <p className="text-xs text-muted-foreground">Terakhir diperbarui: {new Date(org.updated).toLocaleString('id-ID', { dateStyle:'long', timeStyle:'short' })}</p> </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="products" className="mt-0">
                    <Card className="shadow-lg">
                        <CardHeader> <CardTitle className="text-2xl">Produk dari {org.organization_name}</CardTitle> <CardDescription>Telusuri produk yang ditawarkan oleh organisasi ini.</CardDescription> </CardHeader>
                        <CardContent>
                            {loadingProducts ? ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{[...Array(4)].map((_, i) => ( <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/50"> <Skeleton className="h-40 w-full rounded-md" /> <Skeleton className="h-6 w-3/4" /> <Skeleton className="h-5 w-1/2" /> </div> ))}</div> )
                            : products.length > 0 ? ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">{products.map((product) => (
                                <NewProductCard key={product.id} product={product} currentUser={currentUser} favoriteIds={favoriteIds} favoriteRecordId={favoriteRecordId} updateLocalFavorites={updateLocalFavorites} refreshFavorites={fetchUserFavorites} /> ))}</div> )
                            : ( <div className="text-center py-10 text-muted-foreground"> <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" /> <p className="text-lg">Organisasi ini belum memiliki produk.</p> </div> )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="members" className="mt-0">
                    <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-xl">Anggota Organisasi</CardTitle><CardDescription>Lihat anggota organisasi ini.</CardDescription></CardHeader>
                        <CardContent className="pb-6"> <OrganizationMembersList organizationId={org.id} /> </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}