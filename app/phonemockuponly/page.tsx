import Cta from "@/components/landing/cta";
import Faq from "@/components/landing/faq";
import Hero from "@/components/landing/hero";
import { AnimatedBackground } from "@/components/animated-background";

export default async function Home() {
  return (
    <main className="-mt-28">
      <AnimatedBackground />
      <Hero />
      <Cta />
      <Faq />
    </main>
  );
}
