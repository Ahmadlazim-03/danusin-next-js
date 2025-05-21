"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { pb } from "@/lib/pocketbase"
import { X } from "lucide-react"

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  const handleAddKeyword = () => {
    if (inputValue.trim() && !keywords.includes(inputValue.trim())) {
      setKeywords([...keywords, inputValue.trim()])
      setInputValue("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleSubmit = async () => {
    if (keywords.length === 0) {
      toast({
        title: "No keywords selected",
        description: "Please add at least one keyword to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Save keywords to database
      for (const keyword of keywords) {
        // Check if keyword exists
        let keywordRecord
        try {
          keywordRecord = await pb.collection("danusin_keyword").getFirstListItem(`name="${keyword}"`)
        } catch (error) {
          // Create new keyword if it doesn't exist
          keywordRecord = await pb.collection("danusin_keyword").create({
            name: keyword,
            created_by: user?.id,
          })
        }

        // Link keyword to user
        await pb.collection("danusin_keyword_user").create({
          user_id: user?.id,
          keyword_id: keywordRecord.id,
        })
      }

      toast({
        title: "Keywords saved",
        description: "Your interests have been saved successfully.",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving keywords:", error)
      toast({
        title: "Error saving keywords",
        description: "There was an error saving your interests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Select Your Interests</CardTitle>
          <CardDescription className="text-center">
            Add keywords related to your interests for trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Add a keyword (e.g., technology, fashion)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleAddKeyword} type="button" className="bg-green-600 hover:bg-green-700">
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-20">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="px-3 py-1 text-sm">
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {keywords.length === 0 && (
              <p className="text-sm text-muted-foreground">No keywords added yet. Add some keywords to continue.</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isLoading || keywords.length === 0}
          >
            {isLoading ? "Saving..." : "Continue to Dashboard"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
