'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import createGlobe from 'cobe';
import AOS from "aos"

export default function About() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phi = useRef(0);
  const theta = useRef(0);
  const isDragging = useRef(false);
  const previousX = useRef(0);
  const previousY = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const handleStart = (x: number, y: number) => {
      isDragging.current = true;
      previousX.current = x;
      previousY.current = y;
    };

    const handleMove = (x: number, y: number) => {
      if (!isDragging.current) return;
      const deltaX = x - previousX.current;
      const deltaY = y - previousY.current;
      phi.current += deltaX * 0.01; // Adjust sensitivity for horizontal rotation
      theta.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, theta.current - deltaY * 0.01)); // Limit vertical rotation
      previousX.current = x;
      previousY.current = y;
    };

    const handleEnd = () => {
      isDragging.current = false;
    };

    // Mouse events
    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.touches[0]) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleEnd();

    // Attach event listeners
    canvasRef.current.addEventListener('mousedown', onMouseDown);
    canvasRef.current.addEventListener('mousemove', onMouseMove);
    canvasRef.current.addEventListener('mouseup', onMouseUp);
    canvasRef.current.addEventListener('touchstart', onTouchStart);
    canvasRef.current.addEventListener('touchmove', onTouchMove);
    canvasRef.current.addEventListener('touchend', onTouchEnd);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 1,
      width: 400,
      height: 400,
      phi: 0,
      theta: 0,
      dark: 0,
      diffuse: 1,
      mapSamples: 8000,
      mapBrightness: 6,
      baseColor: [0.678, 1, 0.678], // White globe
      markerColor: [0.678, 1, 0.678], // Light green marker
      glowColor: [1, 1, 1],
      markers: [
        { location: [-7.2504, 112.7657], size: 0.1 }, // Example location (Surabaya, Indonesia)
      ],
      onRender: (state) => {
        state.phi = phi.current;
        state.theta = theta.current;
        if (!isDragging.current) {
          phi.current += 0.01; // Auto-rotate only when not dragging
        }
      },
    });

    // Cleanup event listeners on component unmount
    return () => {
      if (!canvasRef.current) return;
      canvasRef.current.removeEventListener('mousedown', onMouseDown);
      canvasRef.current.removeEventListener('mousemove', onMouseMove);
      canvasRef.current.removeEventListener('mouseup', onMouseUp);
      canvasRef.current.removeEventListener('touchstart', onTouchStart);
      canvasRef.current.removeEventListener('touchmove', onTouchMove);
      canvasRef.current.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

   useEffect(() => {
      AOS.init({
        duration: 400, 
        easing: "ease-out", 
        once: true, 
      })
    }, [])

  return (
    <section id="about" className="about section">
      <div className="container">
        <div className="row gy-4 align-items-center justify-content-between">
          <div className="col-xl-5">
            <span className="about-meta" data-aos="fade-up" data-aos-delay="100">
              TENTANG KAMI
            </span>
            <h2 className="about-title" data-aos="fade-up" data-aos-delay="200">
              Memberdayakan UMKM Indonesia
            </h2>
            <p className="about-description" data-aos="fade-up" data-aos-delay="300">
              Danusin adalah platform yang menghubungkan pengusaha UMKM dengan pendukung untuk mewujudkan impian bisnis mereka. Kami menyediakan alat untuk memulai kampanye danusan, melacak penjual secara real-time, dan membangun komunitas pengusaha yang kuat di seluruh Indonesia.
            </p>

            <div className="row feature-list-wrapper">
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="400">
                <ul className="feature-list">
                  <li><i className="bi bi-check-circle-fill"></i> Mulai kampanye danusan dengan mudah</li>
                  <li><i className="bi bi-check-circle-fill"></i> Lacak penjual aktif di peta real-time</li>
                  <li><i className="bi bi-check-circle-fill"></i> Dukungan untuk berbagai jenis UMKM</li>
                </ul>
              </div>
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="500">
                <ul className="feature-list">
                  <li><i className="bi bi-check-circle-fill"></i> Kolaborasi dengan organisasi terpercaya</li>
                  <li><i className="bi bi-check-circle-fill"></i> Komunitas pengusaha yang dinamis</li>
                  <li><i className="bi bi-check-circle-fill"></i> Akses ke sumber daya bisnis</li>
                </ul>
              </div>
            </div>

            <div className="info-wrapper" data-aos="fade-up" data-aos-delay="600">
              <div className="row gy-4">
                <div className="col-lg-5">
                  <div className="profile d-flex align-items-center gap-3">
                    <Image
                      src="/assets/img/evop-icon.png"
                      alt="Profil CEO Danusin"
                      className="profile-image"
                      width={50}
                      height={50}
                    />
                    <div>
                      <h4 className="profile-name">EVOP Tech Company</h4>
                      <a href="https://evoptech.com" className="profile-position">
                        evop.tech.com
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-lg-7">
                  <div className="contact-info d-flex align-items-center gap-2">
                    <i className="bi bi-telephone-fill"></i>
                    <div>
                      <p className="contact-label">Hubungi kami kapan saja</p>
                      <p className="contact-number">+62 812-4911-1169</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-5" data-aos="fade-left" data-aos-delay="700">
            <div className="image-wrapper">
              <div className="images position-relative globe-container">
                <canvas
                  ref={canvasRef}
                  style={{ width: '400px', height: '400px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}