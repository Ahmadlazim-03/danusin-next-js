"use client"

import { FullscreenButton } from "@/components/map/fullscreen-button"
import { LocationControls } from "@/components/map/location-controls"
import { MapProvider } from "@/components/map/map-provider"
import { MapboxMap } from "@/components/map/mapbox-map"
// import { SearchPanel } from "@/components/map/search-panel" // SearchPanel sudah dihapus
import { UserCard } from "@/components/map/user-card"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Suspense, useState } from "react"

export default function MapPage() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative">
      <MapProvider>
        {/* === Mobile Layout === */}
        <div className="md:hidden absolute top-[85px] left-1/2 -translate-x-1/2 z-20 w-full max-w-sm pointer-events-auto">
          <div className="relative flex justify-end items-center min-h-[48px]">
            <div
              className={`absolute top-0 right-0 w-full transition-all duration-300 ease-in-out transform rounded-lg
                         ${isRightPanelOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}`}
                         // shadow-lg dihapus dari sini jika tidak ingin efek kartu ganda di mobile
            >
              <div className="flex flex-col items-center space-y-3 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg shadow-lg">
                {isRightPanelOpen && (
                  <>
                    <LocationControls />
                    <UserCard />
                    <FullscreenButton />
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className="relative z-10 p-2 bg-white/90 dark:bg-zinc-700/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
            >
              {isRightPanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>
        {/* Judul Mobile di atasnya */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20 px-4 pt-5 flex justify-center pointer-events-none">
          <div className="text-center pointer-events-auto">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white drop-shadow-md">Danusin Live Map</h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Lihat pengguna di seluruh Indonesia</p>
          </div>
        </div>


        {/* === Desktop Layout === */}
        <div className="hidden md:block absolute top-0 right-0 z-20">
          <div className="flex items-start">
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className="mt-0 p-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-l-xl shadow-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors h-[48px] flex items-center justify-center"
            >
              {isRightPanelOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden
                         ${isRightPanelOpen ? 'max-w-[384px] lg:max-w-[448px] opacity-100' : 'max-w-0 opacity-0'}`}
            >
              {/* Pastikan tidak ada kelas 'gap-...' pada div berikut ini */}
              <div className="p-4 flex flex-col items-stretch w-[384px] lg:w-[448px] bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-r-xl shadow-2xl">
                <FullscreenButton />
                <LocationControls />
                <UserCard />
              </div>
            </div>
          </div>
        </div>

        {/* MapboxMap dengan Suspense */}
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <span className="ml-2 text-lg font-medium">Loading map...</span>
            </div>
          }
        >
          <MapboxMap />
        </Suspense>
      </MapProvider>
    </div>
  );
}