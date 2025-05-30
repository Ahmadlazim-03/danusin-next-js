"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { pb } from "@/lib/pocketbase";
import { 
    Building2, 
    Plus, 
    Settings, 
    ExternalLink as ViewIcon, 
    Users, 
    UserCheck, 
    ShieldCheck, 
    UserCog, 
    UserCircle, 
    LogOut, // Ikon untuk keluar
    Loader2 // Ikon untuk loading
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { RecordModel, ClientResponseError } from "pocketbase"; // Impor ClientResponseError

// Tipe Organization
type Organization = RecordModel & {
  // id, collectionId, collectionName, created, updated otomatis ada dari RecordModel
  organization_name: string;
  organization_description: string;
  organization_image: string;
  organization_slug: string;
  target: number;
  target_progress: number;
  created_by: string;
};

// Definisikan UserRoleDetail di sini atau impor jika digunakan di tempat lain
interface UserRoleDetail {
  role: string; // 'admin', 'member', 'moderator'
  roleRecordId: string; // ID dari record di danusin_user_organization_roles
}

// Props untuk OrganizationItem
interface OrganizationItemProps {
  org: Organization;
  role: string; // Nama peran, mis. 'admin', 'member'
  isJoinedOrganization?: boolean; // Flag untuk menandakan ini adalah organisasi yang dijoin
  roleRecordId?: string; // ID dari record peran di danusin_user_organization_roles
  onLeaveSuccess?: (organizationId: string) => void; // Callback setelah berhasil keluar
}

// --- Komponen untuk 1 Item Organisasi ---
function OrganizationItem({ org, role, isJoinedOrganization, roleRecordId, onLeaveSuccess }: OrganizationItemProps) {
  const { toast } = useToast();
  const [isLeaving, setIsLeaving] = useState(false);

  const imageUrl = org.organization_image
    ? pb.getFileUrl(org, org.organization_image, { thumb: "200x200" })
    : "/placeholder.svg?height=96&width=96"; // Fallback jika tidak ada gambar

  const isAdminOrModerator = role === "admin" || role === "moderator";

  const canShowProgress = org.target > 0;
  const progressPercentage = canShowProgress && org.target_progress != null // Pastikan target_progress tidak null
      ? Math.min(Math.round((org.target_progress / org.target) * 100), 100)
      : 0;
  const currentRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member';

  let roleIcon = <UserCircle className="mr-1.5 h-3.5 w-3.5" />;
  let roleBadgeClass = "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600";

  if (role === "admin") {
    roleIcon = <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    roleBadgeClass = "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900";
  } else if (role === "moderator") {
    roleIcon = <UserCog className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
    roleBadgeClass = "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900";
  }

  const handleLeaveOrganization = async () => {
    if (!roleRecordId) {
      toast({ title: "Error", description: "ID Peran tidak ditemukan untuk keluar.", variant: "destructive" });
      return;
    }
    setIsLeaving(true);
    try {
      await pb.collection('danusin_user_organization_roles').delete(roleRecordId);
      toast({ title: "Berhasil Keluar", description: `Anda telah keluar dari organisasi ${org.organization_name}.` });
      if (onLeaveSuccess) {
        onLeaveSuccess(org.id);
      }
    } catch (error: any) {
      console.error("Error leaving organization:", error);
      let errorMessage = "Terjadi kesalahan saat mencoba keluar.";
      if (error instanceof ClientResponseError) {
        errorMessage = error.response?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({ title: "Gagal Keluar", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:border-emerald-500/60 dark:hover:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-zinc-900">
      <Link href={`/organizations/${org.organization_slug}`} className="block flex-shrink-0 w-full xs:w-20 sm:w-24 h-auto xs:h-20 sm:h-24 aspect-square overflow-hidden rounded-lg bg-muted border-2 border-transparent group-hover:border-emerald-400 transition-all duration-300 shadow-sm cursor-pointer">
        <Image
          src={imageUrl}
          alt={org.organization_name}
          width={96}
          height={96}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
              e.currentTarget.onerror = null; // Mencegah loop error jika placeholder juga gagal
              e.currentTarget.src = "/placeholder.svg?height=96&width=96";
          }}
        />
      </Link>
      <div className="flex-1 w-full flex flex-col justify-between min-h-[96px] mt-3 sm:mt-0">
        <div>
          <div className="flex justify-between items-start mb-1 sm:mb-1.5">
            <h3 className="text-base sm:text-lg font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <Link href={`/organizations/${org.organization_slug}`} className="hover:underline focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded">
                  {org.organization_name}
              </Link>
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Badge
                  className={cn(
                      "capitalize text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 h-fit tracking-wide cursor-help border flex items-center gap-1",
                      roleBadgeClass
                  )}
                  >
                  {roleIcon}
                  {role || "member"}
                  </Badge>
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-background">
                  <p>Peran Anda: {currentRole}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div
            className="mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed prose dark:prose-invert prose-sm max-w-full prose-p:m-0 prose-ul:m-0 prose-ol:m-0"
            dangerouslySetInnerHTML={{
                __html: org.organization_description || "<p>Tidak ada deskripsi.</p>"
            }}
          />
        </div>

        {canShowProgress && (
            <div className="mt-auto mb-3 sm:mb-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-1 sm:mb-1.5">
                    <span className="font-medium text-foreground/80">Progres Target</span>
                    <span className={`font-semibold ${progressPercentage >= 100 ? 'text-green-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {progressPercentage}%
                    </span>
                </div>
                <Progress value={progressPercentage} className="h-2 sm:h-2.5 rounded-full" />
                <div className="text-right text-xs text-muted-foreground mt-1 sm:mt-1.5">
                    Rp {org.target_progress?.toLocaleString('id-ID') || 0} / Rp {org.target?.toLocaleString('id-ID') || 0}
                </div>
            </div>
        )}

        <div className={`flex items-center gap-2 sm:gap-3 justify-end ${canShowProgress ? 'mt-1' : 'mt-auto pt-2'}`}>
          <Button asChild variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 sm:px-3 py-1 h-auto rounded-md text-xs sm:text-sm">
            <Link href={`/dashboard/organization/view/${org.id}`}>
                <ViewIcon className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> View Organization
            </Link>
          </Button>
          {isAdminOrModerator && !isJoinedOrganization && ( // Tombol Manage hanya jika admin/mod DAN bukan hanya joined (alias created)
            <Button asChild variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary dark:border-primary/40 dark:text-primary dark:hover:bg-primary/20 px-2 sm:px-3 py-1 h-auto rounded-md text-xs sm:text-sm">
              <Link href={`/dashboard/organization/${org.id}`}>
                  <Settings className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Manage
              </Link>
            </Button>
          )}
          {/* TOMBOL KELUAR ORGANISASI */}
          {isJoinedOrganization && roleRecordId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline" // Gunakan outline standar, lalu styling manual atau buat varian destructive_outline
                  size="sm"
                  className="border-red-500/80 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:border-red-600/70 dark:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 px-2 sm:px-3 py-1 h-auto rounded-md text-xs sm:text-sm"
                  disabled={isLeaving}
                >
                  {isLeaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <LogOut className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  Keluar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Keluar Organisasi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin keluar dari organisasi "{org.organization_name}"? Tindakan ini tidak dapat diurungkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLeaving}>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveOrganization}
                    disabled={isLeaving}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLeaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Ya, Keluar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}


// --- Komponen Skeleton ---
function OrganizationSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row items-start gap-5 p-5 rounded-xl border bg-card">
            <Skeleton className="h-24 w-full sm:w-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 w-full mt-2 sm:mt-0 flex flex-col min-h-[150px]">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-3/5" />
                        <Skeleton className="h-5 w-1/6" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="mt-3 mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-3 w-1/6" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                    <Skeleton className="h-3 w-1/3 ml-auto mt-1.5" />
                </div>
                <div className="flex justify-end gap-3 mt-auto">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
            </div>
        </div>
    )
}

// --- Komponen Tampilan Kosong ---
function EmptyState({ title, description, showButton, icon: Icon }: { title: string, description: string, showButton: boolean, icon: React.ElementType }) {
    return (
        <div className="text-center py-12 px-6 bg-gradient-to-br from-card to-muted/30 dark:from-card dark:to-zinc-800/40 rounded-xl border-2 border-dashed border-muted-foreground/30 shadow">
            <div className="mb-5 inline-flex items-center justify-center p-5 rounded-full bg-gradient-to-tr from-emerald-500 to-green-500 text-white shadow-lg">
                <Icon className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h4>
            <p className="text-base text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
            {showButton && (
                 <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md transition-all hover:shadow-lg transform hover:scale-105 rounded-lg">
                    <Link href="/dashboard/organization/new">
                        <Plus className="mr-2 h-5 w-5" /> Create Organization
                    </Link>
                </Button>
            )}
        </div>
    );
}

// --- Komponen Utama ---
export function OrganizationsList({ showEmpty = false }: { showEmpty?: boolean }) {
  const { user, isDanuser } = useAuth();
  const [myOrganizations, setMyOrganizations] = useState<Organization[]>([]);
  const [joinedOrganizations, setJoinedOrganizations] = useState<Organization[]>([]);
  const [userRoleDetails, setUserRoleDetails] = useState<Record<string, UserRoleDetail>>({});
  const [loading, setLoading] = useState(true);
  const cancelTokensRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelTokensRef.current.forEach((token: string) => {
        try { pb.cancelRequest(token); } catch (e) { /* abaikan error jika request sudah selesai atau dibatalkan */ }
      });
      cancelTokensRef.current = []; // Kosongkan array setelah unmount
    };
  }, []);

  const fetchOrganizationsCallback = useCallback(async (currentUserId: string, signal: AbortSignal) => {
    setLoading(true);
    try {
      const userOrgsResult = await pb.collection("danusin_user_organization_roles").getFullList<RecordModel & {organization: string; role: string}>( {
          filter: `user="${currentUserId}"`,
          signal: signal,
          $autoCancel: false, // Kita handle cancel secara manual jika perlu
      });

      if (signal.aborted || !isMountedRef.current) return;

      const newRoleDetails: Record<string, UserRoleDetail> = {};
      const orgIds: string[] = [];

      userOrgsResult.forEach((item) => {
        if (item.organization) {
          orgIds.push(item.organization);
          newRoleDetails[item.organization] = {
            role: item.role,
            roleRecordId: item.id
          };
        }
      });
      
      if (isMountedRef.current && !signal.aborted) {
        setUserRoleDetails(newRoleDetails);
      }


      if (orgIds.length === 0) {
        if (isMountedRef.current && !signal.aborted) {
            setMyOrganizations([]);
            setJoinedOrganizations([]);
        }
        return; // Jangan setLoading(false) di sini jika masih ada fetch berikutnya
      }

      const orgsFilter = orgIds.map(id => `id="${id}"`).join("||");
      
      const orgsResults = await pb.collection("danusin_organization").getFullList<Organization>({
          filter: orgsFilter,
          signal: signal,
          $autoCancel: false,
      });

      if (signal.aborted || !isMountedRef.current) return;

      const my: Organization[] = [];
      const joined: Organization[] = [];

      orgsResults.forEach(org => {
        if (org.created_by === currentUserId) {
          my.push(org);
        } else {
          joined.push(org);
        }
      });
      
      if (isMountedRef.current && !signal.aborted) {
        setMyOrganizations(my);
        setJoinedOrganizations(joined);
      }

    } catch (error: any) {
       if (signal.aborted || (error.name === 'AbortError') || (error instanceof ClientResponseError && error.isAbort)) {
        // console.log("Fetch organizations request was cancelled.");
      } else if (isMountedRef.current) {
        console.error("Error fetching organizations:", error);
      }
    } finally {
      if (isMountedRef.current && !signal.aborted) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // pb instance diasumsikan stabil

  useEffect(() => {
    if (user?.id) {
      const controller = new AbortController();
      fetchOrganizationsCallback(user.id, controller.signal);
      return () => {
        controller.abort();
      };
    } else {
      setLoading(false); // Tidak ada user, tidak perlu loading
      setMyOrganizations([]);
      setJoinedOrganizations([]);
      setUserRoleDetails({});
    }
  }, [user, fetchOrganizationsCallback]);


  if (loading) {
    return (
        <div className="space-y-8">
            {[1,2].map(i => (
                <Card key={i} className="dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 border-b dark:border-zinc-700/80 p-4 sm:p-5 md:p-6">
                        <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32 sm:w-40 md:w-48" />
                            <Skeleton className="h-3 w-24 sm:w-32 md:w-40" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 md:p-6 space-y-5"><OrganizationSkeleton /></CardContent>
                </Card>
            ))}
        </div>
    )
  }

  if (myOrganizations.length === 0 && joinedOrganizations.length === 0 && !showEmpty) {
      return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
        <div className="space-y-10">
            <Card className="dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 shadow-lg rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-emerald-500/10">
                <CardHeader className="flex flex-row items-center justify-between border-b dark:border-zinc-700/70 p-4 sm:p-5 bg-gradient-to-r from-emerald-50 dark:from-emerald-900/30 to-transparent">
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 mr-2 sm:mr-3">
                        <div className="flex flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md">
                            <UserCheck className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base xs:text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">My Created Organizations</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Organisasi yang Anda buat dan kelola.</p>
                        </div>
                    </div>
                    {isDanuser && ( // Tombol Create hanya jika isDanuser
                        <Button
                            asChild
                            size="sm"
                            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105 rounded-md flex-shrink-0 ml-auto px-2.5 py-1.5 sm:px-3"
                        >
                            <Link href="/dashboard/organization/new" className="flex items-center">
                                <Plus className="h-4 w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                                <span className="hidden xs:inline text-xs sm:text-sm">Create Organization</span>
                                <span className="xs:hidden text-xs">Create</span>
                            </Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                {(myOrganizations.length === 0 && !loading) ? (
                    <EmptyState
                        title="Belum Membuat Organisasi"
                        description="Anda belum membuat organisasi apapun. Ayo mulai satu!"
                        showButton={!!isDanuser} // Tampilkan tombol create hanya jika isDanuser
                        icon={Building2}
                    />
                ) : (
                    <div className="space-y-6">
                    {myOrganizations.map((org) => (
                        <OrganizationItem
                            key={org.id}
                            org={org}
                            role={userRoleDetails[org.id]?.role || 'admin'}
                            isJoinedOrganization={false}
                            // roleRecordId dan onLeaveSuccess tidak relevan untuk "My Organizations"
                        />
                    ))}
                    </div>
                )}
                </CardContent>
            </Card>

            {(joinedOrganizations.length > 0 || (myOrganizations.length === 0 && joinedOrganizations.length === 0 && showEmpty && !loading) ) && (
                <Card className="dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 shadow-lg rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-sky-500/10">
                    <CardHeader className="flex flex-row items-center justify-between border-b dark:border-zinc-700/70 p-4 sm:p-5 bg-gradient-to-r from-sky-50 dark:from-sky-900/30 to-transparent">
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                            <div className="flex flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-md">
                                <Users className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base xs:text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-300">Joined Organizations</h2>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">Organisasi tempat Anda bergabung.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        {joinedOrganizations.length === 0 && !loading ? (
                             <EmptyState
                                title="Belum Bergabung Organisasi"
                                description="Anda belum bergabung dengan organisasi manapun."
                                showButton={false}
                                icon={Users}
                            />
                        ) : (
                            <div className="space-y-6">
                                {joinedOrganizations.map((org) => (
                                    <OrganizationItem
                                        key={org.id}
                                        org={org}
                                        role={userRoleDetails[org.id]?.role || 'member'}
                                        isJoinedOrganization={true}
                                        roleRecordId={userRoleDetails[org.id]?.roleRecordId}
                                        onLeaveSuccess={(orgId) => {
                                          setJoinedOrganizations(prevOrgs => prevOrgs.filter(o => o.id !== orgId));
                                          setUserRoleDetails(prevDetails => {
                                            const newDetails = {...prevDetails};
                                            delete newDetails[orgId];
                                            return newDetails;
                                          });
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    </TooltipProvider>
  );
}