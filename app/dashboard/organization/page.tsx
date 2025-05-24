"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { OrganizationsList } from "@/components/dashboard/organizations-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Building2, Plus, Rocket } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function OrganizationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const isDanuser = user?.isdanuser === true

  // If user is not a danuser, show the upgrade prompt
  if (!isDanuser) {
    return (
      <main className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage your organizations</p>
        </div>

        <Card className="p-8 border-2 border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900/50">
          <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
              Become a Danuser to Create Organizations
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              As a Danuser, you'll be able to create and manage organizations, collaborate with team members, and access
              advanced features like catalog management and analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button
                onClick={() => router.push("/dashboard/profile/preferences")}
                className="bg-green-600 hover:bg-green-700 gap-2"
                size="lg"
              >
                <Rocket className="h-4 w-4" />
                Join to be Danuser now!
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")} size="lg">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </main>
    )
  }

  // Regular view for danusers
  return (
    <main className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage your organizations</p>
        </div>
        <div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/organizations/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Link>
          </Button>
        </div>
      </div>

      {/* Display the organizations list */}
      <OrganizationsList showEmpty={true} />
    </main>
  )
}
