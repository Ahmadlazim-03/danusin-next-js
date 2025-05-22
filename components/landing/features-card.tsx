'use client';

import { useEffect } from 'react';
import AOS from "aos"

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function FeaturesCards() {
  const featureCards: FeatureCard[] = [
    {
      title: 'Kampanye Danusan',
      description: 'Luncurkan kampanye crowdfunding dengan mudah untuk mendanai usaha Anda bersama komunitas pendukung.',
      icon: 'bi bi-rocket-takeoff',
      color: 'orange',
    },
    {
      title: 'Peta Real-Time',
      description: 'Lacak lokasi penjual UMKM secara langsung dan temukan produk lokal di sekitar Anda.',
      icon: 'bi bi-geo-alt',
      color: 'blue',
    },
    {
      title: 'Komunitas Pengusaha',
      description: 'Bergabung dengan komunitas UMKM untuk berbagi pengalaman dan memperluas jaringan bisnis.',
      icon: 'bi bi-people',
      color: 'green',
    },
    {
      title: 'Sumber Daya Bisnis',
      description: 'Akses pelatihan dan alat bantu untuk membantu UMKM Anda tumbuh dan sukses.',
      icon: 'bi bi-briefcase',
      color: 'red',
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
    <section id="features-cards" className="features-cards section">
      <div className="container">
        <div className="row gy-4">
          {featureCards.map((card, index) => (
            <div
              key={index}
              className="col-xl-3 col-md-6"
              data-aos="zoom-in"
              data-aos-delay={100 + index * 100} // Staggered delay: 100, 200, 300, 400 ms
            >
              <div className={`feature-box ${card.color}`}>
                <i className={card.icon}></i>
                <h4>{card.title}</h4>
                <p>{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}