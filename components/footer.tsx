"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="container footer-top">
        <div className="row gy-4">
          <div className="col-lg-4 col-md-6 footer-about">
            <Link href="/" className="logo d-flex align-items-center">
              <span className="sitename">Landing Page</span>
            </Link>
            <div className="footer-contact pt-3">
              <p>Jl. Mojo Kalnggru No. 108</p>
              <p>Surabaya, Jawa Timur</p>
              <p className="mt-3">
                <strong>Phone:</strong> <span>+62 812 3456 7890</span>
              </p>
              <p>
                <strong>Email:</strong> <span>ahmadlazim422@gmail.com</span>
              </p>
            </div>
            <div className="social-links d-flex mt-4">
              <a href="#"><i className="bi bi-twitter-x"></i></a>
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
              <a href="#"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>

          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Link Penting</h4>
            <ul>
              <li><Link href="#">Beranda</Link></li>
              <li><Link href="#">Tentang Kami</Link></li>
              <li><Link href="#">Layanan</Link></li>
              <li><Link href="#">Syarat Layanan</Link></li>
              <li><Link href="#">Kebijakan Privasi</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Layanan Kami</h4>
            <ul>
              <li><Link href="#">Desain Web</Link></li>
              <li><Link href="#">Pengembangan Web</Link></li>
              <li><Link href="#">Manajemen Produk</Link></li>
              <li><Link href="#">Pemasaran Digital</Link></li>
              <li><Link href="#">Desain Grafis</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Solusi Digital</h4>
            <ul>
              <li><Link href="#">Pengembangan Aplikasi</Link></li>
              <li><Link href="#">Integrasi Sistem</Link></li>
              <li><Link href="#">Otomatisasi Bisnis</Link></li>
              <li><Link href="#">Layanan Cloud</Link></li>
              <li><Link href="#">Keamanan Data</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Informasi</h4>
            <ul>
              <li><Link href="#">FAQ</Link></li>
              <li><Link href="#">Karir</Link></li>
              <li><Link href="#">Blog</Link></li>
              <li><Link href="#">Hubungi Kami</Link></li>
              <li><Link href="#">Bantuan</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container copyright text-center mt-4">
        <div className="credits">
          Dibuat oleh Ahmad Lazim
        </div>
      </div>
    </footer>
  )
}
