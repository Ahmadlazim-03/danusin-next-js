import Footer from "@/components/footer";
import Cta from "@/components/landing/cta";
import Faq from "@/components/landing/faq";
import Hero from "@/components/landing/hero";
import { AnimatedBackground } from "@/components/animated-background";
import Header from "@/components/header";

export default async function Home() {
  return (
    <main className="main">
     <AnimatedBackground />
        <Header />
        <Hero />
        <Cta />
        <Faq />
    <Footer />
    </main>
  )
}
