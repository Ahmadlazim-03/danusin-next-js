import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

type TrendKeywordsProps = {
  keywords: {
    id: string
    name: string
  }[]
}

export function TrendKeywords({ keywords }: TrendKeywordsProps) {
  if (keywords.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-2">No keywords added yet.</p>
        <Link href="/register/keywords" className="text-green-700 hover:underline text-sm">
          Add keywords
        </Link>
      </div>
    )
  }

  return (
    <ScrollArea className="h-80">
      <div className="space-y-4">
        {keywords.map((keyword) => (
          <div key={keyword.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
            <Badge variant="outline" className="px-3 py-1">
              {keyword.name}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
