import Image from "next/image"
import Link from "next/link"
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  Award,
  Tag,
  Percent,
  Flame,
  TrendingUp,
  Trophy,
  Sparkles,
  Gamepad2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SearchDialog } from "@/components/search-dialog"
import { MobileMenu } from "@/components/mobile-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { AnimatedBackground } from "@/components/animated-background"
import { HeroCarousel } from "@/components/hero-carousel"
import { GameCard } from "@/components/game-card"
import { SpecialOfferCard } from "@/components/special-offer-card"
import { CategoryCard } from "@/components/category-card"

export default function Home() {
  // Game data
  const featuredGames = [
    {
      title: "Elden Ring",
      price: 59.99,
      discount: 0,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["Action RPG", "Souls-like", "Open World"],
      rating: 4.9,
      players: "87,432",
    },
    {
      title: "Baldur's Gate 3",
      price: 59.99,
      discount: 0,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["RPG", "Turn-Based", "Fantasy"],
      rating: 4.8,
      players: "65,219",
    },
    {
      title: "Cyberpunk 2077",
      price: 59.99,
      discount: 50,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["RPG", "Open World", "Sci-Fi"],
      rating: 4.5,
      players: "42,876",
    },
    {
      title: "Starfield",
      price: 69.99,
      discount: 15,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["RPG", "Space", "Open World"],
      rating: 4.3,
      players: "56,789",
    },
  ]

  const specialOffers = [
    {
      title: "Electronic Arts Publisher Sale",
      discount: "Up to 95% OFF",
      image: "/placeholder.svg?height=300&width=600",
      endDate: "May 5",
      gradient: "from-purple-500 to-blue-500",
    },
    {
      title: "Spring in the Shire",
      discount: "Up to 90% OFF",
      image: "/placeholder.svg?height=300&width=600",
      endDate: "May 5",
      gradient: "from-green-500 to-yellow-500",
    },
    {
      title: "Subsistence",
      discount: "35% OFF",
      image: "/placeholder.svg?height=300&width=600",
      endDate: "Today's Deal",
      gradient: "from-red-500 to-orange-500",
    },
  ]

  const categories = [
    { name: "Action", icon: <Zap className="h-8 w-8" />, color: "from-red-500 to-orange-500" },
    { name: "Adventure", icon: <Gamepad2 className="h-8 w-8" />, color: "from-emerald-500 to-teal-500" },
    { name: "RPG", icon: <Award className="h-8 w-8" />, color: "from-purple-500 to-indigo-500" },
    { name: "Strategy", icon: <ChevronDown className="h-8 w-8" />, color: "from-blue-500 to-cyan-500" },
    { name: "Simulation", icon: <Tag className="h-8 w-8" />, color: "from-amber-500 to-yellow-500" },
    { name: "Sports", icon: <Trophy className="h-8 w-8" />, color: "from-green-500 to-lime-500" },
  ]

  const updatedGames = [
    {
      title: "Apex Legends",
      update: "Season 20",
      price: 0,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["FPS", "Battle Royale", "Multiplayer"],
      rating: 4.6,
      players: "254,789",
    },
    {
      title: "Destiny 2",
      update: "The Final Shape",
      price: 29.99,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["FPS", "MMO", "Sci-Fi"],
      rating: 4.4,
      players: "132,456",
    },
    {
      title: "Path of Exile",
      update: "Affliction League",
      price: 0,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["ARPG", "Free to Play", "Multiplayer"],
      rating: 4.7,
      players: "87,321",
    },
    {
      title: "Counter-Strike 2",
      update: "Operation Wildfire",
      price: 0,
      image: "/placeholder.svg?height=300&width=600",
      tags: ["FPS", "Competitive", "Multiplayer"],
      rating: 4.8,
      players: "876,543",
    },
  ]

  const liveStreams = [
    {
      title: "Elden Ring - First Playthrough",
      streamer: "GameMaster64",
      viewers: "12,456",
      image: "/placeholder.svg?height=300&width=600",
    },
    {
      title: "CS2 - Competitive Matches",
      streamer: "ProGamer123",
      viewers: "8,932",
      image: "/placeholder.svg?height=300&width=600",
    },
    {
      title: "Baldur's Gate 3 - Tactician Mode",
      streamer: "RPGLover",
      viewers: "5,678",
      image: "/placeholder.svg?height=300&width=600",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 text-white">
      <AnimatedBackground />

      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative w-8 h-8 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 group-hover:from-emerald-400 group-hover:to-cyan-400 transition-all duration-300">
                  <Image
                    src="/placeholder.svg?height=32&width=32"
                    alt="Steam Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8 scale-90 group-hover:scale-100 transition-transform duration-300"
                  />
                </div>
                <span className="font-bold text-xl tracking-tight group-hover:text-emerald-400 transition-colors duration-300">
                  STEAM
                </span>
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="#"
                  className="text-white hover:text-emerald-400 font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all after:duration-300"
                >
                  Store
                </Link>
                <Link
                  href="#"
                  className="text-zinc-400 hover:text-white font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all after:duration-300"
                >
                  Library
                </Link>
                <Link
                  href="#"
                  className="text-zinc-400 hover:text-white font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all after:duration-300"
                >
                  Community
                </Link>
                <Link
                  href="#"
                  className="text-zinc-400 hover:text-white font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all after:duration-300"
                >
                  News
                </Link>
                <Link
                  href="#"
                  className="text-zinc-400 hover:text-white font-medium transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all after:duration-300"
                >
                  Support
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block w-64 group">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-emerald-400 transition-colors duration-300" />
                <Input
                  placeholder="Search games, publishers..."
                  className="pl-8 bg-zinc-800/50 border-zinc-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 transition-all duration-300"
                />
              </div>
              <SearchDialog />
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white relative group">
                <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-medium text-white">
                  3
                </span>
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white group">
                <Heart className="h-5 w-5 group-hover:scale-110 group-hover:text-rose-500 transition-all duration-300" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white relative group">
                <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-medium text-white">
                  2
                </span>
              </Button>
              <ThemeToggle />
              <Avatar className="h-8 w-8 border border-zinc-700 ring-2 ring-emerald-500/20 hover:ring-emerald-500/50 transition-all duration-300">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500">US</AvatarFallback>
              </Avatar>
              <MobileMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="space-y-6 sticky top-24">
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50">
                <h3 className="font-medium text-emerald-400 mb-3 flex items-center">
                  <Flame className="mr-2 h-4 w-4" />
                  DISCOVER
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="flex items-center text-white hover:text-emerald-400 transition-colors duration-300 group"
                    >
                      <Zap className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>New & Noteworthy</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <Award className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>Top Sellers</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <Clock className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>Upcoming</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <Percent className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>Special Offers</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <Gamepad2 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>VR Games</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50">
                <h3 className="font-medium text-emerald-400 mb-3 flex items-center">
                  <Tag className="mr-2 h-4 w-4" />
                  CATEGORIES
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="flex items-center justify-between text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <span>Action</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center justify-between text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <span>Adventure</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center justify-between text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <span>RPG</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center justify-between text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <span>Strategy</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="flex items-center justify-between text-zinc-400 hover:text-white transition-colors duration-300 group"
                    >
                      <span>Simulation</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </li>
                  <li>
                    <Button
                      variant="link"
                      className="text-emerald-400 p-0 h-auto hover:text-emerald-300 transition-colors duration-300"
                    >
                      View all categories
                    </Button>
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50">
                <h3 className="font-medium text-emerald-400 mb-3 flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  TRENDING TAGS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Open World", "RPG", "Souls-like", "FPS", "Multiplayer", "Roguelike", "Survival"].map(
                    (tag, index) => (
                      <Badge
                        key={index}
                        className="bg-zinc-700/50 hover:bg-emerald-500 transition-colors duration-300 cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Hero Carousel */}
            <section className="mb-6 md:mb-10">
              <HeroCarousel />
            </section>

            {/* Featured & Recommended */}
            <section className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
                  Featured & Recommended
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500 transition-all duration-300"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {featuredGames.map((game, index) => (
                  <GameCard key={index} game={game} />
                ))}
              </div>
            </section>

            {/* Special Offers */}
            <section className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center">
                  <Percent className="mr-2 h-5 w-5 text-emerald-400" />
                  Special Offers
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500 transition-all duration-300"
                >
                  View All
                </Button>
              </div>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-zinc-800/50 backdrop-blur-sm mb-4 md:mb-6 p-1 border border-zinc-700/50 rounded-lg overflow-x-auto flex w-full">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-md transition-all duration-300 flex-1"
                  >
                    All Deals
                  </TabsTrigger>
                  <TabsTrigger
                    value="weekend"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-md transition-all duration-300 flex-1"
                  >
                    Weekend
                  </TabsTrigger>
                  <TabsTrigger
                    value="publisher"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-md transition-all duration-300 flex-1"
                  >
                    Publisher
                  </TabsTrigger>
                  <TabsTrigger
                    value="seasonal"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-md transition-all duration-300 flex-1"
                  >
                    Seasonal
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {specialOffers.map((deal, index) => (
                      <SpecialOfferCard key={index} deal={deal} />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="weekend" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Weekend deals content */}
                    <SpecialOfferCard
                      deal={{
                        title: "Spring in the Shire",
                        discount: "Up to 90% OFF",
                        image: "/placeholder.svg?height=300&width=600",
                        endDate: "May 5",
                        gradient: "from-green-500 to-yellow-500",
                      }}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="publisher" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Publisher sales content */}
                    <SpecialOfferCard
                      deal={{
                        title: "Electronic Arts Publisher Sale",
                        discount: "Up to 95% OFF",
                        image: "/placeholder.svg?height=300&width=600",
                        endDate: "May 5",
                        gradient: "from-purple-500 to-blue-500",
                      }}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="seasonal" className="mt-0">
                  {/* Seasonal content */}
                  <div className="p-8 text-center text-zinc-400 bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-zinc-700/50">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-emerald-400 opacity-50" />
                    <p className="text-lg">No active seasonal sales at the moment.</p>
                    <p className="mt-2">Check back soon for our Summer Sale!</p>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* Categories Browse */}
            <section className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-emerald-400" />
                  Browse by Category
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {categories.map((category, index) => (
                  <CategoryCard key={index} category={category} />
                ))}
              </div>
            </section>

            {/* Recently Updated */}
            <section className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-emerald-400" />
                  Recently Updated
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500 transition-all duration-300"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {updatedGames.map((game, index) => (
                  <GameCard key={index} game={game} />
                ))}
              </div>
            </section>

            {/* Live Streams */}
            <section className="mb-6 md:mb-10">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold flex items-center">
                  <Flame className="mr-2 h-5 w-5 text-emerald-400" />
                  Live Streams
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500 transition-all duration-300"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {liveStreams.map((stream, index) => (
                  <div key={index} className="group relative">
                    <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-lg overflow-hidden transition-all duration-300 group-hover:border-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                      <div className="aspect-video relative overflow-hidden">
                        <Image
                          src={stream.image || "/placeholder.svg"}
                          alt={stream.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-2">
                          <Badge className="bg-red-600 flex items-center gap-1">
                            <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                            LIVE
                          </Badge>
                          <Badge className="bg-zinc-800/80 backdrop-blur-sm">{stream.viewers} viewers</Badge>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <Button className="m-3 bg-emerald-500 hover:bg-emerald-600 transition-colors duration-300">
                            Watch Stream
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 group-hover:text-emerald-400 transition-colors duration-300">
                          {stream.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-zinc-700">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs">
                              {stream.streamer.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-zinc-300">{stream.streamer}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      <footer className="bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800/50 mt-8 md:mt-12 py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <h3 className="font-bold mb-4 text-emerald-400">ABOUT STEAM</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Jobs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Steam Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Steam Distribution
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Gift Cards
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-emerald-400">STORE</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Discovery Queue
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    News
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Stats
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-emerald-400">COMMUNITY</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Discussions
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Workshop
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Market
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Broadcasts
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-emerald-400">SUPPORT</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Help
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Steam Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white transition-colors duration-300">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-zinc-500">
            <p>
              © 2024 Valve Corporation. All rights reserved. All trademarks are property of their respective owners in
              the US and other countries.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
