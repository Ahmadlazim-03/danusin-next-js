"use client"

import React, { useEffect, useRef, useState } from "react";
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
import { Building2, Plus, Settings, ExternalLink as ViewIcon, Users, UserCheck, ShieldCheck, UserCog, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils"; // Asumsi Anda punya cn dari shadcn

// Tipe Organization
type Organization = {
  id: string;
  collectionId: string;
  collectionName: string;
  organization_name: string;
  organization_description: string;
  organization_image: string;
  organization_slug: string;
  target: number;
  target_progress: number;
  created_by: string;
};

// --- Komponen untuk 1 Item Organisasi ---
function OrganizationItem({ org, role }: { org: Organization, role: string }) {
  const imageUrl = org.organization_image
    ? pb.getFileUrl(org, org.organization_image, { thumb: "200x200" })
    : "/placeholder.svg?height=96&width=96";

  const isAdminOrModerator = role === "admin" || role === "moderator";

  const canShowProgress = org.target > 0;
  const progressPercentage = canShowProgress
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

  return (
    <div className="group flex flex-col sm:flex-row items-start gap-5 p-5 rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:border-emerald-500/60 dark:hover:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
      <Link href={`/organizations/${org.organization_slug}`} className="block flex-shrink-0 w-full sm:w-24 h-24 sm:h-24 overflow-hidden rounded-lg bg-muted border-2 border-transparent group-hover:border-emerald-400 transition-all duration-300 shadow-sm cursor-pointer">
        <Image
          src={imageUrl}
          alt={org.organization_name}
          width={96}
          height={96}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder.svg?height=96&width=96";
          }}
        />
      </Link>
      <div className="flex-1 w-full flex flex-col justify-between min-h-[96px]">
        <div>
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="text-lg font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <Link href={`/organizations/${org.organization_slug}`} className="hover:underline focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded">
                  {org.organization_name}
              </Link>
            </h3>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                    className={cn(
                        "capitalize text-xs px-2.5 py-1 h-fit tracking-wide cursor-help border flex items-center gap-1",
                        roleBadgeClass
                    )}
                    >
                    {roleIcon}
                    {role || "member"}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-foreground text-background">
                    <p>Your Role: {currentRole}</p>
                </TooltipContent>
            </Tooltip>
          </div>
          <div
            className="mb-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed prose dark:prose-invert prose-sm max-w-full prose-p:m-0 prose-ul:m-0 prose-ol:m-0"
            dangerouslySetInnerHTML={{
                __html: org.organization_description || "<p>No description available.</p>"
            }}
          />
        </div>

        {canShowProgress && (
            <div className="mt-2 mb-4">
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5">
                    <span className="font-medium text-foreground/80">Target Progress</span>
                    <span className={`font-semibold ${progressPercentage >= 100 ? 'text-green-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {progressPercentage}%
                    </span>
                </div>
                {/* indicatorClassName dihapus */}
                <Progress value={progressPercentage} className="h-2.5 rounded-full" />
                <div className="text-right text-xs text-muted-foreground mt-1.5">
                   Rp {org.target_progress.toLocaleString('id-ID')} / Rp {org.target.toLocaleString('id-ID')}
                </div>
            </div>
        )}

        <div className={`flex items-center gap-3 justify-end ${canShowProgress ? 'mt-1' : 'mt-auto pt-2'}`}>
          <Button asChild variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 px-3 py-1.5 h-auto rounded-md">
            <Link href={`/dashboard/organization/view/${org.id}`}>
                <ViewIcon className="mr-1.5 h-4 w-4" /> View Organization
            </Link>
          </Button>
          {isAdminOrModerator && (
            <Button asChild variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary dark:border-primary/40 dark:text-primary dark:hover:bg-primary/20 px-3 py-1.5 h-auto rounded-md">
              <Link href={`/dashboard/organization/${org.id}`}>
                <Settings className="mr-1.5 h-4 w-4" /> Manage
              </Link>
            </Button>
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
        <div className="text-center py-12 px-6 bg-gradient-to-br from-card to-muted/30 dark:from-card dark:to-zinc-800/40 rounded-xl border-2 border-dashed border-muted/70 shadow">
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
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const cancelTokensRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelTokensRef.current.forEach((token: string) => pb.cancelRequest(token));
    };
  }, []);

  useEffect(() => {
    cancelTokensRef.current.forEach((token: string) => pb.cancelRequest(token));
    cancelTokensRef.current = [];

    async function fetchOrganizations() {
      if (!user) { setLoading(false); return; }
      setLoading(true);

      try {
        const userOrgsCancelToken = `user_orgs_${Date.now()}`;
        cancelTokensRef.current.push(userOrgsCancelToken);

        const userOrgsResult = await pb.collection("danusin_user_organization_roles").getList(1, 100, {
             filter: `user="${user.id}"`,
             $autoCancel: false,
             $cancelKey: userOrgsCancelToken
        });

        if (!isMountedRef.current) return;

        const roles: Record<string, string> = {};
        const orgIds: string[] = userOrgsResult.items.map((item: any) => item.organization).filter(Boolean);

        userOrgsResult.items.forEach((item: any) => {
          if (item.organization) {
            roles[item.organization] = item.role;
          }
        });

        setUserRoles(roles);

        if (orgIds.length === 0) {
          setMyOrganizations([]);
          setJoinedOrganizations([]);
          setLoading(false);
          return;
        }

        const orgsFilter = orgIds.map(id => `id="${id}"`).join("||");
        const orgsCancelToken = `orgs_list_${Date.now()}`;
        cancelTokensRef.current.push(orgsCancelToken);

        const orgsResults = await pb.collection("danusin_organization").getFullList({
             filter: orgsFilter,
             $autoCancel: false,
             $cancelKey: orgsCancelToken
        });

        if (!isMountedRef.current) return;

        const allOrgs = orgsResults as Organization[];
        const my: Organization[] = [];
        const joined: Organization[] = [];

        allOrgs.forEach(org => {
          if (org.created_by === user.id) {
            my.push(org);
          } else {
            joined.push(org);
          }
        });

        setMyOrganizations(my);
        setJoinedOrganizations(joined);

      } catch (error: any) {
         if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching organizations:", error);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }
     fetchOrganizations();
  }, [user]);

  if (loading) {
    return (
        <div className="space-y-8">
            {[1,2].map(i => (
                <Card key={i} className="dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 border-b dark:border-zinc-700/80 p-4 sm:p-6">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-48 sm:w-64" />
                           <Skeleton className="h-3 w-40 sm:w-48" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-5"><OrganizationSkeleton /></CardContent>
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
            {/* --- Bagian My Created Organizations --- */}
            <Card className="dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 shadow-lg rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-emerald-500/10">
                <CardHeader className="flex flex-row items-center justify-between border-b dark:border-zinc-700/70 p-5 sm:p-6 bg-gradient-to-r from-emerald-50 dark:from-emerald-900/30 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md">
                        <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">My Created Organizations</h2>
                        <p className="text-sm text-muted-foreground">Organizations you initiated and manage.</p>
                    </div>
                </div>
                {isDanuser && (
                    <Button asChild size="sm" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all ml-2 transform hover:scale-105 rounded-md">
                    <Link href="/dashboard/organization/new">
                        <Plus className="mr-1.5 h-4 w-4" /> New
                    </Link>
                    </Button>
                )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                {(myOrganizations.length === 0 && !loading) ? (
                    <EmptyState
                        title="No Created Organizations"
                        description="You haven't created any organizations yet. Let's start one!"
                        showButton={true}
                        icon={Building2}
                    />
                ) : (
                    <div className="space-y-6">
                    {myOrganizations.map((org) => (
                        <OrganizationItem key={org.id} org={org} role={userRoles[org.id]} />
                    ))}
                    </div>
                )}
                </CardContent>
            </Card>

            {/* --- Bagian Joined Organizations --- */}
            {(joinedOrganizations.length > 0 ) && (
                <Card className="dark:border-zinc-700/50 bg-white dark:bg-zinc-800/80 shadow-lg rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-sky-500/10">
                    <CardHeader className="border-b dark:border-zinc-700/70 p-5 sm:p-6 bg-gradient-to-r from-sky-50 dark:from-sky-900/30 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-md">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-sky-700 dark:text-sky-300">Joined Organizations</h2>
                                <p className="text-sm text-muted-foreground">Organizations you are a member of (created by others).</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="space-y-6">
                            {joinedOrganizations.map((org) => (
                                <OrganizationItem key={org.id} org={org} role={userRoles[org.id]} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    </TooltipProvider>
  )
}