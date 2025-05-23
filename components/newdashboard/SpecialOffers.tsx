"use client"
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
  const placeholderDeal: Deal = { // Data contoh jika diperlukan
    title: "Weekend Deal Example",
    discount: "Up to 75% OFF",
    image: "/placeholder.svg?height=300&width=600",
    endDate: "This Sunday",
    gradient: "from-orange-500 to-red-500",
  };

  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center
                       text-neutral-800 dark:text-white">
          <Percent className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Special Offers
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="border-neutral-300 text-neutral-700 hover:bg-emerald-50/90 hover:border-emerald-500 hover:text-emerald-600
                     dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400
                     transition-all duration-200 min-w-[90px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 rounded-md"
        >
          View All
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList
          role="tablist"
          className="bg-neutral-100/90 dark:bg-zinc-800/70 backdrop-blur-sm 
                     mb-5 md:mb-6 p-1.5 border border-neutral-200/90 dark:border-zinc-700/50 
                     rounded-lg flex w-full space-x-1 sm:space-x-1.5" 
          // Dihapus: sm:w-auto sm:inline-flex. Sekarang akan selalu w-full.
        >
          {["all", "weekend", "publisher", "seasonal"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all duration-200 flex-1 min-w-[80px] sm:min-w-[100px] whitespace-nowrap
                         text-neutral-600 hover:bg-neutral-200/70 hover:text-emerald-700
                         dark:text-zinc-300 dark:hover:bg-zinc-700/60 dark:hover:text-emerald-300
                         data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 
                         data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:opacity-90"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {offers.length > 0 ? (
              offers.map((deal, index) => (
                <SpecialOfferCard key={`all-${index}`} deal={deal} />
              ))
            ) : (
              <div className="sm:col-span-2 md:col-span-3 p-6 text-center text-neutral-500 dark:text-zinc-400 bg-neutral-50 dark:bg-zinc-800/40 rounded-lg">
                No special offers available right now.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="weekend" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <SpecialOfferCard deal={placeholderDeal} /> 
          </div>
        </TabsContent>

        <TabsContent value="publisher" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
             <SpecialOfferCard
              deal={{
                title: "Electronic Arts Publisher Sale",
                discount: "Up to 95% OFF",
                image: "/placeholder.svg?height=300&width=600", 
                endDate: "May 25",
                gradient: "from-purple-600 to-indigo-600",
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="seasonal" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <div className="p-6 sm:p-10 text-center 
                          bg-neutral-50 dark:bg-zinc-800/40 
                          backdrop-blur-sm rounded-xl 
                          border border-neutral-200/80 dark:border-zinc-700/50">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-emerald-500 opacity-70 dark:text-emerald-400 dark:opacity-60" />
            <p className="text-base sm:text-lg font-medium text-neutral-700 dark:text-zinc-300">
              No active seasonal sales at the moment.
            </p>
            <p className="mt-1.5 text-sm sm:text-base text-neutral-500 dark:text-zinc-400">
              Check back soon for our Summer Sale!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}