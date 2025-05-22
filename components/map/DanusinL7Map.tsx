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
  value?: number; // Optional: for cylinder height or other visual scaling
  [key: string]: any; // Allow other properties for popups etc.
}

interface DanuserMarkerData extends LocationPoint {
  id: string;
  name: string;
  isCurrentUser?: boolean;
}

interface DanusinL7MapProps {
  currentUserMapLocation: DanuserMarkerData | null; // Current user's location to display
  otherUsersLocations: DanuserMarkerData[];      // Other users' locations
  isSharing: boolean; // To style current user marker differently
  onMarkerClick?: (markerData: DanuserMarkerData) => void;
  initialCenter?: [number, number]; // Optional: [lon, lat]
  initialZoom?: number;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiYWhtYWRsYXppbSIsImEiOiJjbWFudjJscDMwMGJjMmpvcXdja29vN2h6In0.lbl0E3ixhWKnKuQ5T1aQcw";
const MAP_LOAD_TIMEOUT_MS = 25000; // 25 seconds

export function DanusinL7Map({
  currentUserMapLocation,
  otherUsersLocations,
  isSharing,
  onMarkerClick,
  initialCenter: propInitialCenter,
  initialZoom: propInitialZoom,
}: DanusinL7MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const mapboxMapInstanceRef = useRef<any>(null); // For Mapbox GL JS instance
  const userPointLayerRef = useRef<PointLayer | null>(null);
  const othersPointLayerRef = useRef<PointLayer | null>(null);
  const currentPopupRef = useRef<Popup | null>(null);
  const loadTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const [isMapEngineReady, setIsMapEngineReady] = useState(false); // Tracks if L7 scene is loaded
  const [mapError, setMapError] = useState<string | null>(null);
  const [internalLoadingMessage, setInternalLoadingMessage] = useState<string>("Initializing Danusin Map...");


  // Default center to Surabaya, Indonesia if not provided
  const SURABAYA_COORDS: [number, number] = [112.7521, -7.2575];

  useEffect(() => {
    console.log("[DanusinL7Map] Initialization effect triggered.");

    if (!mapContainerRef.current) {
      console.error("[DanusinL7Map] mapContainerRef.current is null during effect. This should not happen if div is always rendered.");
      // This error implies a deeper issue if the div isn't available after first render.
      setMapError("Map container element not found in DOM. Critical render issue.");
      return;
    }
    if (mapContainerRef.current.offsetWidth === 0 || mapContainerRef.current.offsetHeight === 0) {
      console.error("[DanusinL7Map] Map container has zero dimensions.");
      setMapError("Map container has no dimensions. Ensure parent provides space and CSS (mapbox-gl.css) is loaded.");
      return;
    }
    
    // If scene exists and map is already loaded, do nothing.
    // If scene exists but map not loaded, destroy and re-init (handles StrictMode or failed previous attempts).
    if (sceneRef.current) {
        if (isMapEngineReady) {
            console.log("[DanusinL7Map] Map already initialized and loaded.");
            return;
        } else {
            console.warn("[DanusinL7Map] Scene exists but map not marked loaded. Destroying old scene before re-init.");
            if (!sceneRef.current.destroyed) sceneRef.current.destroy();
            sceneRef.current = null;
        }
    }
    
    setIsMapEngineReady(false); // Set to false before attempting to load
    setMapError(null);
    setInternalLoadingMessage("Initializing Map Engine...");
    console.log("[DanusinL7Map] Starting map initialization...");

    loadTimeoutIdRef.current = setTimeout(() => {
      // Check if still not loaded and component is mounted (mapContainerRef.current exists)
      if (!isMapEngineReady && mapContainerRef.current) {
        console.error("[DanusinL7Map] Map loading timed out.");
        setMapError("Map loading timed out. Check network, token, and container visibility.");
        setInternalLoadingMessage("Map loading failed (timeout).");
      }
    }, MAP_LOAD_TIMEOUT_MS);

    const center = propInitialCenter || (currentUserMapLocation ? [currentUserMapLocation.lon, currentUserMapLocation.lat] : SURABAYA_COORDS);
    const zoom = propInitialZoom || (currentUserMapLocation ? 14 : 10);
    
    let sceneInstance: Scene | null = null;

    try {
      sceneInstance = new Scene({
        id: mapContainerRef.current!, // mapContainerRef is checked to be non-null
        map: new Mapbox({
          style: "mapbox://styles/mapbox/streets-v11",
          center: center,
          pitch: 45, 
          zoom: zoom,
          token: MAPBOX_TOKEN,
        }),
        logoVisible: false,
      });

      sceneInstance.on("loaded", () => {
        console.log("[DanusinL7Map] Scene 'loaded' event fired.");
        if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
        if (!mapContainerRef.current) { 
            sceneInstance?.destroy();
            return;
        }
        
        sceneRef.current = sceneInstance;
        mapboxMapInstanceRef.current = sceneInstance.getMapService().map;
        setIsMapEngineReady(true); // Mark engine as ready
        setMapError(null);
        setInternalLoadingMessage("Map Ready.");

        const mbMap = mapboxMapInstanceRef.current;
        if (mbMap) {
          mbMap.on('style.load', () => {
            console.log("[DanusinL7Map] Mapbox style.load event.");
            if (mbMap.getSource('composite') && !mbMap.getLayer('3d-buildings')) {
              mbMap.addLayer({
                id: '3d-buildings', source: 'composite', 'source-layer': 'building',
                filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 15,
                paint: {
                  'fill-extrusion-color': '#47a82f',
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': ['get', 'min_height'],
                  'fill-extrusion-opacity': 0.6,
                },
              }, 'waterway-label'); 
            }
          });
          mbMap.on('error', (e: any) => {
            console.error("[DanusinL7Map] Mapbox GL error:", e.error);
            setMapError(`Mapbox GL error: ${e.error?.message || 'Unknown'}`);
            setIsMapEngineReady(false);
          });
        }
      });

      sceneInstance.on("error", (err) => {
        console.error("[DanusinL7Map] L7 Scene error:", err);
        if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
        setMapError("L7 Scene initialization error. Check console.");
        setIsMapEngineReady(false);
        sceneInstance?.destroy(); 
        sceneRef.current = null;
      });

    } catch (initError: any) {
      console.error("[DanusinL7Map] Critical error during new Scene():", initError);
      if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
      setMapError(`Map setup critical error: ${initError.message}`);
      setIsMapEngineReady(false);
    }

    return () => {
      console.log("[DanusinL7Map] Cleanup map initialization effect.");
      if (loadTimeoutIdRef.current) clearTimeout(loadTimeoutIdRef.current);
      const sceneToClean = sceneRef.current || sceneInstance;
      if (sceneToClean && !sceneToClean.destroyed) {
        sceneToClean.destroy();
      }
      sceneRef.current = null;
      mapboxMapInstanceRef.current = null;
      // setIsMapEngineReady(false); // Do not reset on unmount if already loaded, parent controls overall visibility
    };
  }, []); // Initialize map only once

  // Effect to update current user marker
  useEffect(() => {
    if (!isMapEngineReady || !sceneRef.current) return;
    const scene = sceneRef.current;

    if (userPointLayerRef.current) {
      try { scene.removeLayer(userPointLayerRef.current); } catch (e) { /* ignore */ }
      userPointLayerRef.current = null;
    }

    if (currentUserMapLocation) {
      const layer = new PointLayer({})
        .source([currentUserMapLocation], { parser: { type: "json", x: "lon", y: "lat" } })
        .shape("circle")
        .size(isSharing ? 12 : 10)
        .color(isSharing ? "#09ff78" : "#cea786") 
        .style({ opacity: 1, stroke: "#FFFFFF", strokeWidth: 2.5 });
      scene.addLayer(layer);
      userPointLayerRef.current = layer;
    }
  }, [isMapEngineReady, currentUserMapLocation, isSharing]);

  // Effect to update other users' markers
  useEffect(() => {
    if (!isMapEngineReady || !sceneRef.current) return;
    const scene = sceneRef.current;

    if (othersPointLayerRef.current) {
      try { scene.removeLayer(othersPointLayerRef.current); } catch (e) { /* ignore */ }
      othersPointLayerRef.current = null;
    }
    if (currentPopupRef.current) {
      currentPopupRef.current.remove();
      currentPopupRef.current = null;
    }

    const validOtherUsers = otherUsersLocations.filter(
      (user) => user.location && typeof user.location.lat === 'number' && typeof user.location.lon === 'number'
    );

    if (validOtherUsers.length > 0) {
      const layer = new PointLayer({})
        .source(validOtherUsers, { parser: { type: "json", x: "lon", y: "lat" } })
        .shape("circle")
        .size(8)
        .color("#0074D9") 
        .style({ opacity: 0.8, stroke: "#FFFFFF", strokeWidth: 1.5 })
        .active(true);

      layer.on("click", (ev) => {
        if (ev.feature && ev.feature.properties) {
          if (currentPopupRef.current) currentPopupRef.current.remove();
          const props = ev.feature.properties as DanuserMarkerData;
          
          onMarkerClick?.(props); 

          const popup = new Popup({ closeButton: true, closeOnClick: true, offsets: [0,0] })
            .setLnglat(ev.lngLat)
            .setHTML(`<div style="padding:8px; font-size:13px;"><strong>${props.name}</strong><br/>ID: ${props.id}</div>`);
          scene.addPopup(popup);
          currentPopupRef.current = popup;
        }
      });
      scene.addLayer(layer);
      othersPointLayerRef.current = layer;
    }
  }, [isMapEngineReady, otherUsersLocations, onMarkerClick]);

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-lg overflow-hidden bg-gray-200 relative">
      {/* Display loading or error state as an overlay */}
      {!isMapEngineReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200/80 backdrop-blur-sm z-10">
          {mapError ? (
            <>
              <AlertTriangle className="h-12 w-12 mb-3 text-red-500" />
              <h3 className="text-xl font-semibold mb-1 text-red-600">Map Error</h3>
              <p className="text-center text-sm text-red-500 px-4">{mapError}</p>
            </>
          ) : (
            <>
              <Loader className="h-10 w-10 animate-spin mb-3 text-blue-500" />
              <p className="text-lg text-gray-700">{internalLoadingMessage}</p>
            </>
          )}
        </div>
      )}
      {/* The map will be initialized by L7 inside the div with mapContainerRef once isMapEngineReady is true and layers are added */}
    </div>
  );
}
