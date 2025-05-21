import Cta from "@/components/landing/cta"
import Faq from "@/components/landing/faq"
import Hero from "@/components/landing/hero"

export default async function Home() {
  return (
    <main className="main">
      <Hero />
      <Cta />
      <Faq />
    </main>
  )
}
