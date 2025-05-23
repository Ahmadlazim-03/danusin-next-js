"use client";

import { PointLayer, Popup, Scene } from "@antv/l7";
import { Mapbox } from "@antv/l7-maps";
import { AlertTriangle, Loader } from "lucide-react";
import 'mapbox-gl/dist/mapbox-gl.css'; // Crucial for Mapbox base map rendering
import { useEffect, useRef, useState } from "react";

// Types for props and data
interface LocationPoint {
  lon: number;
  lat: number;
  value?: number; 
  [key: string]: any; 
}

interface DanuserMarkerData extends LocationPoint {
  id: string;
  name: string;
  isCurrentUser?: boolean;
  isActive?: boolean; 
}

interface DanusinL7MapProps {
  currentUserMapLocation: DanuserMarkerData | null; 
  otherUsersLocations: DanuserMarkerData[];      
  isSharing: boolean; 
  // onMarkerClick prop is no longer strictly needed if the large card is removed,
  // but we can keep it for potential future use or pass null if it's fully deprecated.
  // For now, we will not call it to prevent the large card.
  onMarkerClick?: (markerData: DanuserMarkerData) => void; 
  initialCenter?: [number, number]; 
  initialZoom?: number;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiYWhtYWRsYXppbSIsImEiOiJjbWFudjJscDMwMGJjMmpvcXdja29vN2h6In0.lbl0E3ixhWKnKuQ5T1aQcw";
const MAP_LOAD_TIMEOUT_MS = 25000; 

const pinSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36px" height="36px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>`;
const pinSvgDataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvgIcon)}`;


export function DanusinL7Map({
  currentUserMapLocation,
  otherUsersLocations,
  isSharing,
  onMarkerClick, // Kept in props, but won't be called to prevent large card
  initialCenter: propInitialCenter,
  initialZoom: propInitialZoom,
}: DanusinL7MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const mapboxMapInstanceRef = useRef<any>(null); 
  const userPointLayerRef = useRef<PointLayer | null>(null);
  const othersPointLayerRef = useRef<PointLayer | null>(null);
  const currentL7PopupRef = useRef<Popup | null>(null); 
  const loadTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const [isMapEngineReady, setIsMapEngineReady] = useState(false); 
  const [mapError, setMapError] = useState<string | null>(null);
  const [internalLoadingMessage, setInternalLoadingMessage] = useState<string>("Initializing Danusin Map...");

  const SURABAYA_COORDS: [number, number] = [112.7521, -7.2575]; 

  useEffect(() => {
    console.log("[DanusinL7Map] Initialization effect triggered.");
    if (!mapContainerRef.current) {
      setMapError("Map container element not found."); return;
    }
    if (mapContainerRef.current.offsetWidth === 0 || mapContainerRef.current.offsetHeight === 0) {
      setMapError("Map container has no dimensions."); return;
    }
    if (sceneRef.current && isMapEngineReady) {
      console.log("[DanusinL7Map] Map engine already ready."); return;
    }
    if (sceneRef.current && !isMapEngineReady) {
      console.warn("[DanusinL7Map] Scene exists but map not ready. Destroying old scene.");
      if (!sceneRef.current.destroyed) sceneRef.current.destroy();
      sceneRef.current = null;
    }
    
    setIsMapEngineReady(false); setMapError(null);
    setInternalLoadingMessage("Initializing Map Engine...");

    loadTimeoutIdRef.current = setTimeout(() => {
      if (!isMapEngineReady && mapContainerRef.current) { 
        setMapError("Map loading timed out.");
        setInternalLoadingMessage("Map loading failed (timeout).");
      }
    }, MAP_LOAD_TIMEOUT_MS);

    const center = propInitialCenter || (currentUserMapLocation ? [currentUserMapLocation.lon, currentUserMapLocation.lat] : SURABAYA_COORDS);
    const zoom = propInitialZoom || (currentUserMapLocation ? 14 : 10);
    let sceneInstance: Scene | null = null;

    try {
      sceneInstance = new Scene({
        id: mapContainerRef.current!, 
        map: new Mapbox({ style: "mapbox://styles/mapbox/streets-v11", center, pitch: 45, zoom, token: MAPBOX_TOKEN }),
        logoVisible: false,
      });
      sceneInstance.addImage('userPinIcon', pinSvgDataUrl);

      sceneInstance.on("loaded", () => {
        console.log("[DanusinL7Map] Scene 'loaded' event fired.");
        if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
        if (!mapContainerRef.current || (sceneRef.current === sceneInstance && isMapEngineReady)) return; 
        if (!mapContainerRef.current) { sceneInstance?.destroy(); return; }

        sceneRef.current = sceneInstance;
        mapboxMapInstanceRef.current = sceneInstance.getMapService().map; 
        setIsMapEngineReady(true); setMapError(null); setInternalLoadingMessage("Map Ready.");

        const mbMap = mapboxMapInstanceRef.current;
        if (mbMap) {
          mbMap.on('style.load', () => { 
            if (mbMap.getSource('composite') && !mbMap.getLayer('3d-buildings')) {
              mbMap.addLayer({
                id: '3d-buildings', source: 'composite', 'source-layer': 'building',
                filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 15,
                paint: {
                  'fill-extrusion-color': '#aaa', 
                  'fill-extrusion-height': ['interpolate',['linear'],['zoom'],15,0,15.05,['get', 'height']],
                  'fill-extrusion-base': ['interpolate',['linear'],['zoom'],15,0,15.05,['get', 'min_height']],
                  'fill-extrusion-opacity': 0.6,
                },
              }, 'waterway-label'); 
            }
          });
          mbMap.on('error', (e: any) => { setMapError(`Mapbox GL error: ${e.error?.message || 'Unknown'}`); });
        }
      });
      sceneInstance.on("error", (err) => { 
        if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
        setMapError("L7 Scene initialization error."); setIsMapEngineReady(false);
        sceneInstance?.destroy(); sceneRef.current = null;
      });
    } catch (initError: any) {
      if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
      setMapError(`Map setup critical error: ${initError.message}`); setIsMapEngineReady(false);
    }
    return () => {
      if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
      const sceneToClean = sceneRef.current === sceneInstance ? sceneRef.current : sceneInstance;
      if (sceneToClean && !sceneToClean.destroyed) sceneToClean.destroy();
      if (sceneRef.current === sceneToClean) sceneRef.current = null;
      mapboxMapInstanceRef.current = null;
    };
  }, []); 

  const showL7Popup = (scene: Scene, lngLat: {lng: number, lat: number}, htmlContent: string) => {
    if (currentL7PopupRef.current) {
      currentL7PopupRef.current.remove();
    }
    const popup = new Popup({
      closeButton: true, 
      closeOnClick: false, 
      offsets: [0, -25] 
    }).setLnglat(lngLat).setHTML(htmlContent);
    scene.addPopup(popup);
    currentL7PopupRef.current = popup;
  };

  useEffect(() => {
    if (!isMapEngineReady || !sceneRef.current || sceneRef.current.destroyed) return;
    const scene = sceneRef.current;

    if (userPointLayerRef.current) {
      try { if(scene.getLayer(userPointLayerRef.current.id)) scene.removeLayer(userPointLayerRef.current); } 
      catch (e) { console.warn("Error removing old user layer:", e); }
      userPointLayerRef.current.destroy(); userPointLayerRef.current = null;
    }

    if (currentUserMapLocation) {
      const layer = new PointLayer({})
        .source([currentUserMapLocation], { parser: { type: "json", x: "lon", y: "lat" } })
        .shape("circle") .size(isSharing ? 12 : 10) .color(isSharing ? "#2ECC40" : "#FF851B") 
        .style({ opacity: 1, stroke: "#FFFFFF", strokeWidth: 2.5, strokeOpacity: 0.8 })
        .active(true);

      layer.on("click", (ev) => { 
        if (ev.feature && ev.feature.properties && sceneRef.current) {
          const markerProps = ev.feature.properties as DanuserMarkerData;
          // onMarkerClick?.(markerProps); // <-- Commented out to prevent large card

          // Show L7 Popup with only the name
          const popupHtml = `<div style="padding: 5px 10px; font-family: sans-serif; font-size:14px; color: #333; background: white; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                               <strong>${markerProps.name} (Anda)</strong>
                             </div>`;
          showL7Popup(sceneRef.current, ev.lngLat, popupHtml);
        }
      });
      scene.addLayer(layer);
      userPointLayerRef.current = layer;
    }
  }, [isMapEngineReady, currentUserMapLocation, isSharing, onMarkerClick]); // onMarkerClick kept in deps for consistency, though not called

  useEffect(() => {
    if (!isMapEngineReady || !sceneRef.current || sceneRef.current.destroyed) return;
    const scene = sceneRef.current;

    if (othersPointLayerRef.current) {
      try { if(scene.getLayer(othersPointLayerRef.current.id)) scene.removeLayer(othersPointLayerRef.current); }
      catch (e) { console.warn("Error removing old others layer:", e); }
      othersPointLayerRef.current.destroy(); othersPointLayerRef.current = null;
    }
    
    if (currentL7PopupRef.current && currentUserMapLocation && currentL7PopupRef.current.getLnglat()?.lng !== currentUserMapLocation.lon ) {
        currentL7PopupRef.current.remove();
        currentL7PopupRef.current = null;
    }

    const validOtherUsers = otherUsersLocations.filter(u => typeof u.lat === 'number' && typeof u.lon === 'number');

    if (validOtherUsers.length > 0) {
      const layer = new PointLayer({})
        .source(validOtherUsers, { parser: { type: "json", x: "lon", y: "lat", isActive: "isActive" } })
        .shape('userPinIcon') .size('isActive', (isActive) => isActive ? 28 : 22) 
        .color('isActive', (isActive) => isActive ? '#0074D9' : '#999999') 
        .style((feat) => ({ opacity: (feat as DanuserMarkerData).isActive ? 0.95 : 0.60, stroke: (feat as DanuserMarkerData).isActive ? "#FFFFFF" : "#777777", strokeWidth: (feat as DanuserMarkerData).isActive ? 1.5 : 1 }))
        .active(true); 

      layer.on("click", (ev) => { 
        if (ev.feature && ev.feature.properties && sceneRef.current) {
          const markerProps = ev.feature.properties as DanuserMarkerData;
          // onMarkerClick?.(markerProps); // <-- Commented out to prevent large card

          // Show L7 Popup with only the name
          const popupHtml = `<div style="padding: 5px 10px; font-family: sans-serif; font-size:14px; color: #333; background: white; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                               <strong>${markerProps.name}</strong>
                             </div>`;
          showL7Popup(sceneRef.current, ev.lngLat, popupHtml);
        }
      });
      scene.addLayer(layer);
      othersPointLayerRef.current = layer;
    }
  }, [isMapEngineReady, otherUsersLocations, onMarkerClick, currentUserMapLocation]); // onMarkerClick kept in deps

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
      {!isMapEngineReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm z-10">
          {mapError ? (
            <><AlertTriangle className="h-12 w-12 mb-3 text-red-500" /><h3 className="text-xl font-semibold mb-1 text-red-600 dark:text-red-400">Map Error</h3><p className="text-center text-sm text-red-500 dark:text-red-300 px-4">{mapError}</p></>
          ) : (
            <><Loader className="h-10 w-10 animate-spin mb-3 text-blue-500 dark:text-blue-400" /><p className="text-lg text-gray-700 dark:text-gray-300">{internalLoadingMessage}</p></>
          )}
        </div>
      )}
    </div>
  );
}
