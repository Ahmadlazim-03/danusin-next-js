<<<<<<< Updated upstream
"use client"

import Link from "next/link"
=======
import Link from "next/link";
import Image from "next/image";
>>>>>>> Stashed changes

export default function Footer() {
  return (
<<<<<<< Updated upstream
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
=======
    <footer id="footer" className="footer bg-white py-12">
      <div className="container mx-auto zpx-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 mb-10 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="footer-about">
            <Link href="/" className="logo flex items-center mb-4">
              <span className="text-3xl mb-2 font-bold text-green-500">
                Danusin
              </span>
            </Link>
            <div>
              <p className="text-gray-700 mb-2 font-semibold text-sm">
                Address:
              </p>
              <Link
                href="https://maps.app.goo.gl/B7ZnkkNgdvPJfmEA9"
                className="font-light text-sm hover:text-green-500"
              >
                Jl. Airlangga No.4 - 6, Airlangga, Kec. Gubeng, Surabaya, Jawa
                Timur 60115
              </Link>
            </div>
          </div>

          <div className="footer-links">
            <h4 className="text-green-500 text-base font-semibold mb-2">
              Contact Us
            </h4>
            <ul>
              <li>
                <p className="text-gray-700 font-semibold text-sm">Phone:</p>
              </li>
              <li className="mt-2">
                <Link
                  href="https://wa.me/+6281249111169"
                  className="font-light text-sm hover:text-green-500"
                >
                  +62 812-4911-1169
                </Link>
              </li>
              <li className="mt-4">
                <p className="text-gray-700 font-semibold text-sm">Email:</p>
              </li>
              <li className="mt-2">
                <Link
                  href="mailto:contact@evop.tech"
                  className="font-light text-sm hover:text-green-500"
                >
                  contact@evop.tech
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="text-green-500 text-base font-semibold mb-2">
              Quick Links
            </h4>
            <ul>
              <li className="mb-2">
                <Link
                  href="/"
                  className="font-light text-sm  hover:text-green-500 "
                >
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/about"
                  className="font-light text-sm hover:text-green-500"
                >
                  About us
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/features"
                  className="font-light text-sm hover:text-green-500"
                >
                  Features
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/contact"
                  className="font-light text-sm hover:text-green-500"
                >
                  Contact
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  href="/dashboard"
                  className="font-light text-sm hover:text-green-500"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="text-green-500 text-base font-semibold mb-2">
              Follow Us
            </h4>
            <div className="social-links flex space-x-4">
              <Link href="#">
                <Image
                  src="/twitter.svg"
                  alt="twitter"
                  width={24}
                  height={24}
                />
              </Link>
              <Link href="#">
                <Image
                  src="/instagram.svg"
                  alt="instagram"
                  width={24}
                  height={24}
                />
              </Link>
              <Link href="#">
                <Image
                  src="/linkedin.svg"
                  alt="linkedin"
                  width={24}
                  height={24}
                />
              </Link>
              <Link href="#">
                <Image
                  src="/facebook.svg"
                  alt="facebook"
                  width={24}
                  height={24}
                />
              </Link>
            </div>
          </div>
        </div>
        <hr className="mt-6 my-6 border-gray-300" />
        <div className="text-center text-gray-600 text-xs">
          Powered by{" "}
          <Link href="https://evoptech.com/">
            <span className="text-green-500 hover:text-blue-500">
              EVOP.TECH
            </span>
          </Link>
>>>>>>> Stashed changes
        </div>
      </div>
    </footer>
  );
}
