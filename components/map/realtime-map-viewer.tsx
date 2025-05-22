"use client";

import { PointLayer, Popup, Scene } from '@antv/l7'; // Import Popup
import { Mapbox } from '@antv/l7-maps';
import { AlertTriangle, Loader } from "lucide-react";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from "react";

// Define a more specific type for nearby users if possible
interface NearbyUser {
  id: string;
  name?: string;
  location?: {
    lat: number;
    lng: number; // L7 source parser expects 'lng' if x is 'lng'
  };
  // Add other properties you expect for nearby users, e.g., a value for cylinder height
  value?: number; 
}

interface RealtimeMapViewerProps {
  currentUserLocation: { lat: number; lng: number; value?: number } | null; // lng for consistency with geolocation, added optional value
  nearbyUsers: NearbyUser[];
  isSharing?: boolean; // Optional: can be used to style current user marker differently
  onMarkerClick?: (markerData: NearbyUser) => void; // Callback for marker clicks
}

// Default Mapbox token (replace with your own if needed, consider environment variables)
const MAPBOX_TOKEN = "pk.eyJ1IjoiYWhtYWRsYXppbSIsImEiOiJjbWFudjJscDMwMGJjMmpvcXdja29vN2h6In0.lbl0E3ixhWKnKuQ5T1aQcw";
const MAP_LOAD_TIMEOUT_MS = 20000; // 20 seconds timeout for map loading

