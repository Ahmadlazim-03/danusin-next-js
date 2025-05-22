import Image from "next/image";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Stream = {
  title: string;
  streamer: string;
  viewers: string;
  image: string;
};

type LiveStreamsProps = {
  streams: Stream[];
};

export function LiveStreams({ streams }: LiveStreamsProps) {
  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center">
          <Flame className="mr-2 h-5 w-5 text-emerald-400" />
          Live Streams
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 hover:bg-zinc-800 hover:border-emerald-500 transition-all duration-300 min-w-[100px] min-h-[44px] text-sm"
        >
          View All
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {streams.map((stream, index) => (
          <div key={index} className="group relative">
            <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-lg overflow-hidden transition-all duration-300 group-hover:border-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/10">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={stream.image || "/placeholder.svg"}
                  alt={stream.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <Badge className="bg-red-600 flex items-center gap-1 py-1 px-2 text-sm">
                    <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </Badge>
                  <Badge className="bg-zinc-800/80 backdrop-blur-sm py-1 px-2 text-sm">
                    {stream.viewers} viewers
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <Button
                    className="m-3 bg-emerald-500 hover:bg-emerald-600 transition-colors duration-300 min-w-[120px] min-h-[44px] text-sm"
                    aria-label={`Watch ${stream.title} stream`}
                  >
                    Watch Stream
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1 group-hover:text-emerald-400 transition-colors duration-300 text-sm sm:text-base">
                  {stream.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-zinc-700">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs">
                      {stream.streamer.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-zinc-300">{stream.streamer}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}