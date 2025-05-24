import { OrganizationsList } from "@/components/dashboard/organizations-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function OrganizationsPage() {
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
