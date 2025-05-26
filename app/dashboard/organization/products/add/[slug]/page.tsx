"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { ArrowLeft, ChevronsUpDown, X, Package, Info, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientResponseError, RecordModel } from "pocketbase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipe Data Catalog
type CatalogFormData = {
  id: string;
  name: string;
};

// Komponen Skeleton Form
function CreateFormSkeleton() {
  return (
      <div className="space-y-6">
          <Skeleton className="h-8 w-1/4 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Card>
              <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
              <CardContent className="space-y-4 pt-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
              </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-32" />
          </div>
      </div>
  );
}

// Komponen Utama Halaman
export default function CreateProductByOrgSlugPage() {
  const router = useRouter();
  const params = useParams();
  const { user: loggedInUser } = useAuth();

  const organizationIdFromUrlSlug = params.slug as string;

  // State
  const [catalogs, setCatalogs] = useState<CatalogFormData[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProductName, setFormProductName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDiscount, setFormDiscount] = useState("");
  const [formCatalogIds, setFormCatalogIds] = useState<string[]>([]);
  const [formProductImageFiles, setFormProductImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCatalogPopoverOpen, setIsCatalogPopoverOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [formTinggi, setFormTinggi] = useState("");
  const [formLebar, setFormLebar] = useState("");
  const [formBerat, setFormBerat] = useState("");
  const [formAlatBahan, setFormAlatBahan] = useState("");
  const [formPetunjuk, setFormPetunjuk] = useState("");

  useEffect(() => {
    console.log("ID Organisasi dari URL (slug):", organizationIdFromUrlSlug);
    if (!organizationIdFromUrlSlug && !loadingCatalogs) {
        toast({
            title: "Error Akses Halaman",
            description: "ID Organisasi tidak ditemukan di URL. Mohon kembali dan coba lagi.",
            variant: "destructive",
        });
        router.push('/dashboard');
    }
  }, [organizationIdFromUrlSlug, loadingCatalogs, router]);

  // Fetch Catalogs dengan AbortController
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const catalogsResult = await pb.collection("danusin_catalog").getFullList<RecordModel>(
          undefined, // Batch size default
          { sort: 'name', signal: signal } // Kirim signal
        );
        if (!signal.aborted) {
          setCatalogs(catalogsResult.map((item) => ({
              id: item.id, name: (item as any)['T name'] || item.name || "N/A",
          })));
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || (error.isAbort || (error.message && error.message.includes('autocancelled')))) {
          console.log('Fetch catalogs request was cancelled (expected on unmount).');
        } else if (!signal.aborted) {
          console.error("Gagal mengambil katalog:", error);
          toast({ title: "Error", description: "Gagal mengambil data katalog.", variant: "destructive" });
        }
      } finally {
        if (!signal.aborted) {
          setLoadingCatalogs(false);
        }
      }
    };

    if (organizationIdFromUrlSlug) { // Hanya fetch jika ada ID organisasi
        fetchCatalogs();
    } else {
        setLoadingCatalogs(false); // Jika tidak ada ID, tidak perlu loading katalog
    }

    return () => {
      console.log("Cleaning up fetchCatalogs effect, aborting request...");
      controller.abort();
    };
  }, [organizationIdFromUrlSlug]); // Tambahkan organizationIdFromUrlSlug sebagai dependency

  // Image Preview
  useEffect(() => {
      const newPreviews = formProductImageFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [formProductImageFiles]);

  // Handle Create Product
  const handleCreateProduct = async () => {
      // ... (Implementasi handleCreateProduct tetap sama seperti sebelumnya)
      if (!loggedInUser?.id) {
          toast({ title: "Error", description: "Informasi pengguna tidak ditemukan. Silakan login ulang.", variant: "destructive" });
          return;
      }
      if (!organizationIdFromUrlSlug) {
          toast({ title: "Error", description: "ID Organisasi tidak valid untuk membuat produk.", variant: "destructive" });
          return;
      }
      if (isSubmitting || !formProductName.trim() || formCatalogIds.length === 0 || !formPrice) {
          toast({ title: "Error", description: "Nama Produk, Katalog, dan Harga wajib diisi.", variant: "destructive" });
          return;
      }
      if (formProductImageFiles.length === 0) {
          toast({ title: "Error", description: "Gambar Produk wajib diunggah.", variant: "destructive" });
          return;
      }

      setIsSubmitting(true);
      const newProductSlug = formProductName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

      try {
          const formData = new FormData();
          formData.append('product_name', formProductName);
          formData.append('slug', newProductSlug);
          formData.append('description', formDescription);
          formData.append('price', formPrice);
          formData.append('discount', formDiscount || "0");
          formCatalogIds.forEach(catId => formData.append('catalog', catId));
          formProductImageFiles.forEach(file => formData.append('product_image', file));
          formData.append('added_by', loggedInUser.id);
          formData.append('by_organization', organizationIdFromUrlSlug);

          const newProduct = await pb.collection("danusin_product").create(formData);

          const detailPayload = {
              tinggi: parseFloat(formTinggi) || null,
              lebar: parseFloat(formLebar) || null,
              berat: parseFloat(formBerat) || null,
              alat_bahan: formAlatBahan,
              petunjuk_penyimpanan: formPetunjuk,
              id_product: newProduct.id,
          };

          await pb.collection("danusin_product_detail").create(detailPayload);

          toast({ title: "Sukses", description: "Produk baru berhasil ditambahkan." });
          router.push(`/dashboard/organization/${organizationIdFromUrlSlug}`);

      } catch (error: any) {
          console.error("--- CREATE ERROR CATCH ---", error);
          let errorMessage = 'Gagal menambahkan produk. Coba lagi.';
           if (error instanceof ClientResponseError) {
               console.error("PB Error Data:", error.data);
               errorMessage = error.data?.message || error.message;
           } else if (error instanceof Error) {
               errorMessage = error.message;
           }
          toast({ title: "Error", description: errorMessage, variant: "destructive" });
      } finally {
          setIsSubmitting(false);
      }
  };

  if (loadingCatalogs) { return <div className="p-4 md:p-8 w-full"> <CreateFormSkeleton /> </div>; }

  return (
      <div className="p-4 md:p-8 w-full">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
          <h1 className="text-2xl font-bold mb-6">Tambah Produk Baru untuk Organisasi</h1>

          <Tabs defaultValue="dasar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="dasar">Informasi Dasar</TabsTrigger>
                  <TabsTrigger value="detail">Informasi Detail</TabsTrigger>
              </TabsList>

              <TabsContent value="dasar">
                  <Card>
                      <CardHeader>
                           <CardTitle>Informasi Dasar</CardTitle>
                           <CardDescription>Isi detail utama produk baru Anda.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                           {/* ... (Input Nama, Deskripsi, Harga, Katalog, Gambar) ... */}
                           <div className="space-y-2"><Label htmlFor="form-p-name">Nama Produk <span className="text-red-500">*</span></Label><Input id="form-p-name" value={formProductName} onChange={(e) => setFormProductName(e.target.value)} placeholder="Contoh: Kue Coklat Lezat" /></div>
                           <div className="space-y-2"><Label htmlFor="form-p-desc">Deskripsi</Label><Textarea id="form-p-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Jelaskan produk Anda..." /></div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label htmlFor="form-p-price">Harga (Rp) <span className="text-red-500">*</span></Label><Input id="form-p-price" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="Contoh: 50000" /></div><div className="space-y-2"><Label htmlFor="form-p-discount">Harga Diskon (Rp)</Label><Input id="form-p-discount" type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} placeholder="Kosongkan jika tidak ada" /></div></div>
                           <div className="space-y-2"><Label>Katalog <span className="text-red-500">*</span></Label><Popover open={isCatalogPopoverOpen} onOpenChange={setIsCatalogPopoverOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between" disabled={catalogs.length === 0} aria-expanded={isCatalogPopoverOpen}>{formCatalogIds.length > 0 ? `${formCatalogIds.length} katalog dipilih` : "Pilih katalog..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0"><div className="p-2 border-b"><Input placeholder="Cari katalog..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="h-9"/></div><div className="max-h-48 overflow-y-auto p-2">{catalogs.filter(cat => cat.name.toLowerCase().includes(catalogSearch.toLowerCase())).map((catalog) => (<div key={catalog.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer" onClick={() => { setFormCatalogIds((prev) => prev.includes(catalog.id) ? prev.filter((id) => id !== catalog.id) : [...prev, catalog.id] ); }}><Checkbox id={`cat-${catalog.id}`} checked={formCatalogIds.includes(catalog.id)} onCheckedChange={() => { setFormCatalogIds((prev) => prev.includes(catalog.id) ? prev.filter((id) => id !== catalog.id) : [...prev, catalog.id] ); }} onClick={(e) => e.stopPropagation()}/><Label htmlFor={`cat-${catalog.id}`} className="cursor-pointer flex-1 font-normal text-sm">{catalog.name}</Label></div>))}</div></PopoverContent></Popover><div className="flex flex-wrap gap-1.5 mt-2 min-h-[26px]">{formCatalogIds.map((id) => { const catalog = catalogs.find((c) => c.id === id); return catalog ? ( <Badge key={id} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">{catalog.name} <button type="button" onClick={() => setFormCatalogIds((prev) => prev.filter((catId) => catId !== id))} className="rounded-full hover:bg-muted-foreground/20 p-0.5 -mr-1 transition-colors" aria-label={`Hapus ${catalog.name}`}> <X className="h-3 w-3" /> </button> </Badge> ) : null; })}</div></div>
                           <div className="space-y-2"><Label htmlFor="form-p-image">Gambar Produk <span className="text-red-500">*</span></Label><Input id="form-p-image" type="file" multiple onChange={(e) => setFormProductImageFiles(e.target.files ? Array.from(e.target.files) : [])} className="h-auto py-2.5 px-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/40 dark:file:text-emerald-300 dark:hover:file:bg-emerald-800/50 cursor-pointer"/>{imagePreviews.length > 0 && (<div className="mt-3 p-3 border border-dashed rounded-md bg-muted/30"><p className="text-xs font-medium text-muted-foreground mb-3">Preview Gambar Baru:</p><div className="grid grid-cols-3 sm:grid-cols-4 gap-3">{imagePreviews.map((previewUrl, index) => (<div key={`new-${index}`} className="relative group/newimg"><Image src={previewUrl} alt={`New ${index + 1}`} width={100} height={100} className="rounded-md object-cover w-full aspect-square border" /><Button type="button" variant="destructive" size="icon" onClick={() => setFormProductImageFiles(prev => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6 opacity-0 group-hover/newimg:opacity-100 transition-opacity shadow-lg" aria-label="Hapus gambar"> <Trash2 className="h-3.5 w-3.5" /> </Button></div>))}</div></div>)}</div>
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="detail">
                   <Card>
                       <CardHeader><CardTitle>Informasi Detail</CardTitle><CardDescription>Isi ukuran, bahan, dan cara penyimpanan produk.</CardDescription></CardHeader>
                       <CardContent className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="space-y-2"><Label htmlFor="form-d-tinggi">Tinggi (cm)</Label><Input id="form-d-tinggi" type="number" value={formTinggi} onChange={(e) => setFormTinggi(e.target.value)} placeholder="Contoh: 5" /></div><div className="space-y-2"><Label htmlFor="form-d-lebar">Lebar (cm)</Label><Input id="form-d-lebar" type="number" value={formLebar} onChange={(e) => setFormLebar(e.target.value)} placeholder="Contoh: 5" /></div><div className="space-y-2"><Label htmlFor="form-d-berat">Berat (kg)</Label><Input id="form-d-berat" type="number" value={formBerat} onChange={(e) => setFormBerat(e.target.value)} placeholder="Contoh: 0.7" step="0.1" /></div></div>
                           <div className="space-y-2"><Label htmlFor="form-d-alat">Alat dan Bahan</Label><Textarea id="form-d-alat" value={formAlatBahan} onChange={(e) => setFormAlatBahan(e.target.value)} placeholder="Masukkan alat dan bahan..." rows={6} /></div>
                           <div className="space-y-2"><Label htmlFor="form-d-petunjuk">Petunjuk Penyimpanan</Label><Textarea id="form-d-petunjuk" value={formPetunjuk} onChange={(e) => setFormPetunjuk(e.target.value)} placeholder="Masukkan petunjuk penyimpanan..." rows={4} /></div>
                       </CardContent>
                   </Card>
              </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6 mt-6 border-t border-border">
              <Button onClick={handleCreateProduct} disabled={isSubmitting || !organizationIdFromUrlSlug || loadingCatalogs } className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menambahkan...</> : "Tambah Produk"}
              </Button>
          </div>
      </div>
  );
}