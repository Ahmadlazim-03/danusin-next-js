import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, Plus } from "lucide-react"

export default function ProductsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your products</p>
        </div>
        <div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-green-300 bg-white p-12 text-center">
        <Package className="mb-4 h-12 w-12 text-green-300" />
        <h2 className="mb-2 text-xl font-semibold">No Products Yet</h2>
        <p className="mb-6 max-w-md text-muted-foreground">Add your first product to start selling.</p>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>
    </div>
  )
}
