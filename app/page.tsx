import Footer from "@/components/footer"
import Header from "@/components/header"
import Cta from "@/components/landing/cta"
import Faq from "@/components/landing/faq"
import Hero from "@/components/landing/hero"

export default async function Home() {
  return (
    <main className="main">
    <Header />
      <Hero />
      <Cta />
      <Faq />
    <Footer />
    </main>
  )
}
