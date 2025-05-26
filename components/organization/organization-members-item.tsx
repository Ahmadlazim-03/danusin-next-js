"use client"

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { pb } from "@/lib/pocketbase";
import { MoreHorizontal, ShieldCheck, UserCog, UserCircle, Trash2, MapPin, PhoneCall, Info, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Link from "next/link";

// Tipe data yang diterima oleh komponen ini
type OtherOrganizationInfo = {
  id: string;
  name: string;
  organization_slug?: string;
};

type UserData = {
    id: string;
    collectionId: string;
    collectionName: string;
    name?: string;
    email?: string;
    avatar?: string;
    username?: string;
    bio?: string;
    location_address?: string;
    phone?: string;
    otherOrganizations?: OtherOrganizationInfo[] | null;
};

type Member = {
  id: string; // ID dari record danusin_user_organization_roles
  user: UserData;
  role: string; // Role dari member ini dalam organisasi
  // created: string; // Tidak digunakan di item, bisa dihilangkan jika tidak perlu
};

interface OrganizationMemberItemProps {
    member: Member;
    loggedInUserRole: string | null; // Role dari user yang sedang melihat halaman
    currentUserId: string | undefined; // ID user yang sedang login
    onUpdateRole: (memberId: string, newRole: string) => Promise<void>;
    onRemoveMember: (memberId: string) => Promise<void>;
}

export function OrganizationMemberItem({
    member,
    loggedInUserRole,
    currentUserId,
    onUpdateRole,
    onRemoveMember
}: OrganizationMemberItemProps) {
  const userAvatar = member.user && member.user.avatar && member.user.collectionId && member.user.collectionName
    ? pb.getFileUrl(member.user, member.user.avatar, { thumb: '100x100' })
    : "/placeholder-avatar.png"; // Pastikan placeholder ada di public

  const currentMemberRoleDisplay = member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member';

  let roleIcon = <UserCircle className="h-4 w-4 flex-shrink-0" />;
  let roleBadgeClass = "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700";

  if (member.role === "admin") {
      roleIcon = <ShieldCheck className="h-4 w-4 flex-shrink-0" />;
      roleBadgeClass = "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/60 dark:text-red-300 dark:border-red-700/70 dark:hover:bg-red-800/70";
  } else if (member.role === "moderator") {
      roleIcon = <UserCog className="h-4 w-4 flex-shrink-0" />;
      roleBadgeClass = "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700/70 dark:hover:bg-blue-800/70";
  }

  const isSelf = member.user.id === currentUserId;
  const viewerIsAdmin = loggedInUserRole === "admin";
  const viewerIsModerator = loggedInUserRole === "moderator";

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 hover:bg-muted/40 dark:hover:bg-zinc-800/50 transition-colors first:rounded-t-lg last:rounded-b-lg cursor-pointer">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
                <Avatar className="h-11 w-11 border-2 border-transparent group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                    <AvatarImage src={userAvatar} alt={member.user.name || "User"} />
                    <AvatarFallback className="text-sm font-medium">{(member.user.name || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="text-md font-medium text-foreground truncate" title={member.user.name || "Unknown User"}>
                        {member.user.name || "Unknown User"} {isSelf && <span className="text-xs text-muted-foreground">(You)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground truncate" title={member.user.email}>
                        {member.user.email}
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end mt-3 sm:mt-0 flex-shrink-0">
                {/* TooltipProvider bisa dipindahkan ke level lebih tinggi (misal di OrganizationMembersList) jika banyak tooltip */}
                <TooltipProvider delayDuration={200}> 
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge className={cn("capitalize text-xs px-3 py-1.5 h-fit tracking-wide flex items-center gap-1.5 shadow-sm border cursor-help rounded-md", roleBadgeClass)}>
                                {roleIcon}
                                <span className="whitespace-nowrap">{member.role}</span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="bg-foreground text-background rounded-md shadow-lg">
                            <p>{currentMemberRoleDisplay} of the organization</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                {!isSelf && (viewerIsAdmin || (viewerIsModerator && member.role === "member")) && ( // Kondisi diperjelas
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/70 dark:hover:bg-zinc-700/80">
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="sr-only">Actions</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-lg">
                        {viewerIsAdmin && (
                            <>
                                <DropdownMenuItem onSelect={() => onUpdateRole(member.id, "admin")} disabled={member.role === 'admin'} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-red-500"/> Make Admin</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onUpdateRole(member.id, "moderator")} disabled={member.role === 'moderator'} className="flex items-center gap-2"><UserCog className="h-4 w-4 text-blue-500"/> Make Moderator</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onUpdateRole(member.id, "member")} disabled={member.role === 'member'} className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-slate-500"/> Make Member</DropdownMenuItem>
                            </>
                        )}
                        {viewerIsModerator && member.role !== 'admin' && member.role !== 'moderator' && member.role === 'member' && ( // Moderator hanya bisa demote dirinya sendiri (jika rule berubah) atau member lain jadi member
                             <DropdownMenuItem onSelect={() => onUpdateRole(member.id, "member")} disabled={member.role === 'member'} className="flex items-center gap-2"> 
                                <UserCircle className="h-4 w-4 text-slate-500"/> Make Member (from Mod)
                            </DropdownMenuItem>
                        )}
                      
                        {(viewerIsAdmin || (viewerIsModerator && member.role === 'member')) && <DropdownMenuSeparator />}
                        {(viewerIsAdmin || (viewerIsModerator && member.role === 'member')) && 
                            <DropdownMenuItem 
                                className="!text-red-500 hover:!bg-red-500/10 focus:!bg-red-500/10 focus:!text-red-500 flex items-center gap-2" 
                                onSelect={() => onRemoveMember(member.id)}
                            >
                                <Trash2 className="h-4 w-4"/> Remove Member
                            </DropdownMenuItem>
                        }
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
            </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 sm:w-96 bg-card shadow-xl rounded-xl p-5 border" side="top" align="center">
        <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm flex-shrink-0">
                <AvatarImage src={userAvatar} alt={member.user.name || "User"} />
                <AvatarFallback className="text-xl font-semibold">
                    {(member.user.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-foreground truncate" title={member.user.name || "Unknown User"}>{member.user.name || "Unknown User"}</h4>
                <p className="text-sm text-muted-foreground truncate" title={member.user.email || "No email provided"}>{member.user.email || "No email"}</p>
                {member.user.username && <p className="text-xs text-muted-foreground">@{member.user.username}</p>}
            </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-border">
            <h5 className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider flex items-center"><Info className="w-3.5 h-3.5 mr-1.5"/> Bio</h5>
            <p className="text-sm text-foreground/90 leading-snug line-clamp-3">
                {member.user.bio || "-"}
            </p>
        </div>
        
        <div className="mt-4 pt-3 border-t border-border space-y-3 text-sm">
            <div>
                <h5 className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Contact Info</h5>
                <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground">
                        <MapPin className={`mr-2.5 h-4 w-4 flex-shrink-0 ${member.user.location_address ? 'text-sky-500' : 'text-muted-foreground/70'}`} />
                        <span className="truncate" title={member.user.location_address || "-"}>{member.user.location_address || "-"}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <PhoneCall className={`mr-2.5 h-4 w-4 flex-shrink-0 ${member.user.phone ? 'text-green-500' : 'text-muted-foreground/70'}`} />
                        <span className="truncate" title={member.user.phone || "-"}>{member.user.phone || "-"}</span>
                    </div>
                </div>
            </div>

            {member.user.otherOrganizations && member.user.otherOrganizations.length > 0 && (
                <div className="pt-3 border-t border-border mt-3">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-500"/> Also Member Of
                    </h5>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {member.user.otherOrganizations.map(org => (
                            <Link
                                href={`/organizations/${org.organization_slug || org.id}`}
                                key={org.id}
                                className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate p-0.5 rounded hover:bg-muted/50 dark:hover:bg-zinc-700/50"
                                title={org.name}
                            >
                                {org.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
        {!member.user.bio && !member.user.location_address && !member.user.phone && (!member.user.otherOrganizations || member.user.otherOrganizations.length === 0) && (
             <p className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground italic">No additional information available for this user.</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}