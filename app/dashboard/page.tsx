
import { HeroCarousel } from "@/components/hero-carousel";
import { Categories } from "@/components/newdashboard/Categories";
import { FeaturedGames } from "@/components/newdashboard/FeaturedGames";
import { LiveStreams } from "@/components/newdashboard/LiveStream";
import { RecentlyUpdated } from "@/components/newdashboard/RecentlyUpdated";
import { SpecialOffers } from "@/components/newdashboard/SpecialOffers";
import { Award, ChevronDown, Gamepad2, Tag, Trophy, Zap } from "lucide-react";

export default function Home() {
  const featuredGames = [
    {
      title: "Elden Ring",
      price: 59.99,
      discount: 0,
      image: "https://shanibacreative.com/wp-content/uploads/2023/10/jenis-foto-landscape.jpg",
      tags: ["Action RPG", "Souls-like", "Open World"],
      rating: 4.9,
      players: "87,432",
    },
    {
      title: "Baldur's Gate 3",
      price: 59.99,
      discount: 0,
      image: "https://www.markdesign.net/images/blog/resize_755_2000/6542a-82.jpg",
      tags: ["RPG", "Turn-Based", "Fantasy"],
      rating: 4.8,
      players: "65,219",
    },
    {
      title: "Cyberpunk 2077",
      price: 59.99,
      discount: 50,
      image: "https://media.greatbigphotographyworld.com/wp-content/uploads/2022/04/Portrait-vs-Landscape-Featured-Image-3.jpg",
      tags: ["RPG", "Open World", "Sci-Fi"],
      rating: 4.5,
      players: "42,876",
    },
    {
      title: "Starfield",
      price: 69.99,
      discount: 15,
      image: "https://reflectionphotography.co.id/wp-content/uploads/2024/05/pengertian-foto-landscape.jpg",
      tags: ["RPG", "Space", "Open World"],
      rating: 4.3,
      players: "56,789",
    },
     {
      title: "Starfield",
      price: 69.99,
      discount: 15,
      image: "https://reflectionphotography.co.id/wp-content/uploads/2024/05/pengertian-foto-landscape.jpg",
      tags: ["RPG", "Space", "Open World"],
      rating: 4.3,
      players: "56,789",
    },
     {
      title: "Starfield",
      price: 69.99,
      discount: 15,
      image: "https://reflectionphotography.co.id/wp-content/uploads/2024/05/pengertian-foto-landscape.jpg",
      tags: ["RPG", "Space", "Open World"],
      rating: 4.3,
      players: "56,789",
    },
     {
      title: "Starfield",
      price: 69.99,
      discount: 15,
      image: "https://reflectionphotography.co.id/wp-content/uploads/2024/05/pengertian-foto-landscape.jpg",
      tags: ["RPG", "Space", "Open World"],
      rating: 4.3,
      players: "56,789",
    },
     {
      title: "Starfield",
      price: 69.99,
      discount: 15,
      image: "https://reflectionphotography.co.id/wp-content/uploads/2024/05/pengertian-foto-landscape.jpg",
      tags: ["RPG", "Space", "Open World"],
      rating: 4.3,
      players: "56,789",
    },
     {
      title: "Starfield",
      price: 69.99,
      discount: 15,
      image: "https://reflectionphotography.co.id/wp-content/uploads/2024/05/pengertian-foto-landscape.jpg",
      tags: ["RPG", "Space", "Open World"],
      rating: 4.3,
      players: "56,789",
    },
  ];

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
  ];

  const categories = [
    { name: "Action", icon: <Zap className="h-6 sm:h-8 w-6 sm:w-8" />, color: "from-red-500 to-orange-500" },
    { name: "Adventure", icon: <Gamepad2 className="h-6 sm:h-8 w-6 sm:w-8" />, color: "from-emerald-500 to-teal-500" },
    { name: "RPG", icon: <Award className="h-6 sm:h-8 w-6 sm:w-8" />, color: "from-purple-500 to-indigo-500" },
    { name: "Strategy", icon: <ChevronDown className="h-6 sm:h-8 w-6 sm:w-8" />, color: "from-blue-500 to-cyan-500" },
    { name: "Simulation", icon: <Tag className="h-6 sm:h-8 w-6 sm:w-8" />, color: "from-amber-500 to-yellow-500" },
    { name: "Sports", icon: <Trophy className="h-6 sm:h-8 w-6 sm:w-8" />, color: "from-green-500 to-lime-500" },
  ];

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
  ];

  const liveStreams = [
    {
      title: "Elden Ring - First Playthrough",
      streamer: "GameMaster64",
      viewers: "12,456",
      image: "https://www.unpas.ac.id/wp-content/uploads/2018/03/TIRTO-Gedungitb1.jpg",
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
  ];

  return (
    
          <main className="flex-1 md:ml-64">
            <HeroCarousel />
            <FeaturedGames games={featuredGames} />
            <SpecialOffers offers={specialOffers} />
            <Categories categories={categories} />
            <RecentlyUpdated games={updatedGames} />
            <LiveStreams streams={liveStreams} />
          </main>
     
  );
}