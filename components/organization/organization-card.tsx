import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import Image from "next/image"

type OrganizationCardProps = {
  organization: {
    id: string
    organization_name: string
    organization_description: string
    organization_image: string
    organization_slug: string
    target: number
    target_progress: number
  }
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const progressPercentage = Math.min(Math.round((organization.target_progress / organization.target) * 100), 100)

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-green-100">
      <div className="aspect-video relative">
        <Image
          src={organization.organization_image || "/placeholder.svg?height=200&width=400"}
          alt={organization.organization_name}
          fill
          className="object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <Link
          href={`/organizations/${organization.organization_slug}`}
          className="text-xl font-semibold hover:text-green-700 transition-colors"
        >
          {organization.organization_name}
        </Link>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-muted-foreground line-clamp-2 text-sm mb-4">{organization.organization_description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fundraising Goal</span>
            <span className="font-medium">${organization.target.toLocaleString()}</span>
          </div>
          <ProgressBar value={progressPercentage} />
          <div className="flex justify-between text-sm">
            <span className="text-green-700 font-medium">${organization.target_progress.toLocaleString()} raised</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={`/organizations/${organization.organization_slug}`}
          className="text-green-700 text-sm font-medium hover:underline w-full text-center"
        >
          View Organization
        </Link>
      </CardFooter>
    </Card>
  )
}
