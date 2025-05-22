"use client";

import { useEffect } from "react";
import Image from "next/image";
import AOS from "aos";
import PhoneMockup from "./phoneMockup";

interface Feature {
  title: string;
  description: string;
  icon: string;
}

export default function FeaturesSection() {
  const leftFeatures: Feature[] = [
    {
      title: "Akses di Semua Perangkat",
      description:
        "Gunakan Danusin di ponsel, tablet, atau komputer untuk mengelola kampanye danusan Anda kapan saja, di mana saja.",
      icon: "bi bi-device-ssd",
    },
    {
      title: "Pelacakan Real-Time",
      description:
        "Lihat lokasi penjual UMKM secara langsung melalui peta interaktif di aplikasi Danusin.",
      icon: "bi bi-geo-alt",
    },
    {
      title: "Notifikasi Instan",
      description:
        "Dapatkan pemberitahuan langsung tentang perkembangan kampanye dan aktivitas penjual favorit Anda.",
      icon: "bi bi-bell",
    },
  ];

  const rightFeatures: Feature[] = [
    {
      title: "Antarmuka Mudah",
      description:
        "Nikmati pengalaman pengguna yang intuitif untuk membuat dan mengelola kampanye dengan cepat dan mudah.",
      icon: "bi bi-grid",
    },
    {
      title: "Dukungan Komunitas",
      description:
        "Terhubung dengan pengusaha lain dan pendukung melalui fitur komunitas di aplikasi Danusin.",
      icon: "bi bi-people",
    },
    {
      title: "Analitik Bisnis",
      description:
        "Pantau performa kampanye dan penjualan Anda dengan laporan dan analitik yang mudah dipahami.",
      icon: "bi bi-graph-up",
    },
  ];

  useEffect(() => {
    AOS.init({
      duration: 400,
      easing: "ease-out",
      once: true,
    });
  }, []);

  return (
    <section id="features-2" className="features-2 section">
      <div className="container">
        <div className="row align-items-center">
          {/* Left Column */}
          <div className="col-lg-4 col-12 d-flex justify-content-center flex-column">
            {leftFeatures.map((feature, index) => (
              <div
                key={index}
                className={`feature-item text-md-end text-center ${
                  index < leftFeatures.length - 1 ? "mb-5 mb-md-5 mb-3" : ""
                }`}
                data-aos="fade-right"
                data-aos-delay={100 + index * 100} // Staggered delay: 100, 200, 300 ms
              >
                <div className="d-flex align-items-center justify-content-md-end justify-content-center gap-4">
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                  <div className="feature-icon flex-shrink-0">
                    <i className={feature.icon}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Center Column (Phone Mockup) */}
          <div className="col-lg-4 col-12 d-flex justify-content-center">
            <PhoneMockup />
          </div>

          {/* Right Column */}
          <div className="col-lg-4 col-12 d-flex justify-content-center flex-column">
            {rightFeatures.map((feature, index) => (
              <div
                key={index}
                className={`feature-item text-md-start text-center ${
                  index < rightFeatures.length - 1 ? "mb-5 mb-md-5 mb-3" : ""
                }`}
                data-aos="fade-left"
                data-aos-delay={100 + index * 100} // Staggered delay: 100, 200, 300 ms
              >
                <div className="d-flex align-items-center justify-content-md-start justify-content-center gap-4">
                  <div className="feature-icon flex-shrink-0">
                    <i className={feature.icon}></i>
                  </div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
