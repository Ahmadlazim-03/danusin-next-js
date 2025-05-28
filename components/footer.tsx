import React from "react";

export default function Footer() {
  return (
    <footer id="footer" className="footer bg-gray-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="footer-about">
            <a href="/" className="logo flex items-center mb-4">
              <span className="text-3xl font-bold">Danusin</span>
            </a>
            <div className="footer-contact">
              <strong>Address:</strong>
              <a
                href="https://maps.app.goo.gl/B7ZnkkNgdvPJfmEA9"
                className="text-sm leading-relaxed"
              >
                <p className="text-gray-700 hover:text-green-600 mt-2">
                  Jl. Airlangga No.4 - 6, Airlangga, Kec. Gubeng, Surabaya, Jawa
                  Timur 60115
                </p>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <ul>
              <li>
                <strong className="text-gray-700">Phone:</strong>
              </li>
              <li>
                <a href="https://wa.me/+6281249111169">+62 812-4911-1169</a>
              </li>
              <li>
                <strong className="text-gray-700">Email:</strong>
              </li>
              <li>
                <a href="mailto:contact@evop.tech">contact@evop.tech</a>
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/about">About us</a>
              </li>
              <li>
                <a href="/features">Features</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
              <li>
                <a href="/dashboard">Dashboard</a>
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="text-lg font-semibold mb-2">Follow Us</h4>
            <div className="social-links flex space-x-4">
              <a href="#">
                <i className="bi bi-twitter-x text-xl"></i>
              </a>
              <a href="#">
                <i className="bi bi-facebook text-xl"></i>
              </a>
              <a href="#">
                <i className="bi bi-instagram text-xl"></i>
              </a>
              <a href="#">
                <i className="bi bi-linkedin text-xl"></i>
              </a>
            </div>
          </div>
        </div>

        <hr className="my-6 border-gray-700" />

        <div className="text-center text-gray-600 text-sm">
          Powered by{" "}
          <a href="https://evoptech.com/">
            <span className="text-blue-00 hover:text-blue-500">EVOP.TECH</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
