import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function NewCatalogPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Catalog</h1>
        <p className="text-muted-foreground">Create a new catalog to organize your products</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog Details</CardTitle>
          <CardDescription>Enter the details of your new catalog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Catalog Name</Label>
            <Input id="name" placeholder="Enter catalog name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter catalog description" rows={4} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard/catalogs">Cancel</Link>
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">Create Catalog</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
