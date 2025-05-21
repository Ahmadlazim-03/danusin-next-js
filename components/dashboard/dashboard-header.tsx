"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function DashboardHeader() {
  const { user, isDanuser } = useAuth()

  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || "User"}!</p>
      </div>
      <div>
        {isDanuser && (
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/organizations/new">Create Organization</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
