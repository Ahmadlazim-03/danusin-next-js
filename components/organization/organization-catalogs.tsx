"use client"

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { LayoutGrid, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { RecordModel, ClientResponseError } from "pocketbase";

type Catalog = RecordModel & {
  name: string;
  description: string;
  created_by: string;
  products?: number;
};

type OrganizationCatalogsProps = {
  organizationId: string;
  userRole: string | null;
};

export function OrganizationCatalogs({ organizationId, userRole }: OrganizationCatalogsProps) {
  const { user } = useAuth();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);

  const [catalogName, setCatalogName] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");

  const canManageCatalogs = userRole === "admin" || userRole === "moderator";

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCatalogs = async () => {
      if (!organizationId) {
        if (isMounted) setLoading(false);
        return;
      }
      if(isMounted) setLoading(true);
      try {
        const productsResult = await pb.collection("danusin_product").getFullList(
          {
            filter: `by_organization="${organizationId}"`,
            fields: 'catalog', // Hanya ambil field catalog
            signal: controller.signal,
            $autoCancel: false, 
          }
        );

        if (!isMounted || controller.signal.aborted) return;

        const catalogIdsFromProducts = new Set<string>();
        productsResult.forEach(product => {
            if (Array.isArray(product.catalog)) { 
                product.catalog.forEach((catId: string) => { if(catId) catalogIdsFromProducts.add(catId) }); 
            } else if (product.catalog) { 
                catalogIdsFromProducts.add(product.catalog); 
            }
        });
        
        const uniqueCatalogIds = Array.from(catalogIdsFromProducts);
        if (uniqueCatalogIds.length === 0) { 
            if(isMounted) {
                setCatalogs([]); 
                setLoading(false);
            } 
            return; 
        }

        const productCountByCatalog: Record<string, number> = {};
        productsResult.forEach((product) => {
            const processCatalog = (catId: string) => { if (catId) { productCountByCatalog[catId] = (productCountByCatalog[catId] || 0) + 1; } };
            if (Array.isArray(product.catalog)) { product.catalog.forEach(processCatalog); } 
            else if (product.catalog) { processCatalog(product.catalog); }
        });
        
        const catalogFilter = uniqueCatalogIds.map(id => `id="${id}"`).join(" || ");
        const catalogsData = await pb.collection("danusin_catalog").getFullList<Catalog>(
            { filter: catalogFilter, signal: controller.signal, $autoCancel: false }
        );

        if (!isMounted || controller.signal.aborted) return;
        
        const enrichedCatalogs = catalogsData.map(catalog => ({
            ...catalog,
            products: productCountByCatalog[catalog.id] || 0,
        }));
        setCatalogs(enrichedCatalogs.sort((a, b) => new Date(b.created_by || 0).getTime() - new Date(a.created_by || 0).getTime()));
      } catch (error: any) {
        if (error.name !== "AbortError" && !(error instanceof ClientResponseError && error.status === 0) && error.message !== "The request was autocancelled") {
          console.error("Error fetching catalogs:", error);
          toast({ title: "Error", description: "Gagal memuat katalog.", variant: "destructive"});
        } else {
            console.log("Fetch catalogs request was cancelled (expected).");
        }
      } finally { if (isMounted) { setLoading(false); } }
    };

    fetchCatalogs();
    return () => { isMounted = false; controller.abort(); };
  }, [organizationId]);

  const resetForm = () => {
    setCatalogName("");
    setCatalogDescription("");
    setSelectedCatalog(null);
  };

  const handleAddCatalog = async () => {
    if (!catalogName.trim() || !user) { toast({ title: "Error", description: "Nama katalog wajib diisi.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const newCatalogData = { name: catalogName, description: catalogDescription, created_by: user.id, };
      const newCatalogRecord = await pb.collection("danusin_catalog").create<Catalog>(newCatalogData);

      // --- AWAL BAGIAN PEMBUATAN PRODUK SAMPEL (OPSIONAL) ---
      /*
      // Jika Anda TIDAK ingin membuat produk sampel otomatis, komentari atau hapus blok di bawah ini
      await pb.collection("danusin_product").create({
        product_name: `${newCatalogRecord.name} (Auto-generated Sample)`, 
        catalog: newCatalogRecord.id, 
        by_organization: organizationId, 
        added_by: user.id, 
        price: 0, 
        slug: `${newCatalogRecord.name.toLowerCase().replace(/\s+/g, "-")}-sample-${Date.now().toString().slice(-5)}`,
        // product_image: [], // Jika diperlukan
        // Pastikan semua field 'required' di danusin_product terisi
      });
      */
      // --- AKHIR BAGIAN PEMBUATAN PRODUK SAMPEL ---

      // Perbarui daftar katalog di UI secara lokal
      // Jika produk sampel tidak dibuat, jumlah produk mungkin 0
      const productsInNewCatalog = 0; // Ubah ke 1 jika produk sampel dibuat
      setCatalogs(prevCatalogs => [
        { ...newCatalogRecord, products: productsInNewCatalog }, 
        ...prevCatalogs
      ].sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime()));

      toast({ title: "Sukses", description: "Katalog baru berhasil ditambahkan." });
      resetForm(); 
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding catalog:", error);
      let errMsg = "Gagal menambahkan katalog."; 
      if (error?.data?.data?.name?.message) { // Contoh error spesifik dari PocketBase
        errMsg = `Nama Katalog: ${error.data.data.name.message}`;
      } else if (error.message) {
        errMsg = error.message;
      }
      toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleEditCatalog = async () => {
    if (!selectedCatalog || !catalogName.trim()) { toast({ title: "Error", description: "Nama katalog wajib diisi.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      const updatedData = { name: catalogName, description: catalogDescription, };
      const updatedCatalogRecord = await pb.collection("danusin_catalog").update<Catalog>(selectedCatalog.id, updatedData);
      setCatalogs(catalogs.map((catalog) => 
          catalog.id === selectedCatalog.id 
            ? { ...catalog, ...updatedCatalogRecord, products: catalog.products } // Jaga product count
            : catalog 
        ).sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime()) 
      );
      toast({ title: "Sukses", description: "Katalog berhasil diperbarui." });
      resetForm(); setIsEditDialogOpen(false);
    } catch (error: any) { 
        console.error("Error updating catalog:", error); 
        let errMsg = "Gagal memperbarui katalog.";
        if (error?.data?.data?.name?.message) { errMsg = `Nama Katalog: ${error.data.data.name.message}`; }
        toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteCatalog = async (catalogId: string) => {
    try {
      const productsResult = await pb.collection("danusin_product").getList(1, 1, { 
        filter: `(catalog='${catalogId}' || catalog~'${catalogId}') && by_organization="${organizationId}"`, 
        $autoCancel: false 
      });
      if (productsResult.totalItems > 0) { 
        toast({ title: "Error", description: "Tidak dapat menghapus katalog yang masih memiliki produk. Hapus produk terlebih dahulu.", variant: "destructive", duration: 5000 }); 
        return; 
      }
      await pb.collection("danusin_catalog").delete(catalogId);
      setCatalogs(catalogs.filter((catalog) => catalog.id !== catalogId));
      toast({ title: "Sukses", description: "Katalog berhasil dihapus." });
    } catch (error) { 
      console.error("Error deleting catalog:", error); 
      toast({ title: "Error", description: "Gagal menghapus katalog.", variant: "destructive" }); 
    }
  };

  const openEditDialog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setCatalogName(catalog.name);
    setCatalogDescription(catalog.description);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return ( 
      <div className="space-y-4"> 
        {[...Array(3)].map((_, i) => ( 
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg"> 
            <div className="flex items-center gap-3"> 
              <Skeleton className="h-10 w-10 rounded" /> 
              <div> <Skeleton className="h-4 w-32" /> <Skeleton className="mt-1 h-3 w-24" /> </div> 
            </div> 
            <Skeleton className="h-8 w-20 rounded-md" /> 
          </div> 
        ))} 
      </div> 
    );
  }

  return (
    <div className="space-y-6">
      {canManageCatalogs && (
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) resetForm(); setIsAddDialogOpen(isOpen); }}>
            <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700 text-white"> <Plus className="mr-2 h-4 w-4" /> Add Catalog </Button></DialogTrigger>
            <DialogContent>
              <DialogHeader> <DialogTitle>Add New Catalog</DialogTitle> <DialogDescription>Create a new catalog for your organization.</DialogDescription> </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"> <Label htmlFor="name">Catalog Name</Label> <Input id="name" placeholder="Enter catalog name" value={catalogName} onChange={(e) => setCatalogName(e.target.value)} /> </div>
                <div className="space-y-2"> <Label htmlFor="description">Description</Label> <Textarea id="description" placeholder="Enter catalog description" value={catalogDescription} onChange={(e) => setCatalogDescription(e.target.value)} /> </div>
              </div>
              <DialogFooter> <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}> Cancel </Button> <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddCatalog} disabled={isSubmitting}> {isSubmitting ? "Adding..." : "Add Catalog"} </Button> </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedCatalog && (
            <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) resetForm(); setIsEditDialogOpen(isOpen); }}>
              <DialogContent>
                <DialogHeader> <DialogTitle>Edit Catalog</DialogTitle> <DialogDescription>Update the details of your catalog.</DialogDescription> </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"> <Label htmlFor="edit-name">Catalog Name</Label> <Input id="edit-name" placeholder="Enter catalog name" value={catalogName} onChange={(e) => setCatalogName(e.target.value)} /> </div>
                  <div className="space-y-2"> <Label htmlFor="edit-description">Description</Label> <Textarea id="edit-description" placeholder="Enter catalog description" value={catalogDescription} onChange={(e) => setCatalogDescription(e.target.value)} /> </div>
                </div>
                <DialogFooter> <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); }}> Cancel </Button> <Button className="bg-green-600 hover:bg-green-700" onClick={handleEditCatalog} disabled={isSubmitting}> {isSubmitting ? "Updating..." : "Update Catalog"} </Button> </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {catalogs.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <LayoutGrid className="mb-4 h-16 w-16 text-muted-foreground/60" />
          <h3 className="mb-1 text-lg font-medium">Belum ada katalog</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">Buat katalog untuk mengorganisir produk Anda.</p>
          {canManageCatalogs && !isAddDialogOpen && ( <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsAddDialogOpen(true)}> <Plus className="mr-2 h-4 w-4" /> Tambah Katalog </Button> )}
        </div>
      ) : (
        <div className="space-y-4">
          {catalogs.map((catalog) => (
            <div key={catalog.id} className="flex items-center justify-between rounded-lg border p-4 hover:shadow-sm transition-shadow">
              <div className="space-y-1">
                <h4 className="font-medium">{catalog.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{catalog.description}</p>
                <p className="text-xs text-muted-foreground"> {catalog.products} {catalog.products === 1 ? "produk" : "produk"} </p>
              </div>
              {canManageCatalogs && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"> <MoreHorizontal className="h-4 w-4" /> <span className="sr-only">Aksi</span> </Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(catalog)}> <Pencil className="mr-2 h-4 w-4" /> Edit </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 hover:!bg-red-50 focus:!bg-red-50 dark:hover:!bg-red-900/20 dark:focus:!bg-red-900/20"> <Trash2 className="mr-2 h-4 w-4" /> Hapus </DropdownMenuItem></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader> <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle> <AlertDialogDescription> Aksi ini akan menghapus katalog "{catalog.name}" secara permanen. Katalog tidak dapat dihapus jika masih berisi produk. </AlertDialogDescription> </AlertDialogHeader>
                        <AlertDialogFooter> <AlertDialogCancel>Batal</AlertDialogCancel> <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteCatalog(catalog.id)} > Hapus </AlertDialogAction> </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}