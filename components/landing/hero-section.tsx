import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-green-50 to-white py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-green-950">
            Empowering Entrepreneurs Through Community Support
          </h1>
          <p className="text-xl mb-8 text-green-900">
            Danusin connects entrepreneurs with supporters to achieve fundraising goals through a catalog-based
            marketplace. Discover organizations, explore products, and make a difference.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link href="/register">Join as Entrepreneur</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-green-600 text-green-700 hover:bg-green-50">
              <Link href="/register">Join as Supporter</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-1/2 h-full max-w-2xl hidden lg:block">
        {/* This would be replaced with an actual image */}
        <div className="w-full h-full bg-gradient-to-tr from-transparent to-green-100 rounded-tl-3xl"></div>
      </div>
    </section>
  )
}
