"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface GameCardProps {
  game: {
    title: string
    price: number
    discount?: number
    image: string
    tags: string[]
    rating: number
    players: string
  }
}

export function GameCard({ game }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.2 },
      }}
    >
      <Card
        className="bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 overflow-hidden group relative h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow effect on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-0 transition-opacity duration-500 pointer-events-none ${isHovered ? "opacity-100" : ""}`}
        />

        {/* Border glow */}
        <div
          className={`absolute inset-0 rounded-lg border-2 border-emerald-500/0 transition-all duration-500 ${isHovered ? "border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : ""}`}
        />

        <div className="aspect-video relative overflow-hidden">
          <Image
            src={game.image || "/placeholder.svg"}
            alt={game.title}
            fill
            className={`object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
          />

          {game.discount && game.discount > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <motion.div
                animate={{
                  scale: isHovered ? [1, 1.1, 1] : 1,
                  rotate: isHovered ? [0, -5, 5, 0] : 0,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                  repeatDelay: 2,
                }}
              >
                <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 font-bold">
                  -{game.discount}%
                </Badge>
              </motion.div>
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/50 to-transparent flex items-end justify-between p-3 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-emerald-500/20">
              View Game
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 hover:border-emerald-500 transition-all duration-300"
            >
              <motion.div animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isHovered ? "fill-rose-500 stroke-rose-500" : ""}
                  />
                </svg>
              </motion.div>
            </Button>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 relative z-10">
          <h3
            className={`font-semibold text-sm sm:text-base mb-1 transition-colors duration-300 ${isHovered ? "text-emerald-400" : ""}`}
          >
            {game.title}
          </h3>

          <div className="flex flex-wrap gap-1 mb-2">
            {game.tags.slice(0, 2).map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className={`text-xs border-zinc-600 transition-all duration-300 ${isHovered ? "border-emerald-500/50 bg-emerald-500/10" : ""}`}
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              {game.discount && game.discount > 0 ? (
                <>
                  <span className="line-through text-zinc-500">${game.price.toFixed(2)}</span>
                  <span className="font-bold">${(game.price * (1 - game.discount / 100)).toFixed(2)}</span>
                </>
              ) : (
                <span className="font-bold">${game.price.toFixed(2)}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                <span>{game.rating}</span>
              </div>
              <div className="text-xs text-zinc-400 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {game.players}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
