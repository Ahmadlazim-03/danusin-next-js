import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Globe, LayoutGrid, Package, BarChart3, Users } from "lucide-react"

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-green-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-green-950">Danusin Features</h1>
            <p className="text-xl mb-8 text-green-900">
              Discover the powerful tools and features that make Danusin the ideal platform for entrepreneurs and
              supporters.
            </p>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-green-100">
              <CardHeader>
                <Building2 className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Organization Management</CardTitle>
                <CardDescription>Create and manage your organizations with ease</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Set up your organization profile, define fundraising targets, track progress, and manage team members
                  with different roles and permissions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader>
                <LayoutGrid className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Catalog Management</CardTitle>
                <CardDescription>Organize your products into catalogs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create multiple catalogs to categorize your products, making it easier for supporters to browse and
                  find what they're looking for.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader>
                <Package className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Product Showcase</CardTitle>
                <CardDescription>Display your products to potential supporters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add detailed product information, multiple images, pricing, and discounts to showcase your offerings
                  in the best light.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader>
                <Globe className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>3D Location Map</CardTitle>
                <CardDescription>Discover entrepreneurs near you</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Explore danusers on an interactive 3D map powered by Mapbox, making it easy to find and support local
                  entrepreneurs.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Gain insights from keyword trends</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Danusers can analyze trends related to their keywords, helping them make informed decisions about
                  their products and marketing strategies.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader>
                <Users className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>Manage team members with different permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Assign different roles (admin, moderator, member) to your team members, giving them the appropriate
                  level of access to your organization.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Organization Management */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-green-950">Organization Management</h2>
              <p className="text-lg mb-6 text-green-900">
                Danusin provides powerful tools for entrepreneurs to create and manage their organizations. Set
                fundraising targets, track progress, and showcase your mission to potential supporters.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Create Organization Profiles</span>
                    <p className="text-muted-foreground">
                      Set up detailed profiles with name, description, images, and fundraising goals.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Track Fundraising Progress</span>
                    <p className="text-muted-foreground">
                      Monitor your fundraising progress with visual progress bars and detailed statistics.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Manage Team Members</span>
                    <p className="text-muted-foreground">
                      Invite team members and assign them different roles (admin, moderator, member).
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="aspect-video relative bg-white rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=400&width=600&text=Organization Management"
                alt="Organization Management"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catalog and Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 aspect-video relative bg-white rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=400&width=600&text=Catalog Management"
                alt="Catalog Management"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6 text-green-950">Catalog & Product Management</h2>
              <p className="text-lg mb-6 text-green-900">
                Organize your products into catalogs, making it easier for supporters to browse and find what they're
                looking for. Add detailed product information, images, pricing, and more.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Create Multiple Catalogs</span>
                    <p className="text-muted-foreground">
                      Organize products into different catalogs based on categories, seasons, or any other criteria.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Detailed Product Listings</span>
                    <p className="text-muted-foreground">
                      Add comprehensive product details including multiple images, descriptions, pricing, and discounts.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Public Catalog Pages</span>
                    <p className="text-muted-foreground">
                      Share your catalogs with supporters through public pages that showcase your products.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Map */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-green-950">3D Location Map</h2>
              <p className="text-lg mb-6 text-green-900">
                Discover entrepreneurs (danusers) on an interactive 3D map powered by Mapbox. Find local entrepreneurs
                to support, or if you're a danuser, make yourself visible to potential supporters.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Interactive 3D Visualization</span>
                    <p className="text-muted-foreground">
                      Explore danusers on a beautiful 3D map with smooth navigation and interactive elements.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Location-Based Discovery</span>
                    <p className="text-muted-foreground">
                      Find entrepreneurs near you or in specific regions you're interested in supporting.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Danuser Visibility</span>
                    <p className="text-muted-foreground">
                      As a danuser, make yourself visible on the map to attract local supporters to your organization.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="aspect-video relative bg-white rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=400&width=600&text=3D Map"
                alt="3D Map"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trend Analysis */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 aspect-video relative bg-white rounded-lg shadow-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=400&width=600&text=Trend Analysis"
                alt="Trend Analysis"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-6 text-green-950">Trend Analysis</h2>
              <p className="text-lg mb-6 text-green-900">
                Danusers can analyze trends related to their keywords, helping them make informed decisions about their
                products and marketing strategies. Gain insights from Google Trends data integrated into the platform.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Keyword Tracking</span>
                    <p className="text-muted-foreground">
                      Track the popularity of keywords related to your products and organization.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Visual Charts</span>
                    <p className="text-muted-foreground">
                      View trend data in easy-to-understand charts and graphs that highlight important patterns.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <span className="font-medium">Related Keywords & Topics</span>
                    <p className="text-muted-foreground">
                      Discover related keywords and topics to expand your reach and improve your marketing strategy.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience These Features?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join Danusin today and start using these powerful features to grow your organization and connect with
            supporters.
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
