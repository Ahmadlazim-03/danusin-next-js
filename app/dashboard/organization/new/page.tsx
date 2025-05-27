"use client"

import React, { useEffect, useState, ChangeEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { pb } from "@/lib/pocketbase";
import { ClientResponseError } from "pocketbase";
import { Loader2, ArrowLeft, UploadCloud, Link2, TargetIcon, Percent, Info, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image";

export default function NewOrganizationPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter() // useRouter sudah diinisialisasi
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    organization_name: "",
    organization_description: "",
    target: "" as number | "",
    target_progress: "" as number | "",
    whatsappGroupUrl: "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value,
    }));
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: "Ukuran gambar maksimal adalah 5MB.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({ title: "Error Autentikasi", description: "Anda harus login untuk membuat organisasi", variant: "destructive"})
      return
    }
    if (!formData.organization_name.trim()) {
      toast({ title: "Error Validasi", description: "Nama organisasi wajib diisi", variant: "destructive"})
      return
    }
    if (formData.whatsappGroupUrl && !formData.whatsappGroupUrl.startsWith("https://chat.whatsapp.com/")) {
        toast({ title: "Error Validasi", description: "Format URL Grup WhatsApp tidak valid.", variant: "destructive"});
        return;
    }
    
    const targetValue = formData.target === "" ? 0 : Number(formData.target);
    const targetProgressValue = formData.target_progress === "" ? 0 : Number(formData.target_progress);

    if (isNaN(targetValue) || targetValue < 0) {
        toast({ title: "Error Validasi", description: "Target harus berupa angka positif atau kosong.", variant: "destructive"});
        return;
    }
      if (isNaN(targetProgressValue) || targetProgressValue < 0) {
        toast({ title: "Error Validasi", description: "Progres Target harus berupa angka positif atau kosong.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true)

    try {
      const slug = formData.organization_name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/^-|-$/g, "");

      const dataPayload = new FormData();
      dataPayload.append('organization_name', formData.organization_name);
      dataPayload.append('organization_description', formData.organization_description);
      dataPayload.append('organization_slug', slug);
      dataPayload.append('target', targetValue.toString());
      dataPayload.append('target_progress', targetProgressValue.toString());
      dataPayload.append('group_phone', formData.whatsappGroupUrl);
      dataPayload.append('created_by', user.id);

      if (imageFile) {
        dataPayload.append('organization_image', imageFile);
      }

      const organization = await pb.collection("danusin_organization").create(dataPayload);

      await pb.collection("danusin_user_organization_roles").create({
        user: user.id,
        organization: organization.id,
        role: "admin",
      });

      toast({ title: "Organisasi Dibuat", description: "Organisasi Anda berhasil dibuat" })
      router.push("/dashboard/organization"); // Arahkan ke daftar organisasi setelah sukses
    } catch (error: any) {
      console.error("Error creating organization:", error);
      let errorMessage = "Terjadi error saat membuat organisasi Anda. Silakan coba lagi.";
      if (error instanceof ClientResponseError && error.data && error.data.data) {
        const pbErrors = error.data.data;
        const fieldErrorMessages = Object.keys(pbErrors).map(key => {
            const fieldName = key.replace("organization_","");
            return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${pbErrors[key].message}`;
        }).join("\n");
        if (fieldErrorMessages) errorMessage = fieldErrorMessages;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Error Pembuatan Organisasi", description: errorMessage, variant: "destructive", duration: 7000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="w-full">
      <div className="space-y-8"> 
        <div className="flex items-center gap-3">
            {/* --- PERUBAHAN TOMBOL BACK DI SINI --- */}
            <Button
                variant="outline"
                size="icon"
                type="button" 
                className="rounded-md flex-shrink-0"
                onClick={() => router.back()}
                aria-label="Kembali ke halaman sebelumnya"
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* --- AKHIR PERUBAHAN TOMBOL BACK --- */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Buat Organisasi Baru</h1>
            <p className="text-muted-foreground">Isi detail untuk organisasi baru Anda.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Utama</CardTitle>
                <CardDescription>Nama, slug (otomatis), dan deskripsi organisasi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization_name">Nama Organisasi <span className="text-red-500">*</span></Label>
                  <Input
                    id="organization_name"
                    placeholder="Masukkan nama organisasi"
                    value={formData.organization_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization_slug_display">URL Slug (Otomatis)</Label>
                  <Input 
                    id="organization_slug_display" 
                    value={formData.organization_name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/^-|-$/g, "")} 
                    readOnly 
                    disabled 
                    className="bg-muted/50"
                  />
                    <p className="text-xs text-muted-foreground">
                      Slug akan di-generate otomatis berdasarkan nama organisasi.
                    </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization_description">Deskripsi Organisasi</Label>
                  <Textarea
                    id="organization_description"
                    placeholder="Jelaskan tentang organisasi Anda"
                    rows={4}
                    value={formData.organization_description}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gambar & Kontak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="organization_image_input">Gambar Organisasi</Label>
                    <div className="flex items-center gap-4">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview Gambar Organisasi" width={80} height={80} className="rounded-md border object-cover" />
                        ) : (
                            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border">
                            <UploadCloud className="w-8 h-8 text-muted-foreground" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input 
                                id="organization_image_input" 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                className="h-auto py-2 px-3 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted hover:file:bg-muted/80 cursor-pointer max-w-xs"
                            />
                            <p className="text-xs text-muted-foreground">JPG, PNG, GIF. Maks 5MB.</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappGroupUrl">Link Grup WhatsApp</Label>
                  <div className="flex items-center">
                    <Link2 className="h-5 w-5 text-muted-foreground mr-2"/>
                    <Input 
                      id="whatsappGroupUrl"
                      type="url"
                      placeholder="https://chat.whatsapp.com/XYZ..."
                      value={formData.whatsappGroupUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Target Organisasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="target">Target (Misal: Dana, Poin)</Label>
                        <div className="flex items-center">
                            <TargetIcon className="h-5 w-5 text-muted-foreground mr-2"/>
                            <Input
                                id="target"
                                type="number"
                                placeholder="Contoh: 10000000"
                                value={formData.target}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="target_progress">Progres Target Saat Ini</Label>
                          <div className="flex items-center">
                            <Percent className="h-5 w-5 text-muted-foreground mr-2"/>
                            <Input
                                id="target_progress"
                                type="number"
                                placeholder="Contoh: 0 (akan dimulai dari 0)"
                                value={formData.target_progress}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>

            <CardFooter className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" asChild type="button">
                <Link href="/dashboard/organization">Batal</Link>
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  "Buat Organisasi"
                )}
              </Button>
            </CardFooter>
          </div>
        </form>
      </div>
    </main>
  )
}