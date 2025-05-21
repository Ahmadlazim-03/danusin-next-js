import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-green-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-green-950">About Danusin</h1>
            <p className="text-xl mb-8 text-green-900">
              Connecting entrepreneurs with supporters to achieve fundraising goals through a catalog-based marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-green-950">Our Mission</h2>
              <p className="text-lg mb-6 text-green-900">
                At Danusin, we believe in the power of community to fuel entrepreneurial success. Our mission is to
                create a platform that bridges the gap between innovative entrepreneurs (danusers) and supporters who
                want to make a difference.
              </p>
              <p className="text-lg mb-6 text-green-900">
                We're dedicated to providing a transparent, efficient, and engaging way for entrepreneurs to showcase
                their products, track fundraising progress, and connect with their audience.
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/register">Join Our Community</Link>
              </Button>
            </div>
            <div className="bg-green-100 rounded-lg p-8 h-full">
              <div className="aspect-video relative bg-green-200 rounded-lg mb-6">
                <Image
                  src="/placeholder.svg?height=300&width=500"
                  alt="Danusin Mission"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-950">Why Danusin?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Connect entrepreneurs with supporters</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Transparent fundraising progress tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Catalog-based marketplace for products</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Interactive map to discover local entrepreneurs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Created By Section */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-green-950">Created by evop.tech</h2>
            <p className="text-lg mb-8 text-green-900">
              Danusin is proudly developed by evop.tech, a forward-thinking technology company dedicated to creating
              innovative solutions that empower entrepreneurs and communities.
            </p>
            <div className="flex justify-center mb-8">
              <div className="h-24 w-24 bg-white rounded-full shadow-md flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">evop</span>
              </div>
            </div>
            <p className="text-green-900">
              Visit{" "}
              <a
                href="https://evop.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline"
              >
                evop.tech
              </a>{" "}
              to learn more about our other projects and services.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-green-950">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-green-100">
                <div className="aspect-square relative bg-green-100">
                  <Image
                    src={`/placeholder.svg?height=300&width=300&text=Team Member ${i}`}
                    alt={`Team Member ${i}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-1">Team Member {i}</h3>
                  <p className="text-green-600 mb-3">Position</p>
                  <p className="text-muted-foreground">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Join Danusin?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Whether you're an entrepreneur looking to raise funds or a supporter wanting to make a difference, Danusin
            is the platform for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
