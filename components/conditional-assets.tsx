'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect } from 'react'

const ConditionalAssets = () => {
  const pathname = usePathname()
  
  // Halaman yang memerlukan vendor assets
  const requiresVendorAssets = ['/', '/about', '/features', '/contact'].includes(pathname)

  useEffect(() => {
    if (requiresVendorAssets) {
      // Memuat CSS secara dinamis
      const cssFiles = [
        '/assets/vendor/bootstrap/css/bootstrap.min.css',
        '/assets/vendor/bootstrap-icons/bootstrap-icons.css',
        '/assets/vendor/aos/aos.css',
        '/assets/vendor/glightbox/css/glightbox.min.css',
        '/assets/vendor/swiper/swiper-bundle.min.css',
        '/assets/css/main.css'
      ]

      cssFiles.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = href
          document.head.appendChild(link)
        }
      })
    }
  }, [requiresVendorAssets])

  if (!requiresVendorAssets) {
    return null
  }

  return (
    <>
      {/* Vendor JS Scripts - hanya untuk halaman tertentu */}
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
  )
}

export default ConditionalAssets