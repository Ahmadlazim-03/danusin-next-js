"use client"

import { useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface SpecialOfferCardProps {
  deal: {
    title: string
    discount: string
    image: string
    endDate: string
    gradient: string
  }
}

export function SpecialOfferCard({ deal }: SpecialOfferCardProps) {
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
        className="bg-zinc-800/50 backdrop-blur-sm border-zinc-700/50 overflow-hidden h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="aspect-[16/9] relative overflow-hidden">
          <Image
            src={deal.image || "/placeholder.svg"}
            alt={deal.title}
            fill
            className={`object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
          />

          <div
            className={`absolute inset-0 bg-gradient-to-br ${deal.gradient} transition-opacity duration-300 ${isHovered ? "opacity-60" : "opacity-40"}`}
          ></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="text-center p-6"
              animate={{
                scale: isHovered ? 1.1 : 1,
                y: isHovered ? -10 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-bold text-2xl mb-3 text-white drop-shadow-md">{deal.title}</h3>

              <motion.div
                animate={{
                  rotate: isHovered ? [0, -3, 3, 0] : 0,
                  scale: isHovered ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                  repeatDelay: 2,
                }}
              >
                <Badge className="bg-white/90 text-black font-bold text-lg px-4 py-2 shadow-lg">{deal.discount}</Badge>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-zinc-300">Ends {deal.endDate}</span>

            <Button
              size="sm"
              className={`
        transition-all duration-300 text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3
        ${
          isHovered
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20"
            : "bg-zinc-700 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-cyan-500"
        }
      `}
            >
              View Deals
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
