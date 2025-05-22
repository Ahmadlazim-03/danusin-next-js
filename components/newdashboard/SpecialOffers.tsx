import { Percent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpecialOfferCard } from "@/components/special-offer-card";

type Deal = {
  title: string;
  discount: string;
  image: string;
  endDate: string;
  gradient: string;
};

type SpecialOffersProps = {
  offers: Deal[];
};

export function SpecialOffers({ offers }: SpecialOffersProps) {
  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center">
          <Percent className="mr-2 h-5 w-5 text-emerald-400" />
          Special Offers
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500 transition-all duration-300 min-w-[100px] min-h-[44px] text-sm"
        >
          View All
        </Button>
      </div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList
          role="tablist"
          className="bg-zinc-800/50 backdrop-blur-sm mb-4 md:mb-6 p-1 border border-zinc-700/50 rounded-lg overflow-x-auto flex w-full"
        >
          {["all", "weekend", "publisher", "seasonal"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="py-2 px-4 text-sm md:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-md transition-all duration-300 flex-1 min-w-[100px]"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {offers.map((deal, index) => (
              <SpecialOfferCard key={index} deal={deal} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="weekend" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <SpecialOfferCard
              deal={{
                title: "Spring in the Shire",
                discount: "Up to 90% OFF",
                image: "/placeholder.svg?height=300&width=600",
                endDate: "May 5",
                gradient: "from-green-500 to-yellow-500",
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="publisher" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <SpecialOfferCard
              deal={{
                title: "Electronic Arts Publisher Sale",
                discount: "Up to 95% OFF",
                image: "/placeholder.svg?height=300&width=600",
                endDate: "May 5",
                gradient: "from-purple-500 to-blue-500",
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="seasonal" className="mt-0">
          <div className="p-6 sm:p-8 text-center text-zinc-400 bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-zinc-700/50">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-emerald-400 opacity-50" />
            <p className="text-base sm:text-lg">No active seasonal sales at the moment.</p>
            <p className="mt-2 text-sm sm:text-base">Check back soon for our Summer Sale!</p>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}