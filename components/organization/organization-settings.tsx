"use client"

import React, { useEffect, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase";
import { ClientResponseError } from "pocketbase";
import { useRouter } from "next/navigation"
import Image from "next/image";
import { Trash2, UploadCloud, UserCircle, Link2, TargetIcon, Percent, Info } from "lucide-react";

// Tipe data yang diharapkan oleh komponen ini
interface UserDataExpanded {
    id: string;
    collectionId: string;
    collectionName: string;
    name?: string;
    username?: string;
    avatar?: string;
    [key: string]: any;
}

interface OrganizationDataProps { // Ubah nama agar tidak konflik jika di file yang sama
    id: string;
    collectionId: string;
    collectionName: string;
    organization_name: string;
    organization_description: string;
    organization_slug: string;
    organization_image?: string;
    target?: number;
    target_progress?: number;
    group_phone?: string;
    created_by: string;
    expand?: {
        created_by?: UserDataExpanded;
    };
    [key: string]: any;
}

export function OrganizationSettings({ organization, userRole }: { organization: OrganizationDataProps; userRole: string | null }) {
  const router = useRouter()
  const [name, setName] = useState(organization.organization_name || "")
  const [description, setDescription] = useState(organization.organization_description || "")
  const [slug, setSlug] = useState(organization.organization_slug || "")
  const [target, setTarget] = useState(organization.target?.toString() || "")
  const [targetProgress, setTargetProgress] = useState(organization.target_progress?.toString() || "")
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(organization.group_phone || "")

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    organization.organization_image && organization.collectionId // Pastikan collectionId ada
      ? pb.getFileUrl(organization, organization.organization_image, { thumb: '100x100' })
      : null
  );
  const [clearImage, setClearImage] = useState(false);

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = userRole === "admin"

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setClearImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setClearImage(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Nama organisasi wajib diisi", variant: "destructive" })
      return
    }
    if (whatsappGroupUrl && !whatsappGroupUrl.startsWith("https://chat.whatsapp.com/")) {
        toast({ title: "Error", description: "Format URL Grup WhatsApp tidak valid. Harus dimulai dengan https://chat.whatsapp.com/", variant: "destructive"});
        return;
    }

    setIsSaving(true)
    const formData = new FormData();
    formData.append('organization_name', name);
    formData.append('organization_slug', slug);
    formData.append('organization_description', description);
    
    formData.append('target', target || '0');
    formData.append('target_progress', targetProgress || '0');
    formData.append('group_phone', whatsappGroupUrl);

    if (imageFile) {
      formData.append('organization_image', imageFile);
    } else if (clearImage) {
      formData.append('organization_image', '');
    }

    try {
      const updatedOrg = await pb.collection("danusin_organization").update(organization.id, formData)

      toast({
        title: "Sukses",
        description: "Pengaturan organisasi berhasil diperbarui",
      })
      // Perbarui state lokal dengan data terbaru, terutama untuk URL gambar
      if (updatedOrg.organization_image) {
        // Pastikan updatedOrg memiliki collectionId dan collectionName jika diperlukan untuk getFileUrl
        // Untuk PocketBase, biasanya record yang di-return dari update sudah lengkap
        const orgRecordForFile = {
            ...updatedOrg,
            collectionId: organization.collectionId, // Gunakan dari prop awal jika tidak ada di updatedOrg
            collectionName: organization.collectionName // Gunakan dari prop awal
        } as OrganizationDataProps; // Cast ke tipe yang benar
        setImagePreview(pb.getFileUrl(orgRecordForFile, updatedOrg.organization_image, { thumb: '100x100' }));
      } else if (clearImage) {
        setImagePreview(null);
      }
      setImageFile(null);
      setClearImage(false);
      
      if (slug !== organization.organization_slug) {
        router.refresh(); // Untuk memuat ulang data jika slug berubah, karena slug sering jadi bagian path
      }

    } catch (error: any) {
      console.error("Error updating organization:", error)
      let errorMessage = "Gagal memperbarui pengaturan organisasi";
      if (error instanceof ClientResponseError) {
        const responseData = error.data?.data;
        if (responseData) {
            const fieldErrors = Object.keys(responseData)
                .map(key => `${key.replace('organization_', '')}: ${responseData[key].message}`)
                .join(', ');
            if (fieldErrors) errorMessage = fieldErrors;
        } else {
            errorMessage = error.data?.message || error.message || errorMessage;
        }
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    toast({ title: "Proses Penghapusan...", description: "Menghapus data terkait organisasi, ini mungkin memakan waktu."})
    try {
      const productsToDelete = await pb.collection("danusin_product").getFullList({ filter: `by_organization = "${organization.id}"`, fields: 'id'});
      for (const product of productsToDelete) {
        const detailsToDelete = await pb.collection("danusin_product_detail").getFullList({ filter: `id_product = "${product.id}"`, fields: 'id'});
        for (const detail of detailsToDelete) { await pb.collection("danusin_product_detail").delete(detail.id); }
        await pb.collection("danusin_product").delete(product.id);
      }
      const relatedRoles = await pb.collection("danusin_user_organization_roles").getFullList({ filter: `organization = "${organization.id}"`, fields: 'id'});
      for (const role of relatedRoles) { await pb.collection("danusin_user_organization_roles").delete(role.id); }
      await pb.collection("danusin_organization").delete(organization.id)
      toast({ title: "Sukses", description: "Organisasi dan semua data terkait berhasil dihapus" })
      router.push("/dashboard/organizations")
    } catch (error: any) {
      console.error("Error deleting organization or related data:", error)
      let deleteErrorMessage = "Gagal menghapus organisasi atau data terkait. Periksa konsol untuk detail.";
      if (error instanceof ClientResponseError) {
        deleteErrorMessage = error.data?.message || error.message || deleteErrorMessage;
      } else if (error.message) {
        deleteErrorMessage = error.message;
      }
      toast({ title: "Error Penghapusan", description: deleteErrorMessage, variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const creatorInfo = organization.expand?.created_by;
  const creatorName = creatorInfo?.name || creatorInfo?.username || organization.created_by;
  const creatorAvatar = (creatorInfo && creatorInfo.avatar && creatorInfo.collectionId && creatorInfo.collectionName) // Pastikan field ini ada
    ? pb.getFileUrl(creatorInfo, creatorInfo.avatar, { thumb: '50x50' })
    : null;


  return (
    <div className="space-y-8">
      {/* Informasi Utama */}
      <div className="space-y-4 border-b pb-6">
        {/* ... (Konten form seperti sebelumnya) ... */}
        <h3 className="text-lg font-medium">Informasi Utama</h3>
        <div className="space-y-2">
          <Label htmlFor="name">Nama Organisasi <span className="text-red-500">*</span></Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''))} disabled={!isAdmin} />
          <p className="text-xs text-muted-foreground">Akan digunakan di URL, misal: danus.in/org/{slug || organization.organization_slug}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi Organisasi</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isAdmin} rows={4} />
        </div>
      </div>

      {/* Gambar & Kontak */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-medium">Gambar & Kontak</h3>
        <div className="space-y-2">
            <Label htmlFor="organization_image_input">Gambar Organisasi</Label>
            <div className="flex items-center gap-4">
                {imagePreview ? (<Image src={imagePreview} alt="Preview Gambar Organisasi" width={80} height={80} className="rounded-md border object-cover" />) 
                : (<div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border"><UploadCloud className="w-8 h-8 text-muted-foreground" /></div>)}
                <div className="space-y-2">
                    <Input id="organization_image_input" type="file" accept="image/*" onChange={handleImageChange} disabled={!isAdmin} className="h-auto py-2 px-3 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted hover:file:bg-muted/80 cursor-pointer max-w-xs"/>
                    {imagePreview && (<Button variant="outline" size="sm" onClick={handleRemoveImage} disabled={!isAdmin}><Trash2 className="w-3 h-3 mr-1.5" /> Hapus Gambar</Button>)}
                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF. Maks 5MB.</p>
                </div>
            </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp_group_url">Link Grup WhatsApp</Label>
          <div className="flex items-center">
            <Link2 className="h-5 w-5 text-muted-foreground mr-2"/><Input id="whatsapp_group_url" type="url" value={whatsappGroupUrl} onChange={(e) => setWhatsappGroupUrl(e.target.value)} placeholder="https://chat.whatsapp.com/XYZ..." disabled={!isAdmin}/>
          </div>
          <p className="text-xs text-muted-foreground">Masukkan link undangan grup WhatsApp organisasi Anda.</p>
        </div>
      </div>
      
      {/* Target Organisasi */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-medium">Target Organisasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="target">Target (Misal: Dana, Poin, dll.)</Label><div className="flex items-center"><TargetIcon className="h-5 w-5 text-muted-foreground mr-2"/><Input id="target" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Contoh: 10000000" disabled={!isAdmin} /></div></div>
            <div className="space-y-2"><Label htmlFor="target_progress">Progres Target Saat Ini</Label><div className="flex items-center"><Percent className="h-5 w-5 text-muted-foreground mr-2"/><Input id="target_progress" type="number" value={targetProgress} onChange={(e) => setTargetProgress(e.target.value)} placeholder="Contoh: 2500000" disabled={!isAdmin} /></div></div>
        </div>
      </div>

      {/* Informasi Pembuat (Read-only) */}
      <div className="space-y-2">
        <Label>Dibuat Oleh</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50 min-h-[58px]">
            {creatorAvatar ? (<Image src={creatorAvatar} alt="Avatar Pembuat" width={32} height={32} className="rounded-full" />)
            : (<UserCircle className="w-8 h-8 text-muted-foreground" />)}
            <span className="text-sm text-muted-foreground">{creatorName || 'Memuat...'}</span>
        </div>
        <p className="text-xs text-muted-foreground">Informasi ini tidak dapat diubah. Untuk menampilkan nama, pastikan data organisasi menyertakan detail pengguna pembuat (expand 'created_by').</p>
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t gap-4">
        <Button onClick={handleSave} disabled={isSaving || !isAdmin} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
        {isAdmin && (<AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" disabled={isDeleting} className="w-full sm:w-auto">{isDeleting ? "Menghapus..." : "Hapus Organisasi"}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Ini akan menghapus organisasi <span className="font-semibold"> {organization.organization_name} </span> secara permanen beserta semua produk, detail produk, dan peran pengguna yang terkait.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Sedang Menghapus..." : "Ya, Hapus Permanen"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>)}
      </div>
    </div>
  )
}