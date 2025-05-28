"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const pathname = usePathname() // Get the current route

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen)
  }

  // Function to determine if a menu item is active
  const isActive = (href: string) => pathname === href

  return (
    <header id="header" className="header d-flex align-items-center fixed-top">
      <div className="header-container container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
        <Link href="/" className="logo d-flex align-items-center me-auto me-xl-0">
          <h1 className="sitename">Danusin</h1>
        </Link>

        <nav id="navmenu" className={`navmenu ${isMobileNavOpen ? "mobile-nav-active" : ""}`}>
          <ul>
            <li>
              <Link href="/" className={isActive("/") ? "active" : ""}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className={isActive("/about") ? "active" : ""}>
                About
              </Link>
            </li>
            <li>
              <Link href="/features" className={isActive("/features") ? "active" : ""}>
                Features
              </Link>
            </li>
            <li>
              <Link href="/contact" className={isActive("/contact") ? "active" : ""}>
                Contact
              </Link>
            </li>
          </ul>
          <i
            className={`mobile-nav-toggle d-xl-none bi ${isMobileNavOpen ? "bi-x" : "bi-list"}`}
            onClick={toggleMobileNav}
          ></i>
        </nav>

        <div className="d-flex align-items-center">
          <Link className="btn-shiny" href="/login">
            Get Started
          </Link>
        </div>
      </div>

    </header>
  )
}