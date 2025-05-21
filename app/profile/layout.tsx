import type React from "react"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-green-50">
      <main>{children}</main>
    </div>
  )
}
