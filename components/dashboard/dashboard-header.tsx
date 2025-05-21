"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function DashboardHeader() {
  const { user, isDanuser } = useAuth()

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || "User"}!</p>
      </div>
      <div className="flex items-center gap-2">
        {isDanuser ? (
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/organizations/new">Create Organization</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
            <Link href="/upgrade">Upgrade to Danuser</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
