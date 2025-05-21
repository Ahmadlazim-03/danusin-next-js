import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BannerCarousel } from "@/components/landing/banner-carousel"
import { FeaturedOrganizations } from "@/components/landing/featured-organizations"
import { HeroSection } from "@/components/landing/hero-section"

export default async function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <BannerCarousel />
      <section className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're an entrepreneur looking to raise funds or a supporter wanting to make a difference, Danusin
            connects you with opportunities that matter.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
      <FeaturedOrganizations />
    </main>
  )
}
