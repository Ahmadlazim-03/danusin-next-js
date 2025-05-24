'use client'; 

import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import Script from "next/script";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isProfileSection = pathname.startsWith('/dashboard');
  const globalHeadElements = (
    <>
      <link rel="icon" href="/logo-danusin-hijau.png" />
      <link rel="apple-touch-icon" href="/logo-danusin-hijau.png" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet"
      />
      <title>Danusin</title> 
      <meta name="description" content="Danusin - Lacak dan cari dana usaha yang anda inginkan" /> 
      <meta name="generator" content="v0.dev" />
    </>
  );

  const conditionalVendorCSS = !isProfileSection && (
    <>
      <link rel="stylesheet" href="/assets/vendor/bootstrap/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/assets/vendor/bootstrap-icons/bootstrap-icons.css" />
      <link rel="stylesheet" href="/assets/vendor/aos/aos.css" />
      <link rel="stylesheet" href="/assets/vendor/glightbox/css/glightbox.min.css" />
      <link rel="stylesheet" href="/assets/vendor/swiper/swiper-bundle.min.css" />
      <link rel="stylesheet" href="/assets/css/main.css" />
    </>
  );

  const conditionalVendorScripts = !isProfileSection && (
    <>
      <Script
        src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="/assets/vendor/php-email-form/validate.js"
        strategy="afterInteractive"
      />
      <Script
        src="/assets/vendor/aos/aos.js"
        strategy="afterInteractive"
      />
      <Script
        src="/assets/vendor/glightbox/js/glightbox.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="/assets/vendor/swiper/swiper-bundle.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="/assets/vendor/purecounter/purecounter_vanilla.js"
        strategy="afterInteractive"
      />
      <Script
        src="/assets/js/main.js"
        strategy="afterInteractive"
      />
    </>
  );

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {globalHeadElements}
        {conditionalVendorCSS}
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main>{children}</main>
          </ThemeProvider>
          <Toaster />
        </AuthProvider>
        
        {conditionalVendorScripts}
      </body>
    </html>
  );
}
