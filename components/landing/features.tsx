'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import AOS from "aos"

interface Tab {
  id: string;
  title: string;
  content: {
    title: string;
    description?: string;
    list: string[];
    footer?: string;
    image: string;
  };
}

export default function Features() {
  const [activeTab, setActiveTab] = useState('features-tab-1');

  const tabs: Tab[] = [
    {
      id: 'features-tab-1',
      title: 'Kampanye Danusan',
      content: {
        title: 'Luncurkan Kampanye Crowdfunding Anda',
        description:
          'Mulai perjalanan bisnis Anda dengan kampanye danusan yang mudah dan cepat di platform Danusin.',
        list: [
          'Buat kampanye dengan langkah sederhana dan intuitif.',
          'Dapatkan dukungan dari komunitas pendukung di seluruh Indonesia.',
          'Pantau kemajuan pendanaan secara real-time.',
        ],
        image: '/assets/img/features-illustration-1.webp',
      },
    },
    {
      id: 'features-tab-2',
      title: 'Pelacakan Real-Time',
      content: {
        title: 'Lacak Penjual Aktif di Peta',
        description:
          'Temukan dan dukung penjual UMKM favorit Anda dengan fitur peta real-time kami.',
        list: [
          'Lihat lokasi penjual aktif secara langsung.',
          'Ketahui produk dan organisasi terkait setiap penjual.',
          'Berinteraksi dengan penjual terdekat untuk mendukung bisnis lokal.',
          'Akses informasi terkini tentang aktivitas penjualan.',
        ],
        image: '/assets/img/features-illustration-2.webp',
      },
    },
    {
      id: 'features-tab-3',
      title: 'Komunitas UMKM',
      content: {
        title: 'Bangun dan Bergabung dengan Komunitas Pengusaha',
        list: [
          'Terhubung dengan pengusaha lain untuk berbagi pengalaman.',
          'Dapatkan akses ke sumber daya bisnis dan pelatihan.',
          'Bermitra dengan organisasi terpercaya untuk pertumbuhan bisnis.',
        ],
        footer:
          'Danusin lebih dari sekadar platform; ini adalah komunitas yang mendukung kesuksesan UMKM Anda.',
        image: '/assets/img/features-illustration-3.webp',
      },
    },
  ];

     useEffect(() => {
        AOS.init({
          duration: 400, 
          easing: "ease-out", 
          once: true, 
        })
      }, [])

  return (
    <section id="features" className="features section">
      <div className="container section-title" data-aos="fade-up" data-aos-delay="100">
        <h2>Fitur</h2>
        <p>Jelajahi fitur-fitur unggulan Danusin yang mendukung kesuksesan UMKM Anda</p>
      </div>

      <div className="container">
        <div className="d-flex justify-content-center" data-aos="fade-up" data-aos-delay="200">
          <ul className="nav nav-tabs">
            {tabs.map((tab) => (
              <li key={tab.id} className="nav-item">
                <a
                  className={`nav-link ${activeTab === tab.id ? 'active show' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  data-bs-toggle="tab"
                  data-bs-target={`#${tab.id}`}
                >
                  <h4>{tab.title}</h4>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="tab-content">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab-pane fade ${activeTab === tab.id ? 'active show' : ''}`}
              id={tab.id}
            >
              <div className="row">
                <div
                  className="col-lg-6 order-2 order-lg-1 mt-3 mt-lg-0 d-flex flex-column justify-content-center"
                  data-aos="fade-up"
                  data-aos-delay="300"
                >
                  <h3>{tab.content.title}</h3>
                  {tab.content.description && (
                    <p className="fst-italic">{tab.content.description}</p>
                  )}
                  <ul>
                    {tab.content.list.map((item, i) => (
                      <li key={i} data-aos="fade-up" data-aos-delay={400 + i * 100}>
                        <i className="bi bi-check2-all"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {tab.content.footer && (
                    <p className="fst-italic" data-aos="fade-up" data-aos-delay="700">
                      {tab.content.footer}
                    </p>
                  )}
                </div>
                <div
                  className="col-lg-6 order-1 order-lg-2 text-center"
                  data-aos="fade-left"
                  data-aos-delay="800"
                >
                  <Image
                    src={tab.content.image}
                    alt={tab.title}
                    className="img-fluid"
                    width={500}
                    height={500}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}