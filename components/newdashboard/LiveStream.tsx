"use client"
import Image from "next/image";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // AvatarImage tidak digunakan di contoh ini
// Jika Anda memiliki AvatarImage untuk streamer, bisa ditambahkan kembali.

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
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center
                       text-neutral-800 dark:text-white">
          <Flame className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Live Streams
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"> {/* Gap disesuaikan */}
        {streams.map((stream, index) => (
          <div key={index} className="group relative rounded-lg overflow-hidden 
                                     bg-white dark:bg-zinc-800/70 
                                     border border-neutral-200/90 dark:border-zinc-700/60 
                                     transition-all duration-300 
                                     hover:shadow-xl hover:border-emerald-500/50 dark:hover:border-emerald-500/40
                                     dark:backdrop-blur-sm">
            <div className="aspect-video relative overflow-hidden"> {/* aspect-video untuk rasio 16:9 */}
              <Image
                src={stream.image || "/placeholder.svg?height=270&width=480"} // Placeholder disesuaikan
                alt={stream.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" // Durasi dan easing disesuaikan
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-2 z-10">
                <Badge className="bg-red-600 text-white flex items-center gap-1.5 py-1 px-2.5 text-xs font-semibold border-none shadow">
                  <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </Badge>
                <Badge className="bg-black/40 dark:bg-black/60 backdrop-blur-sm text-white py-1 px-2.5 text-xs font-medium border-none shadow">
                  {stream.viewers} viewers
                </Badge>
              </div>
              {/* Overlay dan tombol muncul saat hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                              flex items-end justify-center p-4"> {/* Justify-center agar tombol di tengah bawah */}
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white
                             dark:bg-emerald-600 dark:hover:bg-emerald-700
                             transition-colors duration-200 shadow-lg hover:shadow-md
                             py-2 px-5 text-sm font-semibold rounded-md 
                             transform group-hover:translate-y-0 translate-y-4 opacity-0 group-hover:opacity-100" // Animasi tombol
                  style={{ transitionDelay: '0.1s', transitionProperty: 'transform, opacity' }}
                  aria-label={`Watch ${stream.title} stream`}
                >
                  Watch Stream
                </Button>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="font-semibold mb-1 truncate
                             text-neutral-800 dark:text-neutral-100 
                             group-hover:text-emerald-600 dark:group-hover:text-emerald-400 
                             transition-colors duration-200 text-sm sm:text-base">
                {stream.title}
              </h3>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-neutral-300 dark:border-zinc-600">
                  {/* Jika Anda memiliki URL gambar avatar streamer, gunakan AvatarImage */}
                  {/* <AvatarImage src={stream.streamerAvatarUrl} alt={stream.streamer} /> */}
                  <AvatarFallback className="bg-emerald-100 dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                    {stream.streamer.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm text-neutral-600 dark:text-zinc-400 truncate"> 
                  {stream.streamer}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}