"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { MoreHorizontal, Plus, UserPlus } from "lucide-react"
import { useEffect, useState } from "react"

type Member = {
  id: string
  user: any
  role: string
  created: string
}

export function OrganizationMembersList({
  organizationId,
  userRole,
}: { organizationId: string; userRole: string | null }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  const isAdmin = userRole === "admin"

  useEffect(() => {
    let isMounted = true

    const fetchMembers = async () => {
      try {
        const result = await pb.collection("danusin_user_organization_roles").getList(1, 100, {
          filter: `organization="${organizationId}"`,
          expand: "user",
        })

        if (!isMounted) return

        // Transform the data to include user details
        const membersData = result.items.map((item: any) => ({
          id: item.id,
          user: item.expand?.user || { id: item.user },
          role: item.role,
          created: item.created,
        }))

        setMembers(membersData)
      } catch (error: any) {
        // Check if this is an auto-cancellation error (can be ignored)
        if (error.name !== "AbortError" && error.message !== "The request was autocancelled") {
          console.error("Error fetching members:", error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchMembers()

    return () => {
      isMounted = false
    }
  }, [organizationId])

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setIsInviting(true)

    try {
      // In a real app, you would send an invitation email
      // For now, we'll just create a placeholder user and add them to the organization

      // Check if user exists
      let user
      try {
        user = await pb.collection("users").getFirstListItem(`email="${inviteEmail}"`)
      } catch (error) {
        // User doesn't exist
        toast({
          title: "Error",
          description: "User with this email doesn't exist",
          variant: "destructive",
        })
        setIsInviting(false)
        return
      }

      // Check if user is already a member
      try {
        await pb
          .collection("danusin_user_organization_roles")
          .getFirstListItem(`user="${user.id}" && organization="${organizationId}"`)

        toast({
          title: "Error",
          description: "User is already a member of this organization",
          variant: "destructive",
        })
        setIsInviting(false)
        return
      } catch (error) {
        // User is not a member, which is what we want
      }

      // Add user to organization
      const newMember = await pb.collection("danusin_user_organization_roles").create({
        user: user.id,
        organization: organizationId,
        role: inviteRole,
      })

      // Add the new member to the list
      setMembers([
        ...members,
        {
          id: newMember.id,
          user: user,
          role: newMember.role,
          created: newMember.created,
        },
      ])

      toast({
        title: "Success",
        description: `${inviteEmail} has been added to the organization`,
      })

      setInviteEmail("")
      setInviteRole("member")
      setIsInviteDialogOpen(false)
    } catch (error) {
      console.error("Error inviting member:", error)
      toast({
        title: "Error",
        description: "Failed to invite member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await pb.collection("danusin_user_organization_roles").update(memberId, {
        role: newRole,
      })

      // Update the member in the list
      setMembers(members.map((member) => (member.id === memberId ? { ...member, role: newRole } : member)))

      toast({
        title: "Success",
        description: "Member role updated successfully",
      })
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await pb.collection("danusin_user_organization_roles").delete(memberId)

      // Remove the member from the list
      setMembers(members.filter((member) => member.id !== memberId))

      toast({
        title: "Success",
        description: "Member removed from organization",
      })
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a New Member</DialogTitle>
                <DialogDescription>
                  Add a new member to your organization. They will receive an email invitation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleInviteMember} disabled={isInviting}>
                  {isInviting ? "Inviting..." : "Invite Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <UserPlus className="mb-4 h-16 w-16 text-muted-foreground/60" />
          <h3 className="mb-1 text-lg font-medium">No members yet</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Invite members to collaborate in this organization.
          </p>
          {isAdmin && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsInviteDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.user.avatar || "/placeholder.svg"} alt={member.user.name || "User"} />
                  <AvatarFallback>{(member.user.name || "U").charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.user.name || "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={member.role === "admin" ? "default" : member.role === "moderator" ? "secondary" : "outline"}
                >
                  {member.role}
                </Badge>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "moderator")}>
                        Make Moderator
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => handleRemoveMember(member.id)}>
                        Remove from Organization
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
