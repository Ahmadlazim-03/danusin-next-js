"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { Loader2 } from "lucide-react"
import { useState } from "react"

// Use the correct collection name
const USERS_COLLECTION = "danusin_users"

type ProfilePreferencesProps = {
  user: any
}

export function ProfilePreferences({ user }: ProfilePreferencesProps) {
  const { toast } = useToast()
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications || false)
  const [marketingEmails, setMarketingEmails] = useState(user?.marketing_emails || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await pb.collection(USERS_COLLECTION).update(user.id, {
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

  return (
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
  )
}
