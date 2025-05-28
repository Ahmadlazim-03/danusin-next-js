"use client";

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, ChevronsUpDown, X, Package, Info, Loader2, Trash2, Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link'; // Pastikan Link diimpor jika digunakan, meskipun tidak eksplisit di JSX ini
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Pastikan Input diimpor
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    // DialogTrigger, // Tidak digunakan secara langsung untuk dialog katalog baru
} from "@/components/ui/dialog";
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/components/ui/use-toast';
import { ClientResponseError, RecordModel } from 'pocketbase';

// Tipe Data Catalog
type CatalogFormData = RecordModel & {
  name: string;
  description?: string;
  created_by?: string;
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
  const { toast } = useToast();

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

  const [isNewCatalogDialogOpen, setIsNewCatalogDialogOpen] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState("");
  const [newCatalogDescription, setNewCatalogDescription] = useState("");
  const [isSubmittingNewCatalog, setIsSubmittingNewCatalog] = useState(false);

  useEffect(() => {
    if (!organizationIdFromUrlSlug && !loadingCatalogs) { // Cek setelah loadingCatalogs selesai
        toast({
            title: "Error Akses Halaman",
            description: "ID Organisasi tidak ditemukan di URL. Mohon kembali dan coba lagi.",
            variant: "destructive",
            duration: 7000,
        });
        router.push('/dashboard'); // Arahkan ke halaman yang lebih aman
    }
  }, [organizationIdFromUrlSlug, loadingCatalogs, router]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let isMounted = true;

    const fetchCatalogs = async () => {
      if (!isMounted) return;
      setLoadingCatalogs(true);
      try {
        const catalogsResult = await pb.collection("danusin_catalog").getFullList<RecordModel>( // Gunakan RecordModel generik dulu
          { // Opsi langsung sebagai objek
            sort: 'name', 
            signal: signal,
            $autoCancel: false // Tambahkan ini untuk menghindari autocancel jika ada request lain
          }
        );
        if (isMounted && !signal.aborted) {
          setCatalogs(catalogsResult.map((item) => ({
            id: item.id, 
            name: item.name || "N/A", // Ambil field 'name' langsung
            // Pastikan properti lain sesuai dengan tipe CatalogFormData
            collectionId: item.collectionId,
            collectionName: item.collectionName,
            created: item.created,
            updated: item.updated,
            created_by: item.created_by, // Jika ada
            description: item.description, // Jika ada
          } as CatalogFormData)));
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || (error.isAbort || (error.message && error.message.includes('autocancelled')))) {
          console.log('Fetch catalogs request was cancelled.');
        } else if (isMounted && !signal.aborted) {
          console.error("Gagal mengambil katalog:", error);
          toast({ title: "Error", description: "Gagal mengambil data katalog.", variant: "destructive" });
        }
      } finally {
        if (isMounted && !signal.aborted) {
          setLoadingCatalogs(false);
        }
      }
    };

    if (organizationIdFromUrlSlug) {
        fetchCatalogs();
    } else {
        if(isMounted) setLoadingCatalogs(false); 
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [organizationIdFromUrlSlug]); // Hanya jalankan saat ID organisasi berubah

  useEffect(() => {
    const newPreviews = formProductImageFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
    return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [formProductImageFiles]);

  const handleAddNewCatalogInForm = async () => {
    if (!newCatalogName.trim() || !loggedInUser) {
        toast({ title: "Error", description: "Nama katalog baru wajib diisi.", variant: "destructive" });
        return;
    }
    setIsSubmittingNewCatalog(true);
    try {
        const newCatalogData = {
            name: newCatalogName,
            description: newCatalogDescription,
            created_by: loggedInUser.id,
        };
        const createdCatalog = await pb.collection("danusin_catalog").create<CatalogFormData>(newCatalogData);
        setCatalogs(prev => [...prev, createdCatalog].sort((a,b) => a.name.localeCompare(b.name)));
        setFormCatalogIds(prev => [...prev, createdCatalog.id]);
        toast({ title: "Sukses", description: `Katalog "${createdCatalog.name}" berhasil dibuat dan dipilih.`});
        setNewCatalogName("");
        setNewCatalogDescription("");
        setIsNewCatalogDialogOpen(false);
        setIsCatalogPopoverOpen(true);
    } catch (error: any) {
        console.error("Error creating new catalog from product form:", error);
        let errMsg = "Gagal membuat katalog baru.";
        if (error?.data?.data?.name?.message) { errMsg = `Nama Katalog: ${error.data.data.name.message}`; } 
        else if (error.message) { errMsg = error.message; }
        toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally {
        setIsSubmittingNewCatalog(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!loggedInUser?.id) { toast({ title: "Error", description: "Informasi pengguna tidak ditemukan.", variant: "destructive" }); return; }
    if (!organizationIdFromUrlSlug) { toast({ title: "Error", description: "ID Organisasi tidak valid.", variant: "destructive" }); return; }
    if (isSubmitting || !formProductName.trim() || formCatalogIds.length === 0 || !formPrice) { toast({ title: "Error", description: "Nama Produk, Katalog, dan Harga wajib diisi.", variant: "destructive" }); return; }
    if (formProductImageFiles.length === 0) { toast({ title: "Error", description: "Gambar Produk wajib diunggah.", variant: "destructive" }); return; }

    setIsSubmitting(true);
    const newProductSlug = formProductName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

    try {
        const formDataPayload = new FormData(); // Ganti nama variabel agar tidak konflik
        formDataPayload.append('product_name', formProductName);
        formDataPayload.append('slug', newProductSlug);
        formDataPayload.append('description', formDescription);
        formDataPayload.append('price', formPrice);
        formDataPayload.append('discount', formDiscount || "0");
        formCatalogIds.forEach(catId => formDataPayload.append('catalog', catId));
        formProductImageFiles.forEach(file => formDataPayload.append('product_image', file));
        formDataPayload.append('added_by', loggedInUser.id);
        formDataPayload.append('by_organization', organizationIdFromUrlSlug);

        const newProduct = await pb.collection("danusin_product").create(formDataPayload);

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
        router.push(`/dashboard/organization/settings/${organizationIdFromUrlSlug}?tab=products`); // Arahkan ke tab produk di halaman settings
    } catch (error: any) {
        console.error("--- CREATE PRODUCT ERROR CATCH ---", error);
        let errorMessage = 'Gagal menambahkan produk. Coba lagi.';
        if (error instanceof ClientResponseError) { errorMessage = error.data?.message || error.message; } 
        else if (error instanceof Error) { errorMessage = error.message; }
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingCatalogs && !organizationIdFromUrlSlug) { 
    // Jika ID organisasi belum ada tapi masih loading awal, tampilkan skeleton.
    // Ini untuk mencegah error toast muncul prematur sebelum ID sempat terisi dari params.
    return <div className="p-4 md:p-8 w-full"> <CreateFormSkeleton /> </div>; 
  }


  const filteredCatalogs = catalogs.filter(cat => cat.name.toLowerCase().includes(catalogSearch.toLowerCase()));

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
                    <CardHeader> <CardTitle>Informasi Dasar</CardTitle> <CardDescription>Isi detail utama produk baru Anda.</CardDescription> </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2"><Label htmlFor="form-p-name">Nama Produk <span className="text-red-500">*</span></Label><Input id="form-p-name" value={formProductName} onChange={(e) => setFormProductName(e.target.value)} placeholder="Contoh: Kue Coklat Lezat" /></div>
                        <div className="space-y-2"><Label htmlFor="form-p-desc">Deskripsi</Label><Textarea id="form-p-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Jelaskan produk Anda..." /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label htmlFor="form-p-price">Harga (Rp) <span className="text-red-500">*</span></Label><Input id="form-p-price" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="Contoh: 50000" /></div><div className="space-y-2"><Label htmlFor="form-p-discount">Harga Diskon (Rp)</Label><Input id="form-p-discount" type="number" value={formDiscount} onChange={(e) => setFormDiscount(e.target.value)} placeholder="Kosongkan jika tidak ada" /></div></div>
                        <div className="space-y-2"><Label>Katalog <span className="text-red-500">*</span></Label>
                            <Popover open={isCatalogPopoverOpen} onOpenChange={setIsCatalogPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal" disabled={loadingCatalogs && catalogs.length === 0} aria-expanded={isCatalogPopoverOpen}>
                                        {formCatalogIds.length > 0 ? `${formCatalogIds.length} katalog dipilih` : "Pilih katalog..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <div className="p-2 border-b"><Input placeholder="Cari katalog..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="h-9"/></div>
                                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                        {filteredCatalogs.map((catalog) => (<div key={catalog.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer" onClick={() => { setFormCatalogIds((prev) => prev.includes(catalog.id) ? prev.filter((id) => id !== catalog.id) : [...prev, catalog.id] ); }}><Checkbox id={`cat-${catalog.id}`} checked={formCatalogIds.includes(catalog.id)} onCheckedChange={(checked) => { setFormCatalogIds((prev) => checked ? [...prev, catalog.id] : prev.filter((id) => id !== catalog.id)); }} onClick={(e) => e.stopPropagation()}/><Label htmlFor={`cat-${catalog.id}`} className="cursor-pointer flex-1 font-normal text-sm">{catalog.name}</Label></div>))}
                                        {filteredCatalogs.length === 0 && catalogSearch && <p className="p-2 text-center text-sm text-muted-foreground">Katalog tidak ditemukan.</p>}
                                    </div>
                                    <div className="p-2 border-t"> <Button variant="ghost" size="sm" className="w-full justify-start text-emerald-600 hover:text-emerald-700" onClick={() => {setIsCatalogPopoverOpen(false); setIsNewCatalogDialogOpen(true);}}> <Plus className="mr-2 h-4 w-4" /> Tambah Katalog Baru </Button> </div>
                                </PopoverContent>
                            </Popover>
                            <div className="flex flex-wrap gap-1.5 mt-2 min-h-[26px]">{formCatalogIds.map((id) => { const catalog = catalogs.find((c) => c.id === id); return catalog ? ( <Badge key={id} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">{catalog.name} <button type="button" onClick={() => setFormCatalogIds((prev) => prev.filter((catId) => catId !== id))} className="rounded-full hover:bg-muted-foreground/20 p-0.5 -mr-1 transition-colors" aria-label={`Hapus ${catalog.name}`}> <X className="h-3 w-3" /> </button> </Badge> ) : null; })}</div>
                        </div>
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

        <Dialog open={isNewCatalogDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) {setNewCatalogName(""); setNewCatalogDescription("");} setIsNewCatalogDialogOpen(isOpen); }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader> <DialogTitle>Buat Katalog Baru</DialogTitle> <DialogDescription> Masukkan nama dan deskripsi untuk katalog baru Anda. Katalog ini akan langsung dipilih. </DialogDescription> </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4"> <Label htmlFor="new-catalog-name" className="text-right">Nama</Label> <Input id="new-catalog-name" value={newCatalogName} onChange={(e) => setNewCatalogName(e.target.value)} className="col-span-3" placeholder="Nama Katalog" /> </div>
                    <div className="grid grid-cols-4 items-start gap-4"> <Label htmlFor="new-catalog-description" className="text-right pt-2">Deskripsi</Label> <Textarea id="new-catalog-description" value={newCatalogDescription} onChange={(e) => setNewCatalogDescription(e.target.value)} className="col-span-3" placeholder="Deskripsi singkat katalog (opsional)" /> </div>
                </div>
                <DialogFooter> <Button variant="outline" onClick={() => {setNewCatalogName(""); setNewCatalogDescription(""); setIsNewCatalogDialogOpen(false);}}>Batal</Button> <Button onClick={handleAddNewCatalogInForm} disabled={isSubmittingNewCatalog || !newCatalogName.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white"> {isSubmittingNewCatalog ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat...</> : "Buat & Pilih Katalog"} </Button> </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}