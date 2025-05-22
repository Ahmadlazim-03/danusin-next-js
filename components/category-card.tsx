"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"

interface CategoryCardProps {
  category: {
    name: string
    icon: React.ReactNode
    color: string
  }
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 },
      }}
    >
      <Card
        className="bg-zinc-800/30 backdrop-blur-sm border-zinc-700/50 overflow-hidden h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href="#" className="block p-3 sm:p-6 text-center relative">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${category.color} transition-opacity duration-500 ${isHovered ? "opacity-20" : "opacity-0"}`}
          ></div>

          <div className="flex flex-col items-center gap-2 sm:gap-3 relative z-10">
            <motion.div
              className={`p-2 sm:p-3 rounded-full transition-all duration-300 ${
                isHovered ? `bg-gradient-to-br ${category.color}` : "bg-zinc-700/50"
              }`}
              animate={{
                rotate: isHovered ? [0, 10, -10, 0] : 0,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {category.icon}
            </motion.div>

            <motion.span
              className={`font-medium text-xs sm:text-sm transition-colors duration-300 ${isHovered ? "text-white" : ""}`}
              animate={{ y: isHovered ? [0, -2, 0] : 0 }}
              transition={{ duration: 0.3 }}
            >
              {category.name}
            </motion.span>
          </div>
        </Link>
      </Card>
    </motion.div>
  )
}
