"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MapPin, Wifi, WifiOff, Package, Eye, Building2 as OrgIcon } from "lucide-react";
import Image from "next/image"; // Diperlukan untuk komponen AvatarImage
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { pb } from "@/lib/pocketbase";
import { RecordModel, ClientResponseError } from "pocketbase";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
// import { cn } from "@/lib/utils"; // cn tidak digunakan secara eksplisit di sini, bisa dihapus jika tidak ada di tempat lain

// --- TIPE DATA ---
type OrganizationLinkInfo = {
    id: string;
    name: string;
    organization_slug?: string;
};

type UserProfileData = RecordModel & {
    name?: string;
    username?: string;
    avatar?: string;
    bio?: string; 
    otherOrganizations?: OrganizationLinkInfo[];
};

type Coordinates = { lat: number; lon: number; };

type UserLocationStatus = RecordModel & {
    danuser_related: string; 
    danuser_location?: Coordinates | string | null;
    isactive: boolean;
    display_address?: string;
    expand?: {
        danuser_related?: UserProfileData;
    };
};

interface ActiveUserCardProps {
  userLocationData: UserLocationStatus;
}

// --- Komponen Kartu Pengguna ---
function ActiveUserCard({ userLocationData }: ActiveUserCardProps) {
  const router = useRouter();
  const user = userLocationData.expand?.danuser_related;

  if (!user) {
    return (
        <Card className="h-full animate-pulse bg-muted/50">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-1.5"> <Skeleton className="h-5 w-3/4" /> <Skeleton className="h-3 w-1/2" /> </div>
            </CardHeader>
            <CardContent className="p-4 pt-0"> <Skeleton className="h-8 w-full rounded-md" /> </CardContent>
        </Card>
    );
  }

  const avatarUrl = user.avatar && user.collectionId && user.id
    ? pb.getFileUrl(user, user.avatar, { thumb: "100x100" })
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U').charAt(0)}&background=random&size=100&color=fff&bold=true`;

  const profileLink = `/dashboard/profile/${user.username || user.id}`;

  return (
    <Card className="h-full group transition-all duration-300 hover:shadow-lg dark:hover:border-emerald-500/50 flex flex-col">
        <CardHeader className="flex flex-row items-center gap-3 p-4">
            <Link href={profileLink} className="flex-shrink-0">
                <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-emerald-500 transition-colors">
                    <AvatarImage src={avatarUrl} alt={user.name || user.username} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {(user.name || user.username || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
                <Link href={profileLink} className="hover:underline">
                    <CardTitle className="text-base font-semibold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {user.name || user.username || "Pengguna"}
                    </CardTitle>
                </Link>
                {userLocationData.isactive && (
                    <Badge variant="outline" className="mt-1 text-xs border-green-500 text-green-600 bg-green-500/10">
                        <Wifi className="h-3 w-3 mr-1"/> Aktif
                    </Badge>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between">
            <div>
                {user.bio && ( <p className="text-xs text-muted-foreground line-clamp-2 mb-2"> {user.bio} </p> )}
                {userLocationData.display_address && ( <div className="flex items-start text-xs text-muted-foreground mb-2"> <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 text-emerald-500 flex-shrink-0" /> <span className="line-clamp-2">{userLocationData.display_address}</span> </div> )}
                
                {user.otherOrganizations && user.otherOrganizations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/60">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Organisasi Diikuti:</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {user.otherOrganizations.slice(0, 3).map(org => ( 
                                <Link key={org.id} href={`/dashboard/organization/view/${org.id}`} passHref>
                                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-muted/80">
                                        {org.name}
                                    </Badge>
                                </Link>
                            ))}
                            {user.otherOrganizations.length > 3 && (
                                 <Link href={profileLink} passHref>
                                    <Badge className=" hover:underline p-0 h-auto">
                                        +{user.otherOrganizations.length - 3} lainnya
                                    </Badge>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <Button 
                variant="outline" size="sm" 
                className="w-full mt-3 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-700/20 dark:hover:text-emerald-300"
                onClick={() => router.push('/dashboard/maps')} 
            >
                <Eye className="mr-2 h-4 w-4" /> Lihat di Peta
            </Button>
        </CardContent>
    </Card>
  );
}

// Komponen Skeleton untuk daftar pengguna
function ActiveUsersSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="flex flex-row items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-1.5"> <Skeleton className="h-5 w-3/4" /> <Skeleton className="h-3 w-1/2" /> </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <Skeleton className="h-3 w-full" /> <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-4 w-1/2 mt-1" /> {/* For "Organisasi Diikuti" title */}
            <div className="flex flex-wrap gap-1.5"><Skeleton className="h-5 w-16 rounded-md" /><Skeleton className="h-5 w-20 rounded-md" /></div>
            <Skeleton className="h-8 w-full mt-2 rounded-md" /> 
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Komponen Utama: ActiveUsersWithLocation ---
export default function ActiveUsersWithLocation() {
  const [activeUsers, setActiveUsers] = useState<UserLocationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onlineUserFilter = 'isactive = true && danuser_location != null'; 

  const getAddressFromCoordinates = useCallback(async (lat: number, lon: number, signal?: AbortSignal): Promise<string> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { signal });
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch (err: any) {
      if (err.name !== 'AbortError' && !signal?.aborted) { console.warn("Error fetching address from Nominatim:", err); }
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  }, []);

  const fetchUserJoinedOrganizations = useCallback(async (userId: string, signal?: AbortSignal): Promise<OrganizationLinkInfo[]> => {
    try {
        const roles = await pb.collection('danusin_user_organization_roles').getFullList({
            filter: `user = "${userId}"`, expand: 'organization', 
            fields: 'expand.organization.id, expand.organization.organization_name, expand.organization.organization_slug', 
            signal, $autoCancel: false,
        });
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        return roles.map(role => role.expand?.organization).filter(org => org)
                    .map(org => ({ id: org.id, name: org.organization_name, organization_slug: org.organization_slug })) as OrganizationLinkInfo[];
    } catch (err: any) {
        if (err.name !== 'AbortError' && !signal?.aborted) { console.warn(`Could not fetch organizations for user ${userId}:`, err); }
        return [];
    }
  }, []);

  const fetchActiveUsers = useCallback(async (signal: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const result = await pb.collection('danusin_users_location').getFullList<UserLocationStatus>(
        { filter: onlineUserFilter, sort: '-created', expand: 'danuser_related', signal, $autoCancel: false, }
      );
      if (signal.aborted) return;

      const usersWithDetails = await Promise.all(
        result.map(async (userLoc) => {
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          let displayAddress = "Lokasi tidak diketahui";
          if (userLoc.danuser_location && typeof userLoc.danuser_location === 'object' && 
              'lat' in userLoc.danuser_location && 'lon' in userLoc.danuser_location) {
            const coords = userLoc.danuser_location as Coordinates;
            if(coords.lat != null && coords.lon != null) { // Pastikan lat dan lon ada
                 displayAddress = await getAddressFromCoordinates(coords.lat, coords.lon, signal);
            }
          } else if (typeof userLoc.danuser_location === 'string' && userLoc.danuser_location.trim() !== '') {
            displayAddress = userLoc.danuser_location;
          }
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
          
          let otherOrganizations: OrganizationLinkInfo[] = [];
          if (userLoc.expand?.danuser_related?.id) {
            otherOrganizations = await fetchUserJoinedOrganizations(userLoc.expand.danuser_related.id, signal);
          }
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

          return { 
            ...userLoc, 
            display_address: displayAddress,
            expand: {
                ...userLoc.expand,
                danuser_related: userLoc.expand?.danuser_related 
                    ? { ...userLoc.expand.danuser_related, otherOrganizations } 
                    : undefined
            }
          };
        })
      );
      
      if (signal.aborted) return;
      setActiveUsers(usersWithDetails);

    } catch (err: any) { 
        if (err.name !== 'AbortError' && !(err instanceof ClientResponseError && err.status === 0) && !signal.aborted) {
            console.error("Failed to fetch active users with location:", err);
            setError("Gagal memuat daftar pengguna aktif.");
            toast({ title: "Error", description: "Gagal memuat pengguna aktif.", variant: "destructive" });
        } else {
             console.log("Fetch active users request was cancelled or resulted in status 0.");
        }
    } 
    finally { if (!signal.aborted) { setLoading(false); } }
  }, [onlineUserFilter, getAddressFromCoordinates, fetchUserJoinedOrganizations]);

  useEffect(() => {
    const controller = new AbortController();
    fetchActiveUsers(controller.signal);
    return () => { controller.abort(); };
  }, [fetchActiveUsers]);

  if (loading) {
    return (
        <section className="mb-6 md:mb-10">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-24" />
            </div>
            <ActiveUsersSkeleton />
        </section>
    );
  }
  if (error) {
    return (
        <section className="mb-6 md:mb-10 p-4 text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => fetchActiveUsers(new AbortController().signal)} variant="outline" className="mt-2">Coba Lagi</Button>
        </section>
    );
  }

  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center text-neutral-800 dark:text-white">
          <Users className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Pengguna Aktif di Sekitar Anda
        </h2>
        <Button
          variant="outline" size="sm"
          className="border-neutral-300 text-neutral-700 hover:bg-emerald-50/90 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 min-w-[90px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-md"
          onClick={() => router.push('/dashboard/maps')}
        >
          Lihat Semua di Peta
        </Button>
      </div>

      {activeUsers.length === 0 && !loading ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-dashed rounded-lg">
          <Users className="mx-auto h-12 w-12 mb-4 text-gray-400" />
          <p className="text-lg">Tidak ada pengguna aktif dengan lokasi yang dapat ditampilkan saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {activeUsers.map((userLoc) => (
            <ActiveUserCard key={userLoc.id} userLocationData={userLoc} />
          ))}
        </div>
      )}
    </section>
  );
}