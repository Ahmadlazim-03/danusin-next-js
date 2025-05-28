"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { BadgeCheck, Loader2, Rocket, ShieldAlert } from "lucide-react"
import { useState } from "react"

type ProfilePreferencesProps = {
  user: any
}

export function ProfilePreferences({ user }: ProfilePreferencesProps) {
  const { toast } = useToast()
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications || false)
  const [marketingEmails, setMarketingEmails] = useState(user?.marketing_emails || false)
  const [isDanuser, setIsDanuser] = useState(user?.isdanuser || false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDanuserLoading, setIsDanuserLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await pb.collection("danusin_users").update(user.id, {
        email_notifications: emailNotifications,
        marketing_emails: marketingEmails,
      })

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated successfully",
      })
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDanuserStatus = async () => {
    setIsDanuserLoading(true)

    try {
      const newStatus = !isDanuser
      await pb.collection("danusin_users").update(user.id, {
        isdanuser: newStatus,
      })

      setIsDanuser(newStatus)
      toast({
        title: newStatus ? "Danuser status activated" : "Danuser status deactivated",
        description: newStatus
          ? "You now have access to organization management and additional features!"
          : "Your danuser privileges have been removed.",
        variant: newStatus ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error updating danuser status:", error)
      toast({
        title: "Status update failed",
        description: "There was an error updating your danuser status",
        variant: "destructive",
      })
    } finally {
      setIsDanuserLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Danuser Status Card - Special UI treatment */}
      <Card
        className={`p-6 border-2 ${isDanuser ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : "border-gray-300 bg-gray-50/50 dark:bg-gray-800/20"}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isDanuser ? (
                <BadgeCheck className="h-6 w-6 text-green-500" />
              ) : (
                <Rocket className="h-6 w-6 text-gray-500" />
              )}
              <h3
                className={`text-lg font-semibold ${isDanuser ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}
              >
                {isDanuser ? "Danuser Status: Active" : "Become a Danuser"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {isDanuser
                ? "You have access to organization management, catalog creation, and other advanced features."
                : "Activate danuser status to create organizations, manage catalogs, and access advanced features."}
            </p>
            {isDanuser && (
              <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <span>With great power comes great responsibility!</span>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={toggleDanuserStatus}
            disabled={isDanuserLoading}
            className={`min-w-[140px] ${
              isDanuser
                ? "bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isDanuserLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : isDanuser ? (
              "Deactivate Status"
            ) : (
              "Activate Danuser"
            )}
          </Button>
        </div>
      </Card>

      {/* Regular Preferences Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email notifications about your account activity</p>
            </div>
            <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-emails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">Receive emails about new features and promotions</p>
            </div>
            <Switch id="marketing-emails" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
