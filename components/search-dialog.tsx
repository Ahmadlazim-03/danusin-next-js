"use client"

import { useState } from "react"
import { Search, X, Tag, Clock, Gamepad2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import Link from "next/link"

export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Mock search results
  const searchResults = {
    games: [
      {
        id: 1,
        title: "Elden Ring",
        image: "/placeholder.svg?height=100&width=200",
        price: 59.99,
        tags: ["Action RPG", "Open World"],
      },
      {
        id: 2,
        title: "Baldur's Gate 3",
        image: "/placeholder.svg?height=100&width=200",
        price: 59.99,
        tags: ["RPG", "Fantasy"],
      },
      {
        id: 3,
        title: "Cyberpunk 2077",
        image: "/placeholder.svg?height=100&width=200",
        price: 29.99,
        tags: ["RPG", "Open World"],
      },
    ],
    categories: [
      { id: 1, name: "Action RPG", count: 245 },
      { id: 2, name: "Open World", count: 189 },
      { id: 3, name: "Strategy", count: 156 },
    ],
    recent: [
      { id: 1, title: "Starfield", image: "/placeholder.svg?height=100&width=200" },
      { id: 2, title: "Counter-Strike 2", image: "/placeholder.svg?height=100&width=200" },
    ],
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
            <Input
              placeholder="Search games, publishers, genres..."
              className="pl-10 pr-10 py-6 text-lg bg-zinc-800 border-zinc-700 focus-visible:ring-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-zinc-400 hover:text-white"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="all" className="mt-2">
          <TabsList className="bg-zinc-800 w-full grid grid-cols-3">
            <TabsTrigger value="all">All Results</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-6">
            {/* Recent searches */}
            {!searchQuery && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-zinc-400">Recent Searches</h3>
                  <Button variant="link" className="text-emerald-400 p-0 h-auto">
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.recent.map((item) => (
                    <Link
                      key={item.id}
                      href="#"
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 transition"
                      onClick={() => setIsOpen(false)}
                    >
                      <Clock className="h-4 w-4 text-zinc-400" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Games */}
            {searchQuery && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-zinc-400">Games</h3>
                  <Button variant="link" className="text-emerald-400 p-0 h-auto">
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {searchResults.games.map((game) => (
                    <Link
                      key={game.id}
                      href="#"
                      className="flex items-center gap-4 p-2 rounded-md hover:bg-zinc-800 transition"
                      onClick={() => setIsOpen(false)}
                    >
                      <Image
                        src={game.image || "/placeholder.svg"}
                        alt={game.title}
                        width={80}
                        height={40}
                        className="rounded-md object-cover w-20 h-12"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{game.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {game.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-zinc-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="font-bold">${game.price.toFixed(2)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {searchQuery && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-zinc-400">Categories</h3>
                  <Button variant="link" className="text-emerald-400 p-0 h-auto">
                    View All
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.categories.map((category) => (
                    <Link
                      key={category.id}
                      href="#"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-800 transition"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-zinc-400" />
                        <span>{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-zinc-700">
                        {category.count}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="games" className="mt-4">
            {searchQuery ? (
              <div className="space-y-3">
                {searchResults.games.map((game) => (
                  <Link
                    key={game.id}
                    href="#"
                    className="flex items-center gap-4 p-2 rounded-md hover:bg-zinc-800 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image
                      src={game.image || "/placeholder.svg"}
                      alt={game.title}
                      width={80}
                      height={40}
                      className="rounded-md object-cover w-20 h-12"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{game.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {game.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-zinc-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="font-bold">${game.price.toFixed(2)}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <Gamepad2 className="h-12 w-12 mb-4" />
                <p>Enter a search term to find games</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            {searchQuery ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.categories.map((category) => (
                  <Link
                    key={category.id}
                    href="#"
                    className="flex items-center justify-between p-3 rounded-md hover:bg-zinc-800 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-zinc-400" />
                      <span>{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-zinc-700">
                      {category.count}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <Tag className="h-12 w-12 mb-4" />
                <p>Enter a search term to find categories</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
