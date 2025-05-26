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
      <main className="flex h-screen items-center justify-center"> {/* Ditambahkan flex */}
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" /> {/* Diubah warna */}
      </main>
    )
  }

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1"> {/* Margin atas dikurangi */}
            Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full mt-6"> {/* Margin atas ditambah */}
        {/* --- PERUBAHAN TabsList & TabsTrigger DI SINI --- */}
        <TabsList
            className="bg-neutral-100/90 dark:bg-zinc-800/70 backdrop-blur-sm 
                       mb-6 p-1.5 border border-neutral-200/90 dark:border-zinc-700/50 
                       rounded-lg flex w-full space-x-1 sm:space-x-1.5" // Kelas dari SpecialOffers
        >
            <TabsTrigger
                value="general"
                className="py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all duration-200 flex-1 min-w-[80px] sm:min-w-[100px] whitespace-nowrap
                           text-neutral-600 hover:bg-neutral-200/70 hover:text-emerald-700
                           dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:text-emerald-300
                           data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 
                           data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:opacity-90"
            >
                General
            </TabsTrigger>
            <TabsTrigger
                value="security"
                className="py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all duration-200 flex-1 min-w-[80px] sm:min-w-[100px] whitespace-nowrap
                           text-neutral-600 hover:bg-neutral-200/70 hover:text-emerald-700
                           dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:text-emerald-300
                           data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 
                           data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:opacity-90"
            >
                Security
            </TabsTrigger>
            <TabsTrigger
                value="preferences"
                className="py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all duration-200 flex-1 min-w-[80px] sm:min-w-[100px] whitespace-nowrap
                           text-neutral-600 hover:bg-neutral-200/70 hover:text-emerald-700
                           dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:text-emerald-300
                           data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 
                           data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:opacity-90"
            >
                Preferences
            </TabsTrigger>
        </TabsList>
        {/* --- AKHIR PERUBAHAN --- */}

        {/* Card di dalam TabsContent dibuat sedikit lebih soft */}
        <TabsContent value="general">
          <Card className="bg-white dark:bg-zinc-800/60 border-neutral-200/80 dark:border-zinc-700/50 shadow-sm">
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
          <Card className="bg-white dark:bg-zinc-800/60 border-neutral-200/80 dark:border-zinc-700/50 shadow-sm">
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
          <Card className="bg-white dark:bg-zinc-800/60 border-neutral-200/80 dark:border-zinc-700/50 shadow-sm">
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