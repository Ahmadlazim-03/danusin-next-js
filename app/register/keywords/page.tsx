"use client"

import type React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase"
import { Check, Loader2, Plus, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Define types for our data
type Keyword = {
  id: string
  name: string
  created: string
}

type Catalog = {
  id: string
  name: string
  description: string
  created_by: string
  created: string
}

export default function KeywordsPage() {
  // State for user selections
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedCatalogs, setSelectedCatalogs] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // State for available options
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([])
  const [availableCatalogs, setAvailableCatalogs] = useState<Catalog[]>([])

  // State for new catalog
  const [newCatalogName, setNewCatalogName] = useState("")
  const [newCatalogDescription, setNewCatalogDescription] = useState("")
  const [isAddingCatalog, setIsAddingCatalog] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [step, setStep] = useState(1) // 1 = keywords, 2 = catalogs, 3 = review
  const [progress, setProgress] = useState(33)
  const [activeTab, setActiveTab] = useState("existing")
  const [catalogTab, setCatalogTab] = useState("existing")

  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  // Fetch available keywords and catalogs
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      setIsFetching(true)
      try {
        // Fetch available keywords
        const keywordsResult = await pb.collection("danusin_keyword").getList(1, 100, {
          sort: "-created",
        })
        setAvailableKeywords(keywordsResult.items as unknown as Keyword[])

        // Fetch available catalogs
        const catalogsResult = await pb.collection("danusin_catalog").getList(1, 100, {
          sort: "-created",
        })
        setAvailableCatalogs(catalogsResult.items as unknown as Catalog[])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error fetching data",
          description: "There was an error loading available options. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [user, router, toast])

  // Handle adding a custom keyword
  const handleAddKeyword = () => {
    if (inputValue.trim() && !selectedKeywords.includes(inputValue.trim())) {
      setSelectedKeywords([...selectedKeywords, inputValue.trim()])
      setInputValue("")
    }
  }

  // Handle keyboard input for adding keywords
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  // Handle removing a keyword
  const handleRemoveKeyword = (keyword: string) => {
    setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword))
  }

  // Handle toggling a keyword selection
  const handleToggleKeyword = (keyword: Keyword) => {
    if (selectedKeywords.includes(keyword.name)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword.name))
    } else {
      setSelectedKeywords([...selectedKeywords, keyword.name])
    }
  }

  // Handle toggling a catalog selection
  const handleToggleCatalog = (catalog: Catalog) => {
    if (selectedCatalogs.includes(catalog.id)) {
      setSelectedCatalogs(selectedCatalogs.filter((id) => id !== catalog.id))
    } else {
      setSelectedCatalogs([...selectedCatalogs, catalog.id])
    }
  }

  // Handle creating a new catalog
  const handleCreateCatalog = async () => {
    if (!newCatalogName.trim()) {
      toast({
        title: "Catalog name required",
        description: "Please enter a name for your catalog.",
        variant: "destructive",
      })
      return
    }

    setIsAddingCatalog(true)

    try {
      // Create new catalog
      const newCatalog = await pb.collection("danusin_catalog").create({
        name: newCatalogName.trim(),
        description: newCatalogDescription.trim() || `Catalog created by ${user?.name || "user"}`,
        created_by: user?.id,
      })

      // Add to available catalogs
      setAvailableCatalogs([newCatalog as unknown as Catalog, ...availableCatalogs])

      // Select the new catalog
      setSelectedCatalogs([...selectedCatalogs, newCatalog.id])

      // Reset form
      setNewCatalogName("")
      setNewCatalogDescription("")
      setIsDialogOpen(false)

      toast({
        title: "Catalog created",
        description: "Your new catalog has been created and selected.",
      })

      // Switch back to existing tab
      setCatalogTab("existing")
    } catch (error) {
      console.error("Error creating catalog:", error)
      toast({
        title: "Error creating catalog",
        description: "There was an error creating your catalog. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingCatalog(false)
    }
  }

  // Move to the next step
  const handleNextStep = async () => {
    if (step === 1 && selectedKeywords.length === 0) {
      toast({
        title: "No keywords selected",
        description: "Please select at least one keyword to continue.",
        variant: "destructive",
      })
      return
    }

    if (step === 1) {
      // Save keywords and move to catalogs step
      setIsLoading(true)

      try {
        // Save keywords to database
        for (const keyword of selectedKeywords) {
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

        // Move to catalog selection step
        setStep(2)
        setProgress(66)
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
    } else if (step === 2) {
      // Save catalog selections and move to review step
      setIsLoading(true)

      try {
        // Link user to selected catalogs
        for (const catalogId of selectedCatalogs) {
          await pb.collection("danusin_catalog_user").create({
            user_id: user?.id,
            catalog_id: catalogId,
          })
        }

        toast({
          title: "Catalogs saved",
          description: "Your catalog selections have been saved successfully.",
        })

        // Move to review step
        setStep(3)
        setProgress(100)
      } catch (error) {
        console.error("Error saving catalog selections:", error)
        toast({
          title: "Error saving catalogs",
          description: "There was an error saving your catalog selections. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Complete onboarding and go to dashboard
  const handleFinish = () => {
    router.push("/dashboard")
  }

  // Filter keywords based on search query
  const filteredKeywords = availableKeywords.filter((keyword) =>
    keyword.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter catalogs based on search query
  const filteredCatalogs = availableCatalogs.filter(
    (catalog) =>
      catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catalog.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            {step === 1
              ? "Select keywords related to your interests for trend analysis"
              : step === 2
                ? "Choose catalogs you're interested in"
                : "Review your selections before continuing"}
          </CardDescription>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {isFetching ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="ml-2 text-sm text-muted-foreground">Loading options...</span>
            </div>
          ) : step === 1 ? (
            // Step 1: Keyword Selection
            <Tabs defaultValue="existing" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Choose Existing</TabsTrigger>
                <TabsTrigger value="custom">Add Custom</TabsTrigger>
              </TabsList>
              <TabsContent value="existing" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search keywords..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {filteredKeywords.length > 0 ? (
                    <div className="space-y-2">
                      {filteredKeywords.map((keyword) => (
                        <div key={keyword.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`keyword-${keyword.id}`}
                            checked={selectedKeywords.includes(keyword.name)}
                            onCheckedChange={() => handleToggleKeyword(keyword)}
                          />
                          <Label
                            htmlFor={`keyword-${keyword.id}`}
                            className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {keyword.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No keywords found. Try a different search or add a custom keyword.
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="custom" className="space-y-4">
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
                <p className="text-xs text-muted-foreground">Add custom keywords that aren't in the existing list.</p>
              </TabsContent>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Selected Keywords</h3>
                <div className="flex flex-wrap gap-2 min-h-20 border rounded-md p-2">
                  {selectedKeywords.map((keyword) => (
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
                  {selectedKeywords.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No keywords selected yet. Select some keywords to continue.
                    </p>
                  )}
                </div>
              </div>
            </Tabs>
          ) : step === 2 ? (
            // Step 2: Catalog Selection
            <Tabs defaultValue="existing" value={catalogTab} onValueChange={setCatalogTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Choose Existing</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
              </TabsList>
              <TabsContent value="existing" className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search catalogs..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                  {filteredCatalogs.length > 0 ? (
                    <div className="space-y-3">
                      {filteredCatalogs.map((catalog) => (
                        <div key={catalog.id} className="flex items-start space-x-2 p-2 border rounded-md">
                          <Checkbox
                            id={`catalog-${catalog.id}`}
                            checked={selectedCatalogs.includes(catalog.id)}
                            onCheckedChange={() => handleToggleCatalog(catalog)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`catalog-${catalog.id}`}
                              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {catalog.name}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">{catalog.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No catalogs found. Try a different search or create a new catalog.
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="create" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catalog-name">Catalog Name</Label>
                    <Input
                      id="catalog-name"
                      placeholder="Enter catalog name"
                      value={newCatalogName}
                      onChange={(e) => setNewCatalogName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="catalog-description">Description (optional)</Label>
                    <Textarea
                      id="catalog-description"
                      placeholder="Enter catalog description"
                      value={newCatalogDescription}
                      onChange={(e) => setNewCatalogDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleCreateCatalog}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isAddingCatalog || !newCatalogName.trim()}
                  >
                    {isAddingCatalog ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Catalog
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Selected Catalogs</h3>
                <div className="flex flex-wrap gap-2 min-h-20 border rounded-md p-2">
                  {selectedCatalogs.map((catalogId) => {
                    const catalog = availableCatalogs.find((c) => c.id === catalogId)
                    return catalog ? (
                      <Badge key={catalogId} variant="secondary" className="px-3 py-1 text-sm">
                        {catalog.name}
                        <button
                          onClick={() => setSelectedCatalogs(selectedCatalogs.filter((id) => id !== catalogId))}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                  {selectedCatalogs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No catalogs selected yet. You can continue without selecting any catalogs.
                    </p>
                  )}
                </div>
              </div>
            </Tabs>
          ) : (
            // Step 3: Review
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Your Keywords</h3>
                <div className="flex flex-wrap gap-2 border rounded-md p-2">
                  {selectedKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="px-3 py-1 text-sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Your Catalogs</h3>
                <div className="flex flex-wrap gap-2 border rounded-md p-2">
                  {selectedCatalogs.map((catalogId) => {
                    const catalog = availableCatalogs.find((c) => c.id === catalogId)
                    return catalog ? (
                      <Badge key={catalogId} variant="secondary" className="px-3 py-1 text-sm">
                        {catalog.name}
                      </Badge>
                    ) : null
                  })}
                  {selectedCatalogs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No catalogs selected.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Account Type</h3>
                <Badge variant={user?.isdanuser ? "default" : "outline"} className="px-3 py-1 text-sm">
                  {user?.isdanuser ? "Danuser Account" : "Regular Account"}
                </Badge>
              </div>
              <div className="rounded-md bg-green-50 p-4 border border-green-100">
                <p className="text-sm text-green-800">
                  {user?.isdanuser
                    ? "As a Danuser, you can create organizations, manage catalogs, and add products."
                    : "As a regular user, you can browse organizations and catalogs."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {step < 3 ? (
            <Button
              onClick={handleNextStep}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading || (step === 1 && selectedKeywords.length === 0)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {step === 1 ? "Saving keywords..." : "Saving catalogs..."}
                </>
              ) : (
                "Continue"
              )}
            </Button>
          ) : (
            <Button onClick={handleFinish} className="w-full bg-green-600 hover:bg-green-700">
              <Check className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
