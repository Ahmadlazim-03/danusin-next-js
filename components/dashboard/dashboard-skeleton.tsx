import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-5 w-[100px] dark:bg-zinc-800" />
            <Skeleton className="h-4 w-4 rounded-full dark:bg-zinc-800" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px] mb-2 dark:bg-zinc-800" />
            <Skeleton className="h-4 w-[180px] dark:bg-zinc-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
