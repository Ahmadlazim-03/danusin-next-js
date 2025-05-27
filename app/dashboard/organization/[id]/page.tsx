"use client"

import React, { useEffect, useState } from "react"; // Hapus useCallback dan useRef jika tidak digunakan di file ini
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pb } from "@/lib/pocketbase";
import { ArrowLeft, Building2, LayoutGrid, Package, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { OrganizationCatalogs } from "@/components/organization/organization-catalogs";
import { OrganizationMembersList } from "@/components/organization/organization-members-list";
import { OrganizationProducts } from "@/components/organization/organization-products";
import { OrganizationSettings } from "@/components/organization/organization-settings"; // Pastikan path ini benar

// --- TIPE DATA YANG DIPERBARUI ---
interface ExpandedUserData { // Tipe untuk data user yang di-expand
  id: string;
  collectionId: string;
  collectionName: string;
  name?: string;
  username?: string;
  avatar?: string;
  [key: string]: any;
}

type OrganizationData = {
  id: string;
  collectionId: string;    // Penting untuk PocketBase getFileUrl
  collectionName: string;  // Penting untuk PocketBase getFileUrl
  organization_name: string;
  organization_description: string;
  organization_slug: string;
  organization_image?: string;
  target?: number;
  target_progress?: number;
  group_phone?: string;      // Akan menyimpan URL WhatsApp
  created_by: string;
  expand?: {
    created_by?: ExpandedUserData;
  };
  [key: string]: any;
};
// --- AKHIR TIPE DATA YANG DIPERBARUI ---


export default function OrganizationManagePage() {
  const params = useParams(); // Menggunakan params untuk mendapatkan id
  const id = params.id as string; // Ambil id dari params
  const router = useRouter();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchOrganization = async () => {
      if (!user || !id) {
        // Jika user atau id belum ada, jangan fetch, kecuali ini render awal & belum ada error
        if (!user && isMounted && !error) { // Cek isMounted sebelum set loading
             // Tidak perlu setLoading(true) di sini karena akan di-set di awal fetch
        }
        // Jika id tidak ada setelah loading awal, set error
        if (!id && !loading) {
            if(isMounted) setError("Organization ID not found in URL.");
        }
        if(isMounted && !id) setLoading(false); // Hentikan loading jika id tidak ada
        return;
      }
      
      if(isMounted) setLoading(true);

      try {
        const roleResult = await pb
          .collection("danusin_user_organization_roles")
          .getFirstListItem(`user="${user.id}" && organization="${id}"`, {
            signal: controller.signal,
            $autoCancel: false,
          });

        if (!isMounted) return;

        if (!roleResult) {
          setError("Anda tidak memiliki akses ke organisasi ini atau organisasi tidak ditemukan.");
          if(isMounted) setLoading(false);
          return;
        }
        setUserRole(roleResult.role);

        // --- TAMBAHKAN expand: 'created_by' ---
        const orgResult = await pb.collection("danusin_organization").getOne(id, { // id sudah string
          signal: controller.signal,
          $autoCancel: false,
          expand: 'created_by', // Untuk mendapatkan detail user pembuat
        });
        // --- AKHIR PENAMBAHAN ---

        if (!isMounted) return;
        setOrganization(orgResult as OrganizationData); // Type assertion langsung ke OrganizationData yang lebih lengkap

      } catch (err: any) {
        if (!isMounted) return;
        if (err.name !== "AbortError" && !(err.isAbort || (err.message && err.message.includes('autocancelled')))) {
          console.error("Error fetching organization details:", err);
          if (err.status === 404 || err.data?.message?.includes("failed to find a record")) {
             setError("Organisasi tidak ditemukan atau Anda tidak memiliki akses.");
          } else {
             setError("Gagal memuat detail organisasi. Silakan coba lagi.");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrganization();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, user, router]); // Tambahkan router ke dependency array jika digunakan dalam effect (misal untuk redirect)


  const tabsConfig = [
    { value: "members", label: "Anggota", icon: Users, alwaysShow: true }, // Ganti label
    { value: "products", label: "Produk", icon: Package, roles: ["admin", "moderator"] }, // Ganti label
    { value: "catalogs", label: "Katalog", icon: LayoutGrid, roles: ["admin", "moderator"] }, // Ganti label
    { value: "settings", label: "Pengaturan", icon: Settings, roles: ["admin"] }, // Ganti label
  ];

  const availableTabs = tabsConfig.filter(tab => {
    if (tab.alwaysShow) return true;
    return tab.roles && userRole && tab.roles.includes(userRole);
  });


  if (loading) {
    return (
      <div className="w-full"> {/* Menggunakan w-full untuk full width container */}
        <div className="space-y-8 max-w-5xl mx-auto"> {/* max-w untuk konten di tengah */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-8 w-48 sm:w-64" />
          </div>
          <div className="bg-neutral-100/90 dark:bg-zinc-800/70 mb-5 md:mb-6 p-1.5 border border-neutral-200/90 dark:border-zinc-700/50 rounded-lg flex w-full space-x-1 sm:space-x-1.5">
            {[...Array(4)].map((_, i) => ( // Tampilkan 4 skeleton tabs sebagai default
                <Skeleton key={i} className="h-9 sm:h-10 flex-1 rounded-[0.3rem]" />
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-5xl mx-auto">
          <Building2 className="mb-4 h-16 w-16 text-destructive/70" />
          <h2 className="mb-3 text-2xl font-bold text-destructive">{error}</h2>
          <p className="mb-6 text-muted-foreground max-w-md">
            Silakan periksa apakah ID organisasi sudah benar atau Anda memiliki izin yang diperlukan.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-5xl mx-auto">
          <Building2 className="mb-4 h-16 w-16 text-muted-foreground/60" />
          <h2 className="mb-2 text-2xl font-bold">Organisasi Tidak Ditemukan</h2>
          <p className="mb-6 text-muted-foreground max-w-md">
            Organisasi yang Anda cari tidak dapat ditemukan.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full"> {/* Menggunakan w-full untuk full width container */}
      <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto"> {/* max-w untuk konten di tengah */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="icon" asChild className="rounded-md flex-shrink-0">
            {/* Ganti Link ini ke halaman daftar organisasi Anda */}
            <Link href="/dashboard/organization" aria-label="Kembali ke Daftar Organisasi">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate" title={organization.organization_name}>
            {organization.organization_name || "Nama Organisasi"}
          </h1>
        </div>

        <Tabs defaultValue={availableTabs[0]?.value || "members"} className="w-full">
          <TabsList
            role="tablist"
            className="bg-neutral-100/90 dark:bg-zinc-800/70 backdrop-blur-sm mb-5 md:mb-6 p-1.5 border border-neutral-200/90 dark:border-zinc-700/50 rounded-lg flex w-full space-x-1 sm:space-x-1.5"
          >
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all duration-200 flex-1 min-w-[80px] sm:min-w-[100px] whitespace-nowrap text-neutral-600 hover:bg-neutral-200/70 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:text-emerald-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:opacity-90 flex items-center justify-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="members" className="mt-0">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-xl">Anggota Organisasi</CardTitle><CardDescription>Lihat dan kelola anggota beserta peran mereka.</CardDescription></CardHeader>
              <CardContent>
                <OrganizationMembersList organizationId={id} userRole={userRole} />
              </CardContent>
            </Card>
          </TabsContent>

          {(userRole === "admin" || userRole === "moderator") && (
            <TabsContent value="products" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-xl">Produk Organisasi</CardTitle><CardDescription>Kelola produk yang ditawarkan oleh organisasi ini.</CardDescription></CardHeader>
                <CardContent>
                  <OrganizationProducts organizationId={id} userRole={userRole} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {(userRole === "admin" || userRole === "moderator") && (
            <TabsContent value="catalogs" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-xl">Katalog Organisasi</CardTitle><CardDescription>Kelompokkan produk ke dalam katalog.</CardDescription></CardHeader>
                <CardContent>
                  <OrganizationCatalogs organizationId={id} userRole={userRole} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userRole === "admin" && (
            <TabsContent value="settings" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-xl">Pengaturan Organisasi</CardTitle><CardDescription>Perbarui detail, tampilan, dan preferensi organisasi Anda.</CardDescription></CardHeader>
                <CardContent>
                  {/* Pastikan 'organization' yang dikirim ke OrganizationSettings adalah tipe yang benar */}
                  {organization && <OrganizationSettings organization={organization} userRole={userRole} />}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}