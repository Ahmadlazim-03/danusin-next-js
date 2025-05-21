import type * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  indicatorColor?: string
}

export function ProgressBar({
  value,
  max = 100,
  className,
  indicatorColor = "bg-green-600",
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-green-100", className)} {...props}>
      <div className={cn("h-full transition-all", indicatorColor)} style={{ width: `${percentage}%` }} />
    </div>
  )
}
