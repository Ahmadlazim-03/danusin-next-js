"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { ProfileForm } from "@/components/profile/profile-form"
import { ProfilePreferences } from "@/components/profile/profile-preferences"
import { ProfileSecurity } from "@/components/profile/profile-security"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setIsLoading(false)
    }
  }, [user])

  if (isLoading) {
    return (
      <main className=" h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </main>
    )
  }

  return (
    <main >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-5">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full mt-5">
        <TabsList className="mb-8 grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSecurity user={user} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Manage your notification and display preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfilePreferences user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
