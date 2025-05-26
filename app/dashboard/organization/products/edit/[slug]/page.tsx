"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
import { ArrowLeft, Trash2, ChevronsUpDown, X, Package, Info } from "lucide-react";
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

// Tipe Data (Tetap Sama)
type CatalogFormData = { id: string; name: string; };
type ProductFormData = RecordModel & { product_name: string; slug: string; description: string; price: number; discount: number; product_image: string[]; catalog: string[]; by_organization: string; added_by: string; };
type ProductDetailData = RecordModel & { tinggi?: number; lebar?: number; berat?: number; alat_bahan?: string; petunjuk_penyimpanan?: string; id_product: string; }

// Komponen Skeleton Form (Tetap Sama)
function EditFormSkeleton() {
  return (
      <div className="space-y-6">
          <Skeleton className="h-8 w-1/4 mb-6" />
          <Skeleton className="h-10 w-full mb-4" /> {/* Untuk TabsList */}
          <Card>
              <CardContent className="space-y-4 pt-6"> {/* Tambah pt-6 */}
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
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
          </div>
      </div>
  );
}

// --- Komponen Utama ---
export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user: loggedInUser } = useAuth();

  // State (Tetap Sama)
  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetailData | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogFormData[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [detailId, setDetailId] = useState<string | null>(null);

  const isCancellationError = (error: any): boolean => { return ( error.name === 'AbortError' || (error instanceof ClientResponseError && error.message.includes('autocancelled')) || (error instanceof ClientResponseError && error.status === 0) ); };

  // useEffect untuk Fetch Data (Tetap Sama)
  useEffect(() => {
      const controller = new AbortController();
      const signal = controller.signal;
      const fetchDataInternal = async () => {
          if (!slug) { setLoading(false); return; }
          setLoading(true);
          try {
              const productData = await pb.collection('danusin_product').getFirstListItem<ProductFormData>(`slug="${slug}"`, { $autoCancel: false, signal: signal });
              if (signal.aborted) return;
              const catalogsResult = await pb.collection("danusin_catalog").getFullList<RecordModel>({ sort: 'name', $autoCancel: false, signal: signal });
              if (signal.aborted) return;
              let detailData: ProductDetailData | null = null;
              try {
                  detailData = await pb.collection('danusin_product_detail').getFirstListItem<ProductDetailData>(`id_product = "${productData.id}"`, { $autoCancel: false, signal: signal });
              } catch (detailError: any) {
                  if (detailError.status !== 404 && !isCancellationError(detailError)) { console.warn("Gagal fetch detail produk:", detailError); }
              }
              if (signal.aborted) return;
              setProduct(productData);
              setFormProductName(productData.product_name);
              setFormDescription(productData.description);
              setFormPrice(String(productData.price));
              setFormDiscount(String(productData.discount || ""));
              setFormCatalogIds(productData.catalog || []);
              setCatalogs(catalogsResult.map((item) => ({ id: item.id, name: (item as any)['T name'] || item.name || "N/A" })));
              if (detailData) {
                  setProductDetail(detailData);
                  setDetailId(detailData.id);
                  setFormTinggi(String(detailData.tinggi || ""));
                  setFormLebar(String(detailData.lebar || ""));
                  setFormBerat(String(detailData.berat || ""));
                  setFormAlatBahan(detailData.alat_bahan || "");
                  setFormPetunjuk(detailData.petunjuk_penyimpanan || "");
              }
          } catch (error: any) {
              if (!isCancellationError(error)) {
                  console.error("Error fetching data:", error);
                  toast({ title: "Error", description: `Gagal memuat data: ${error.message || 'Produk tidak ditemukan.'}`, variant: "destructive" });
                  setProduct(null);
              } else { console.log("Fetch cancelled."); }
          } finally {
              if (!signal.aborted) { setLoading(false); }
          }
      };
      fetchDataInternal();
      return () => controller.abort();
  }, [slug]);

  // useEffect untuk Image Preview (Tetap Sama)
  useEffect(() => {
      const newPreviews = formProductImageFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [formProductImageFiles]);

  // handleUpdateProduct (Tetap Sama)
  const handleUpdateProduct = async () => {
      if (isSubmitting || !product || !formProductName.trim() || formCatalogIds.length === 0 || !formPrice) {
          toast({ title: "Error", description: "Nama Produk, Katalog, dan Harga wajib diisi.", variant: "destructive" }); return;
      }
      setIsSubmitting(true);
      const newSlugValue = formProductName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
      try {
          const formData = new FormData();
          formData.append('product_name', formProductName);
          formData.append('slug', newSlugValue);
          formData.append('description', formDescription);
          formData.append('price', formPrice);
          formData.append('discount', formDiscount || "0");
          formData.append('catalog', '');
          formCatalogIds.forEach(catId => formData.append('catalog', catId));
          if (formProductImageFiles.length > 0) {
              formData.append('product_image', '');
              formProductImageFiles.forEach(file => formData.append('product_image', file));
          }
          await pb.collection("danusin_product").update(product.id, formData);
          const detailPayload = {
              tinggi: parseFloat(formTinggi) || null,
              lebar: parseFloat(formLebar) || null,
              berat: parseFloat(formBerat) || null,
              alat_bahan: formAlatBahan,
              petunjuk_penyimpanan: formPetunjuk,
              id_product: product.id,
          };
          if (detailId) { await pb.collection("danusin_product_detail").update(detailId, detailPayload); }
          else { await pb.collection("danusin_product_detail").create(detailPayload); }
          toast({ title: "Sukses", description: "Produk dan detailnya berhasil diperbarui." });
          router.back();
      } catch (error: any) {
          console.error("--- UPDATE ERROR CATCH ---", error);
          let errorMessage = 'Gagal memperbarui produk. Coba lagi.';
           if (error instanceof ClientResponseError) { errorMessage = error.data?.message || error.message; }
           else if (error instanceof Error) { errorMessage = error.message; }
          toast({ title: "Error", description: errorMessage, variant: "destructive" });
      } finally { setIsSubmitting(false); }
  };

  if (loading) { return <div className="p-4 md:p-8 w-full"> <EditFormSkeleton /> </div>; }
  if (!product) {
      return (
          <div className="p-4 md:p-8 w-full text-center">
              <Package className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
              <h1 className="text-2xl font-bold mb-4">Produk Tidak Ditemukan</h1>
              <Button onClick={() => router.back()}> <ArrowLeft className="mr-2 h-4 w-4" /> Kembali </Button>
          </div>
      );
  }

  return (
      <div className="p-4 md:p-8 w-full">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
          </Button>
          <h1 className="text-2xl font-bold mb-6">Edit Produk: {product.product_name}</h1>

          <Tabs defaultValue="dasar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="dasar">Informasi Dasar</TabsTrigger>
                  <TabsTrigger value="detail">Informasi Detail</TabsTrigger>
              </TabsList>

              <TabsContent value="dasar">
                  <Card>
                      <CardHeader>
                           <CardTitle>Informasi Dasar</CardTitle>
                           <CardDescription>Detail utama produk Anda.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                            <div className="space-y-2">
                               <Label htmlFor="form-p-name">Nama Produk <span className="text-red-500">*</span></Label>
                               <Input id="form-p-name" value={formProductName} onChange={(e) => setFormProductName(e.target.value)} placeholder="Contoh: Kue Coklat Lezat" />
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="form-p-desc">Deskripsi</Label>
                               <Textarea id="form-p-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Jelaskan produk Anda..." />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-2">
                                   <Label htmlFor="form-p-price">Harga (Rp) <span className="text-red-500">*</span></Label>
                                   <Input id="form-p-price" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="Contoh: 50000" />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="form-p-discount">Harga Diskon (Rp)</Label>
                                   <Input id="form-p-discount" type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} placeholder="Kosongkan jika tidak ada" />
                               </div>
                           </div>
                           <div className="space-y-2">
                                <Label>Katalog <span className="text-red-500">*</span></Label>
                               <Popover open={isCatalogPopoverOpen} onOpenChange={setIsCatalogPopoverOpen}>
                                    <PopoverTrigger asChild>
                                       <Button variant="outline" role="combobox" className="w-full justify-between" disabled={catalogs.length === 0} aria-expanded={isCatalogPopoverOpen}>
                                           {formCatalogIds.length > 0 ? `${formCatalogIds.length} katalog dipilih` : "Pilih katalog..."}
                                           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                       </Button>
                                   </PopoverTrigger>
                                   <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                      <div className="p-2 border-b">
                                          <Input placeholder="Cari katalog..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="h-9"/>
                                      </div>
                                      <div className="max-h-48 overflow-y-auto p-2">
                                          {catalogs.filter(cat => cat.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                                              .map((catalog) => (
                                              <div key={catalog.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer" onClick={() => { setFormCatalogIds((prev) => prev.includes(catalog.id) ? prev.filter((id) => id !== catalog.id) : [...prev, catalog.id] ); }}>
                                                  <Checkbox id={`cat-${catalog.id}`} checked={formCatalogIds.includes(catalog.id)} onCheckedChange={() => { setFormCatalogIds((prev) => prev.includes(catalog.id) ? prev.filter((id) => id !== catalog.id) : [...prev, catalog.id] ); }} onClick={(e) => e.stopPropagation()}/>
                                                  <Label htmlFor={`cat-${catalog.id}`} className="cursor-pointer flex-1 font-normal text-sm">{catalog.name}</Label>
                                              </div>
                                          ))}
                                      </div>
                                   </PopoverContent>
                               </Popover>
                               <div className="flex flex-wrap gap-1.5 mt-2 min-h-[26px]">
                                   {formCatalogIds.map((id) => {
                                       const catalog = catalogs.find((c) => c.id === id);
                                       return catalog ? ( <Badge key={id} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">{catalog.name} <button type="button" onClick={() => setFormCatalogIds((prev) => prev.filter((catId) => catId !== id))} className="rounded-full hover:bg-muted-foreground/20 p-0.5 -mr-1 transition-colors" aria-label={`Hapus ${catalog.name}`}> <X className="h-3 w-3" /> </button> </Badge> ) : null;
                                   })}
                               </div>
                           </div>
                           {/* --- Input Gambar Produk (Diperbarui) --- */}
                           <div className="space-y-2">
                               <Label htmlFor="form-p-image">Gambar Produk (Unggah untuk Ganti)</Label>
                               <Input
                                   id="form-p-image"
                                   type="file"
                                   multiple
                                   onChange={(e) => setFormProductImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                                   className="h-auto py-2.5 px-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/40 dark:file:text-emerald-300 dark:hover:file:bg-emerald-800/50 cursor-pointer" // <-- Diperbarui di sini
                               />
                               <div className="mt-3 p-3 border border-dashed rounded-md bg-muted/30">
                                   <p className="text-xs font-medium text-muted-foreground mb-3">{imagePreviews.length > 0 ? "Preview Gambar Baru:" : "Gambar Saat Ini:"}</p>
                                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                       {imagePreviews.length > 0 && imagePreviews.map((previewUrl, index) => (
                                           <div key={`new-${index}`} className="relative group/newimg">
                                               <Image src={previewUrl} alt={`New ${index + 1}`} width={100} height={100} className="rounded-md object-cover w-full aspect-square border" />
                                               <Button type="button" variant="destructive" size="icon" onClick={() => setFormProductImageFiles(prev => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 h-6 w-6 opacity-0 group-hover/newimg:opacity-100 transition-opacity shadow-lg" aria-label="Hapus gambar"> <Trash2 className="h-3.5 w-3.5" /> </Button>
                                           </div>
                                       ))}
                                       {imagePreviews.length === 0 && product && product.product_image?.map((imgName, index) => {
                                           const imgUrl = pb.getFileUrl(product, imgName, { thumb: "100x100" });
                                           return ( <div key={`${product.id}-${index}`} className="relative"> <Image src={imgUrl} alt={`Existing ${index + 1}`} width={100} height={100} className="rounded-md object-cover w-full aspect-square border" /> </div> );
                                       })}
                                       {imagePreviews.length === 0 && (!product || !product.product_image || product.product_image.length === 0) && ( <p className="text-sm text-muted-foreground col-span-full">Tidak ada gambar.</p> )}
                                   </div>
                               </div>
                              {imagePreviews.length > 0 && ( <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5"> <Info className="h-3 w-3 text-orange-500"/> <span className="font-semibold text-orange-600">Perhatian:</span> Mengunggah gambar baru akan <span className="font-bold">mengganti semua</span> gambar yang ada. </div> )}
                           </div>
                           {/* --- Akhir Input Gambar Produk --- */}
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="detail">
                   <Card>
                       <CardHeader>
                           <CardTitle>Informasi Detail</CardTitle>
                           <CardDescription>Ukuran, bahan, dan cara penyimpanan produk.</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="space-y-2">
                                   <Label htmlFor="form-d-tinggi">Tinggi (cm)</Label>
                                   <Input id="form-d-tinggi" type="number" value={formTinggi} onChange={(e) => setFormTinggi(e.target.value)} placeholder="Contoh: 5" />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="form-d-lebar">Lebar (cm)</Label>
                                   <Input id="form-d-lebar" type="number" value={formLebar} onChange={(e) => setFormLebar(e.target.value)} placeholder="Contoh: 5" />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="form-d-berat">Berat (kg)</Label>
                                   <Input id="form-d-berat" type="number" value={formBerat} onChange={(e) => setFormBerat(e.target.value)} placeholder="Contoh: 0.7" step="0.1" />
                               </div>
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="form-d-alat">Alat dan Bahan</Label>
                               <Textarea id="form-d-alat" value={formAlatBahan} onChange={(e) => setFormAlatBahan(e.target.value)} placeholder="Masukkan alat dan bahan..." rows={6} />
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="form-d-petunjuk">Petunjuk Penyimpanan</Label>
                               <Textarea id="form-d-petunjuk" value={formPetunjuk} onChange={(e) => setFormPetunjuk(e.target.value)} placeholder="Masukkan petunjuk penyimpanan..." rows={4} />
                           </div>
                       </CardContent>
                   </Card>
              </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6 mt-6 border-t border-border">
              <Button onClick={handleUpdateProduct} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
          </div>
      </div>
  );
}