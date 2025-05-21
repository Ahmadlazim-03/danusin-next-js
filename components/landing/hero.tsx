'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {

  return (
    <section id="hero" className="hero section">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="hero-content">
              <div className="company-badge mb-4">
                <i className="bi bi-gear-fill me-2"></i>
                Memberdayakan Pengusaha
              </div>

              <h1 className="mb-4">
                Wujudkan <br />
                Usaha Anda <br />
                Bersama <span className="accent-text">Danusin</span>
              </h1>

              <p className="mb-4 mb-md-5">
                Danusin menghubungkan pengusaha penuh semangat dengan pendukung untuk mewujudkan impian mereka. Mulai kampanye danusan, lacak penjual aktif secara real-time, dan bergabung dengan komunitas UMKM yang dinamis.
              </p>

              <div className="hero-buttons">
                <Link href="/register" className="btn btn-primary me-0 me-sm-2 mx-1">
                  Mulai Danusan
                </Link>
                <a href="https://www.youtube.com/watch?v=Y7f98aduVJ8" className="btn btn-link mt-2 mt-sm-0 glightbox">
                  <i className="bi bi-play-circle me-1"></i>
                  Tonton Cara Kerjanya
                </a>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-image">
              <Image
                src="/assets/img/illustration-1.webp"
                alt="Ilustrasi Platform Danusin"
                className="img-fluid"
                width={500}
                height={500}
              />

              <div className="customers-badge">
                <div className="customer-avatars">
                  <Image src="/assets/img/avatar-1.webp" alt="Pengusaha 1" className="avatar" width={40} height={40} />
                  <Image src="/assets/img/avatar-2.webp" alt="Pengusaha 2" className="avatar" width={40} height={40} />
                  <Image src="/assets/img/avatar-3.webp" alt="Pengusaha 3" className="avatar" width={40} height={40} />
                  <Image src="/assets/img/avatar-4.webp" alt="Pengusaha 4" className="avatar" width={40} height={40} />
                  <Image src="/assets/img/avatar-5.webp" alt="Pengusaha 5" className="avatar" width={40} height={40} />
                  <span className="avatar more">10k+</span>
                </div>
                <p className="mb-0 mt-2">10.000+ pengusaha didanai melalui Danusin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row stats-row gy-4 mt-5">
          <div className="col-lg-3 col-md-6">
            <div className="stat-item">
              <div className="stat-icon">
                <i className="bi bi-trophy"></i>
              </div>
              <div className="stat-content">
                <h4>500+ Kampanye</h4>
                <p className="mb-0">Berhasil didanai</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="stat-item">
              <div className="stat-icon">
                <i className="bi bi-geo-alt"></i>
              </div>
              <div className="stat-content">
                <h4>10k+ Penjual</h4>
                <p className="mb-0">Dilacak secara real-time</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="stat-item">
              <div className="stat-icon">
                <i className="bi bi-people"></i>
              </div>
              <div className="stat-content">
                <h4>1k+ Organisasi</h4>
                <p className="mb-0">Bermitra dengan Danusin</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div className="stat-item">
              <div className="stat-icon">
                <i className="bi bi-currency-dollar"></i>
              </div>
              <div className="stat-content">
                <h4>Rp 50M+</h4>
                <p className="mb-0">Terkumpul untuk UMKM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
