"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { pb } from "@/lib/pocketbase"
import { useAuth } from "@/components/auth/auth-provider"
import { TrendChart } from "@/components/trend/trend-chart"
import { TrendKeywords } from "@/components/trend/trend-keywords"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

type Trend = {
  id: string
  category: string
  keyword: string
  value: number
  date: string
  region: string
  related_keywords: any
  related_topics: any
}

type UserKeyword = {
  id: string
  name: string
}

export default function TrendsPage() {
  const { user, isDanuser } = useAuth()
  const [trends, setTrends] = useState<Trend[]>([])
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserKeywordsAndTrends() {
      if (!user || !isDanuser) {
        setError("Only danusers can access trend analysis.")
        setLoading(false)
        return
      }

      try {
        // Fetch user's keywords
        const keywordUserRecords = await pb.collection("danusin_keyword_user").getList(1, 50, {
          filter: `user_id="${user.id}"`,
          expand: "keyword_id",
        })

        const keywords = keywordUserRecords.items
          .map((item: any) => ({
            id: item.expand?.keyword_id?.id,
            name: item.expand?.keyword_id?.name,
          }))
          .filter(Boolean)

        setUserKeywords(keywords)

        // Fetch trends for these keywords
        if (keywords.length > 0) {
          const keywordNames = keywords.map((k) => k.name)
          const trendsResult = await pb.collection("danusin_trends").getList(1, 100, {
            filter: keywordNames.map((k) => `keyword="${k}"`).join(" || "),
            sort: "-date",
          })

          setTrends(trendsResult.items as unknown as Trend[])
        }
      } catch (error) {
        console.error("Error fetching trends:", error)
        setError("Failed to load trend data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserKeywordsAndTrends()
  }, [user, isDanuser])

  if (!isDanuser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Trend Analysis</h1>
          <p className="text-muted-foreground">Analyze trends related to your keywords</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Trend analysis is only available to danusers. Please upgrade your account to access this feature.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Trend Analysis</h1>
        <p className="text-muted-foreground">Analyze trends related to your keywords</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trend Overview</CardTitle>
            <CardDescription>Popularity of your keywords over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : trends.length > 0 ? (
              <TrendChart trends={trends} />
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">No trend data available for your keywords.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Keywords</CardTitle>
            <CardDescription>Keywords you're tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <TrendKeywords keywords={userKeywords} />
            )}
          </CardContent>
        </Card>
      </div>

      {!loading && trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Topics & Keywords</CardTitle>
            <CardDescription>Discover related topics and keywords to expand your reach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Related Topics</h3>
                <ul className="space-y-2">
                  {trends[0]?.related_topics ? (
                    Object.entries(trends[0].related_topics)
                      .slice(0, 10)
                      .map(([topic, value]: [string, any]) => (
                        <li key={topic} className="flex items-center justify-between">
                          <span className="text-sm">{topic}</span>
                          <span className="text-sm text-muted-foreground">{value.toFixed(2)}</span>
                        </li>
                      ))
                  ) : (
                    <li className="text-muted-foreground">No related topics available</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Related Keywords</h3>
                <ul className="space-y-2">
                  {trends[0]?.related_keywords ? (
                    Object.entries(trends[0].related_keywords)
                      .slice(0, 10)
                      .map(([keyword, value]: [string, any]) => (
                        <li key={keyword} className="flex items-center justify-between">
                          <span className="text-sm">{keyword}</span>
                          <span className="text-sm text-muted-foreground">{value.toFixed(2)}</span>
                        </li>
                      ))
                  ) : (
                    <li className="text-muted-foreground">No related keywords available</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
