
import { HeroCarousel } from "@/components/hero-carousel";
import { Categories } from "@/components/newdashboard/Categories";
import FeaturedGames from "@/components/newdashboard/FeaturedGames";
import  LiveStreams  from "@/components/newdashboard/LiveStream";
import { RecentlyUpdated } from "@/components/newdashboard/RecentlyUpdated";
import SpecialOffers  from "@/components/newdashboard/SpecialOffers";
import { Award, ChevronDown, Gamepad2, Tag, Trophy, Zap } from "lucide-react";

export default function Home() {

  return (
    
          <main >
            <HeroCarousel />
            <FeaturedGames />
            <SpecialOffers />
            <Categories />
            <RecentlyUpdated />
            <LiveStreams />
          </main>
     
  );
}