export function RealtimeMapViewer({ 
  currentUserLocation, 
  nearbyUsers, 
  isSharing,
  onMarkerClick 
}: RealtimeMapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const mapboxMapRef = useRef<any>(null); // To store Mapbox GL JS map instance
  const currentUserLayerRef = useRef<PointLayer | null>(null);
  const nearbyUsersLayerRef = useRef<PointLayer | null>(null);
  const currentPopupRef = useRef<Popup | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize L7 Scene and Map
  useEffect(() => {
    console.log("[RealtimeMapViewer] Initialization useEffect - Start. Current isMapLoaded:", isMapLoaded, "Error:", error);
    
    if (!mapRef.current) {
      console.error("[RealtimeMapViewer] mapRef.current is null. Cannot initialize map.");
      setError("Map container DOM element not found.");
      setIsMapLoaded(false); 
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      return;
    }
     // Check if the map container has valid dimensions
    if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
        console.error("[RealtimeMapViewer] Map container has zero width or height. Map cannot initialize properly. Dimensions:", mapRef.current.offsetWidth, "x", mapRef.current.offsetHeight);
        setError("Map container has no dimensions. Ensure parent elements provide space and CSS is loaded.");
        setIsMapLoaded(false); 
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        return;
    }

    if (sceneRef.current) {
      console.log("[RealtimeMapViewer] sceneRef.current already exists. Skipping initialization if map already loaded. isMapLoaded:", isMapLoaded);
      if (isMapLoaded) return; // If map is already loaded, do nothing
      // If scene exists but map not loaded, this is an inconsistent state.
      // Forcing a destroy and re-init might be too aggressive without more info.
      // console.warn("[RealtimeMapViewer] sceneRef exists but map not loaded. This might indicate an issue.");
    }

    console.log("[RealtimeMapViewer] Attempting to initialize L7 Scene. Initial currentUserLocation:", currentUserLocation);
    
    // Ensure isMapLoaded is false before starting initialization
    setIsMapLoaded(false);
    setError(null); // Clear previous errors

    loadTimeoutRef.current = setTimeout(() => {
        // Check if component is still mounted and map hasn't loaded
        if (mapRef.current && !sceneRef.current && !isMapLoaded) { 
            console.error(`[RealtimeMapViewer] Map loading timed out after ${MAP_LOAD_TIMEOUT_MS / 1000} seconds.`);
            setError(`Map loading timed out. Please check your network connection and Mapbox token. If the issue persists, the map service might be unavailable or the container is not visible.`);
            setIsMapLoaded(false); 
        }
    }, MAP_LOAD_TIMEOUT_MS);

    const initialCenter: [number, number] = currentUserLocation
      ? [currentUserLocation.lng, currentUserLocation.lat] 
      : [106.8227, -6.2088]; // Jakarta as fallback
    const initialZoom = currentUserLocation ? 14 : 12;

    let tempSceneInstance: Scene | null = null;

    try {
      console.log("[RealtimeMapViewer] Creating L7 Scene instance...");
      tempSceneInstance = new Scene({
        id: mapRef.current!,
        map: new Mapbox({
          style: 'mapbox://styles/mapbox/light-v11', 
          center: initialCenter,
          pitch: 60, 
          zoom: initialZoom,
          token: MAPBOX_TOKEN,
        }),
        logoVisible: false,
      });
      console.log("[RealtimeMapViewer] L7 Scene instance created. Attaching event listeners.");

      tempSceneInstance.on('loaded', () => {
        console.log("[RealtimeMapViewer] Scene 'loaded' event fired!");
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current); 
            loadTimeoutRef.current = null;
        }
        
        // Check if component is still mounted before setting state
        if (!mapRef.current) {
            console.warn("[RealtimeMapViewer] 'loaded' event fired, but mapRef is null (component likely unmounted). Aborting state update.");
            tempSceneInstance?.destroy(); // Clean up the scene that just loaded
            return;
        }

        setIsMapLoaded(true);
        sceneRef.current = tempSceneInstance; 
        mapboxMapRef.current = tempSceneInstance!.getMapService().map;
        setError(null);
        console.log("[RealtimeMapViewer] Map is now considered loaded. isMapLoaded: true");

        if (mapboxMapRef.current) {
          console.log("[RealtimeMapViewer] Mapbox map instance obtained. Attaching 'style.load' listener.");
          mapboxMapRef.current.on('style.load', () => {
            console.log("[RealtimeMapViewer] Mapbox 'style.load' event fired.");
            if (mapboxMapRef.current && !mapboxMapRef.current.getLayer('3d-buildings')) {
              if (mapboxMapRef.current.getSource('composite')) {
                console.log("[RealtimeMapViewer] Adding 3D buildings layer.");
                mapboxMapRef.current.addLayer({
                  id: '3d-buildings',
                  source: 'composite',
                  'source-layer': 'building',
                  filter: ['==', 'extrude', 'true'],
                  type: 'fill-extrusion',
                  minzoom: 15,
                  paint: {
                    'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#2affff', 80, '#00ffcc', 160, '#00cc99'],
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.8,
                  },
                });
              } else {
                console.warn('[RealtimeMapViewer] Mapbox source "composite" not found for 3D buildings.');
              }
            }
          });
           mapboxMapRef.current.on('error', (e: any) => {
             console.error('[RealtimeMapViewer] Mapbox GL JS specific error:', e.error);
             setError(`Mapbox GL error: ${e.error?.message || 'Unknown Mapbox error'}`);
             setIsMapLoaded(false);
           });
        } else {
            console.warn("[RealtimeMapViewer] mapboxMapRef.current is null after scene load.");
        }
      });

      tempSceneInstance.on('error', (errEvent) => {
        console.error("[RealtimeMapViewer] Scene 'error' event fired:", errEvent);
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }
        setError(`Failed to initialize map. L7 Scene error. Check console for details.`);
        setIsMapLoaded(false);
        // Clean up the scene instance if it was created
        const sceneToClean = sceneRef.current || tempSceneInstance;
        if (sceneToClean && !sceneToClean.destroyed) {
            sceneToClean.destroy();
        }
        sceneRef.current = null;
        mapboxMapRef.current = null;
      });
    } catch (initErr: any) {
      console.error("[RealtimeMapViewer] Error during L7 Scene object creation (try-catch):", initErr);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setError(`Critical error setting up map: ${initErr.message}`);
      setIsMapLoaded(false);
    }

    return () => {
      console.log("[RealtimeMapViewer] Cleanup function for initialization useEffect. isMapLoaded:", isMapLoaded);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      const sceneToDestroy = sceneRef.current || tempSceneInstance;
      if (sceneToDestroy && !sceneToDestroy.destroyed) { 
        console.log("[RealtimeMapViewer] Destroying L7 scene instance in cleanup.");
        if (currentPopupRef.current) {
          currentPopupRef.current.remove();
          currentPopupRef.current = null;
        }
        if (mapboxMapRef.current && mapboxMapRef.current.getLayer('3d-buildings')) {
            try { mapboxMapRef.current.removeLayer('3d-buildings'); }
            catch (e) { console.warn("[RealtimeMapViewer] Could not remove 3D buildings layer on cleanup:", e); }
        }
        sceneToDestroy.destroy();
      }
      sceneRef.current = null;
      mapboxMapRef.current = null;
      // If the component unmounts before the map is successfully loaded, ensure isMapLoaded is false.
      // This helps if StrictMode causes a quick unmount/remount.
      // However, we need to be careful not to set it to false if it was already true and this is just a normal unmount.
      // The current logic should handle this by only setting isMapLoaded in the 'loaded' or error/timeout paths.
      // If it's unmounting and isMapLoaded is still false, it means it never loaded.
      // If it's unmounting and isMapLoaded is true, it means it did load.
    };
  }, []); // Initialize map only once

  // Update current user marker
  useEffect(() => {
    if (!isMapLoaded || !sceneRef.current) return;
    const scene = sceneRef.current;

    if (currentUserLayerRef.current) {
      try { scene.removeLayer(currentUserLayerRef.current); }
      catch (e) { console.warn("Could not remove previous current user layer", e); }
      currentUserLayerRef.current = null;
    }

    if (currentUserLocation) {
      const userValue = currentUserLocation.value || 100; 
      const layer = new PointLayer({})
        .source([{
          lng: currentUserLocation.lng,
          lat: currentUserLocation.lat,
          name: "You",
          value: userValue, 
          isUser: true,
        }], {
          parser: { type: 'json', x: 'lng', y: 'lat' }
        })
        .shape('cylinder') 
        .size('value', h => [10, 10, h]) 
        .color(isSharing ? '#ff0000' : '#FFA500') 
        .style({ opacity: 0.9 });
      scene.addLayer(layer);
      currentUserLayerRef.current = layer;

      scene.setCenter([currentUserLocation.lng, currentUserLocation.lat]);
    }
  }, [isMapLoaded, currentUserLocation, isSharing]);

  // Update nearby users markers
  useEffect(() => {
    if (!isMapLoaded || !sceneRef.current) return;
    const scene = sceneRef.current;

    if (nearbyUsersLayerRef.current) {
      try { scene.removeLayer(nearbyUsersLayerRef.current); }
      catch (e) { console.warn("Could not remove previous nearby users layer", e); }
      nearbyUsersLayerRef.current = null;
    }
    if (currentPopupRef.current) {
        currentPopupRef.current.remove();
        currentPopupRef.current = null;
    }

    const validNearbyUsers = nearbyUsers.filter(
      user => user.location && typeof user.location.lat === 'number' && typeof user.location.lng === 'number'
    );

    if (validNearbyUsers.length > 0) {
      const layerData = validNearbyUsers.map(user => ({
        lng: user.location!.lng,
        lat: user.location!.lat,
        name: user.name || "Danusin User",
        id: user.id,
        value: user.value || 50, 
        isUser: false,
      }));

      const layer = new PointLayer({})
        .source(layerData, {
          parser: { type: 'json', x: 'lng', y: 'lat' }
        })
        .shape('cylinder') 
        .size('value', h => [8, 8, h]) 
        .color('#00ffcc') 
        .style({ opacity: 0.9 })
        .active(true);

      layer.on('click', (ev) => {
        if (ev.feature && ev.feature.properties) {
            if (currentPopupRef.current) {
                currentPopupRef.current.remove();
            }
            const props = ev.feature.properties as NearbyUser & { name: string }; 
            
            if (onMarkerClick) {
                const clickedUserData = nearbyUsers.find(u => u.id === props.id);
                if (clickedUserData) {
                    onMarkerClick(clickedUserData);
                }
            }

            const popup = new Popup({
                offsets: [0, 0],
                closeButton: true,
                closeOnClick: true,
            })
            .setLnglat(ev.lngLat)
            .setHTML(`
              <div style="font-family: Arial, sans-serif; font-size: 13px; padding: 5px; color: #333;">
                <strong>${props.name}</strong>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #777;">ID: ${props.id}</p>
              </div>
            `);
            scene.addPopup(popup);
            currentPopupRef.current = popup;
        }
      });
      scene.addLayer(layer);
      nearbyUsersLayerRef.current = layer;
    }
  }, [isMapLoaded, nearbyUsers, onMarkerClick]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <h4 className="font-semibold mb-1">Map Error</h4>
        <p className="text-center text-xs">{error}</p>
      </div>
    );
  }

  // Display loading indicator until the map is fully loaded and ready
  if (!isMapLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
        <Loader className="h-8 w-8 animate-spin mb-2 text-blue-500" />
        <p className="text-gray-600">Initializing Map...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden bg-gray-300">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
