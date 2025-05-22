"use client";

import { pb } from "@/lib/pocketbase";
import { PointLayer, Popup, Scene } from "@antv/l7";
import { Mapbox } from "@antv/l7-maps";
import { AlertTriangle, Loader } from "lucide-react";
import 'mapbox-gl/dist/mapbox-gl.css'; // <-- CRITICAL: Added Mapbox GL CSS import
import { useEffect, useRef, useState } from "react";

// Interface for Danuser data fetched from PocketBase
interface Danuser {
  id: string;
  name?: string;
  location?: {
    lat: number;
    lon: number; // PocketBase stores as 'lon'
  };
  isdanuser?: boolean;
  // Add other fields as necessary
}

// Props for the L7MapViewer component
interface L7MapViewerProps {
  currentAuthUserId: string | null; // ID of the currently authenticated user
  enableLocationTracking: boolean; // Flag to enable/disable live location tracking
  onLocationUpdateDB: (
    userId: string,
    lon: number,
    lat: number
  ) => Promise<void>;
  onDanuserMarkerClick?: (danuserData: Danuser) => void;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiYWhtYWRsYXppbSIsImEiOiJjbWFudjJscDMwMGJjMmpvcXdja29vN2h6In0.lbl0E3ixhWKnKuQ5T1aQcw";
const LOCATION_UPDATE_INTERVAL_MS = 10000; 
const MAP_LOAD_TIMEOUT_MS = 25000; // Increased timeout slightly

export function L7MapViewer({
  currentAuthUserId,
  enableLocationTracking,
  onLocationUpdateDB,
  onDanuserMarkerClick,
}: L7MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const userPointLayerRef = useRef<PointLayer | null>(null);
  const danusersPointLayerRef = useRef<PointLayer | null>(null);
  const currentPopupRef = useRef<Popup | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const geolocationWatchIdRef = useRef<number | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [danusers, setDanusers] = useState<Danuser[]>([]);
  const [isLoadingDanusers, setIsLoadingDanusers] = useState(true);
  const [rawUserLocation, setRawUserLocation] = useState<{lon: number; lat: number} | null>(null);
  const [displayedUserLocation, setDisplayedUserLocation] = useState<{lon: number; lat: number} | null>(null);

  useEffect(() => {
    console.log("[L7MapViewer] Danusers useEffect - Start. AuthUser:", currentAuthUserId);
    const fetchInitialDanusers = async () => {
      setIsLoadingDanusers(true);
      try {
        const filter = `isdanuser=true${currentAuthUserId ? ` && id != "${currentAuthUserId}"` : ''}`;
        console.log("[L7MapViewer] Fetching danusers with filter:", filter);
        const resultList = await pb
          .collection("danusin_users")
          .getFullList<Danuser>({
            filter: filter,
            sort: "-created",
            $autoCancel: false,
          });
        setDanusers(resultList); // No need to filter self again if filter is correct
      } catch (err: any) {
        console.error("[L7MapViewer] Error fetching danusers:", err);
        setError(`Failed to fetch other users: ${err.message}`);
      } finally {
        setIsLoadingDanusers(false);
      }
    };

    fetchInitialDanusers();

    const unsubscribe = pb.collection("danusin_users").subscribe("*", (e) => {
      console.log("[L7MapViewer] PocketBase event:", e.action, e.record.id);
      const record = e.record as Danuser;
      if (record.id === currentAuthUserId) return; 

      setDanusers((prevDanusers) => {
        const existingUserIndex = prevDanusers.findIndex((user) => user.id === record.id);
        if (e.action === "create" || e.action === "update") {
          if (record.isdanuser && record.location) {
            if (existingUserIndex >= 0) {
              const updatedDanusers = [...prevDanusers];
              updatedDanusers[existingUserIndex] = record;
              return updatedDanusers;
            } else {
              return [...prevDanusers, record];
            }
          } else { 
            if (existingUserIndex >= 0) {
              return prevDanusers.filter((user) => user.id !== record.id);
            }
          }
        } else if (e.action === "delete") {
          if (existingUserIndex >= 0) {
            return prevDanusers.filter((user) => user.id !== record.id);
          }
        }
        return prevDanusers;
      });
    });

    return () => {
      console.log("[L7MapViewer] Unsubscribing from PocketBase danusin_users.");
      pb.collection("danusin_users").unsubscribe();
    };
  }, [currentAuthUserId]);

  useEffect(() => {
    console.log("[L7MapViewer] Map Initialization useEffect - Start.");
    // Moved ref checks to the top, before any state setting
    if (!mapContainerRef.current) {
      console.error("[L7MapViewer] mapContainerRef.current is null at effect start.");
      // Do not set error here yet, as ref might become available if parent re-renders.
      // This effect will re-run if parent changes. If it's consistently null, it's an issue.
      return; 
    }
    if (mapContainerRef.current.offsetWidth === 0 || mapContainerRef.current.offsetHeight === 0) {
      console.error("[L7MapViewer] Map container has zero dimensions at effect start.");
      setError("Map container has no dimensions. Ensure parent elements provide space and CSS (including mapbox-gl.css) is loaded.");
      return;
    }
    if (sceneRef.current && isMapLoaded) { // If scene exists AND map is already marked as loaded
      console.log("[L7MapViewer] Scene already initialized and loaded.");
      return;
    }
     if (sceneRef.current && !isMapLoaded) {
      console.warn("[L7MapViewer] Scene exists but map not loaded. This might be a recovery from a failed attempt or StrictMode. Will try to proceed.");
      // If a scene object exists but map isn't loaded, it might be from a failed init.
      // Destroying it before retrying might be safer.
      if (!sceneRef.current.destroyed) {
        sceneRef.current.destroy();
      }
      sceneRef.current = null;
    }


    setIsMapLoaded(false); 
    setError(null);
    console.log("[L7MapViewer] Starting map initialization process...");

    loadTimeoutRef.current = setTimeout(() => {
      if (!isMapLoaded && mapContainerRef.current) { 
        console.error(`[L7MapViewer] Map loading timed out.`);
        setError(`Map loading timed out. Check network, Mapbox token, and ensure map container is visible with correct dimensions.`);
        setIsMapLoaded(false); // Ensure it's false
      }
    }, MAP_LOAD_TIMEOUT_MS);
    
    const initialCenter: [number, number] = displayedUserLocation
      ? [displayedUserLocation.lon, displayedUserLocation.lat]
      : [106.8227, -6.2088]; 
    const initialZoom = displayedUserLocation ? 13 : 10;

    let tempScene: Scene | null = null;
    try {
      console.log("[L7MapViewer] Creating L7 Scene instance with center:", initialCenter, "zoom:", initialZoom);
      tempScene = new Scene({
        id: mapContainerRef.current!, // mapContainerRef.current is checked above
        map: new Mapbox({
          style: "mapbox://styles/mapbox/light-v11", 
          center: initialCenter,
          pitch: 60, 
          zoom: initialZoom,
          token: MAPBOX_TOKEN,
        }),
        logoVisible: false,
      });

      tempScene.on("loaded", () => {
        console.log("[L7MapViewer] Scene 'loaded' event fired!");
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        if (!mapContainerRef.current) { 
             tempScene?.destroy(); return;
        }
        setIsMapLoaded(true);
        sceneRef.current = tempScene; // Assign the successfully loaded scene
        setError(null);
        
        const mapboxMap = tempScene?.getMapService().map;
        if (mapboxMap) {
            mapboxMap.on('style.load', () => {
                console.log("[L7MapViewer] Mapbox style.load event.");
                 if (mapboxMap.getSource('composite') && !mapboxMap.getLayer('3d-buildings')) {
                    mapboxMap.addLayer({
                        id: '3d-buildings', source: 'composite', 'source-layer': 'building',
                        filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 15,
                        paint: {
                            'fill-extrusion-color': ['interpolate',['linear'],['get', 'height'],0,'#2affff',80,'#00ffcc',160,'#00cc99'],
                            'fill-extrusion-height': ['get', 'height'], 'fill-extrusion-base': ['get', 'min_height'],
                            'fill-extrusion-opacity': 0.8,
                        },
                    }, 'waterway-label'); // Attempt to place before labels
                } else {
                    console.warn("[L7MapViewer] Composite source or 3d-buildings layer issue.");
                }
            });
             mapboxMap.on('error', (e: any) => { // Handle Mapbox specific errors
                console.error("[L7MapViewer] Mapbox specific error:", e.error);
                setError(`Mapbox error: ${e.error?.message || 'Unknown Mapbox error'}`);
                setIsMapLoaded(false); // If Mapbox itself errors, map isn't truly loaded
            });
        }
      });
      tempScene.on("error", (mapErrorEvent) => {
        console.error("[L7MapViewer] L7 Map Scene.on('error'):", mapErrorEvent);
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        setError("L7 Scene error during initialization. Check console.");
        setIsMapLoaded(false);
        tempScene?.destroy(); 
        sceneRef.current = null;
      });
    } catch (initError: any) {
      console.error("[L7MapViewer] Critical error during new Scene():", initError);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setError(`Critical map setup error: ${initError.message}`);
      setIsMapLoaded(false);
    }

    return () => {
      console.log("[L7MapViewer] Cleanup Map Initialization useEffect.");
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      const sceneToDestroy = sceneRef.current || tempScene; // tempScene might be set if sceneRef wasn't
      if (sceneToDestroy && !sceneToDestroy.destroyed) {
        console.log("[L7MapViewer] Destroying scene instance in cleanup.");
        sceneToDestroy.destroy();
      }
      sceneRef.current = null; // Ensure sceneRef is cleared
    };
  }, []); // Initialize map only once. Explicitly empty.

  // Effect for managing geolocation tracking
  useEffect(() => {
    console.log("[L7MapViewer] Geolocation Tracking useEffect. enableLocationTracking:", enableLocationTracking);
    if (enableLocationTracking && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = { lon: position.coords.longitude, lat: position.coords.latitude };
          console.log("[L7MapViewer] Initial Geolocation success:", newLoc);
          setRawUserLocation(newLoc);
          if (!displayedUserLocation) setDisplayedUserLocation(newLoc);
        },
        (err) => {
          console.warn("[L7MapViewer] Geolocation getCurrentPosition error:", err.message);
          setError(`Geolocation error: ${err.message}. Ensure location services are enabled.`);
        }, { timeout: 10000 } // Add timeout for getCurrentPosition
      );

      geolocationWatchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLoc = { lon: position.coords.longitude, lat: position.coords.latitude };
          console.log("[L7MapViewer] Geolocation watch update (raw):", newLoc);
          setRawUserLocation(newLoc);
        },
        (err) => {
          console.warn("[L7MapViewer] Geolocation watchPosition error:", err.message);
          setError(`Tracking error: ${err.message}.`);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      console.log("[L7MapViewer] Geolocation watch started. ID:", geolocationWatchIdRef.current);
    } else {
      if (geolocationWatchIdRef.current !== null) {
        console.log("[L7MapViewer] Clearing geolocation watch. ID:", geolocationWatchIdRef.current);
        navigator.geolocation.clearWatch(geolocationWatchIdRef.current);
        geolocationWatchIdRef.current = null;
      }
    }
    return () => {
      if (geolocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchIdRef.current);
        geolocationWatchIdRef.current = null;
      }
    };
  }, [enableLocationTracking]); // Simplified dependency: only depends on tracking flag

    // Effect for 10-second interval updates (displayed location and DB)
  useEffect(() => {
    if (enableLocationTracking && currentAuthUserId) {
      console.log("[L7MapViewer] Setting up 10s location update interval.");
      locationUpdateIntervalRef.current = setInterval(() => {
        // Use a callback with setRawUserLocation if you need the absolute latest from it.
        // However, for this interval, using the 'rawUserLocation' state directly is usually fine.
        if (rawUserLocation) {
            console.log("[L7MapViewer] 10s Interval: Updating displayed location and DB with:", rawUserLocation);
            setDisplayedUserLocation(rawUserLocation); // Update what's shown on map
            onLocationUpdateDB(currentAuthUserId, rawUserLocation.lon, rawUserLocation.lat)
                .catch(dbError => console.error("[L7MapViewer] Error updating location in DB via interval:", dbError));
        } else {
            console.log("[L7MapViewer] 10s Interval: No rawUserLocation to update.");
        }
      }, LOCATION_UPDATE_INTERVAL_MS);
    } else {
      if (locationUpdateIntervalRef.current) {
        console.log("[L7MapViewer] Clearing 10s location update interval.");
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    }
    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, [enableLocationTracking, currentAuthUserId, onLocationUpdateDB, rawUserLocation]); // Added rawUserLocation

  // Effect for updating the current user's marker on the map
  useEffect(() => {
    if (!isMapLoaded || !sceneRef.current) return;
    const scene = sceneRef.current;
    if (userPointLayerRef.current) {
      try { scene.removeLayer(userPointLayerRef.current); }
      catch (e) { console.warn("[L7MapViewer] Could not remove previous user layer:", e); }
      userPointLayerRef.current = null;
    }

    if (displayedUserLocation) {
      console.log("[L7MapViewer] Updating displayed user marker:", displayedUserLocation);
      const userLayer = new PointLayer({})
        .source(
          [{ lon: displayedUserLocation.lon, lat: displayedUserLocation.lat, name: "Your Location", value: 100, isUser: true }],
          { parser: { type: "json", x: "lon", y: "lat" } }
        )
        .shape("cylinder")
        .size("value", (h) => [10, 10, h as number])
        .color(enableLocationTracking ? "#ff0000" : "#FFA500") 
        .style({ opacity: 1, stroke: "#FFFFFF", strokeWidth: 2 });
      scene.addLayer(userLayer);
      userPointLayerRef.current = userLayer;
      scene.setCenter([displayedUserLocation.lon, displayedUserLocation.lat]);
    }
  }, [isMapLoaded, displayedUserLocation, enableLocationTracking]);

  // Effect for updating danusers' markers on the map
  useEffect(() => {
    if (!isMapLoaded || !sceneRef.current) return;
    const scene = sceneRef.current;
    if (danusersPointLayerRef.current) {
      try { scene.removeLayer(danusersPointLayerRef.current); }
      catch (e) { console.warn("[L7MapViewer] Could not remove previous danusers layer:", e); }
      danusersPointLayerRef.current = null;
    }
    if (currentPopupRef.current) {
      currentPopupRef.current.remove();
      currentPopupRef.current = null;
    }

    const validDanusers = danusers.filter(
      (user) => user.location && typeof user.location.lat === 'number' && typeof user.location.lon === 'number'
    );

    if (validDanusers.length > 0) {
      console.log("[L7MapViewer] Updating danusers markers. Count:", validDanusers.length);
      const layerData = validDanusers.map((user) => ({
        lon: user.location!.lon, lat: user.location!.lat,
        name: user.name || "Danuser", id: user.id,
        value: 50, isUser: false,
      }));
      const newDanusersLayer = new PointLayer({})
        .source(layerData, { parser: { type: "json", x: "lon", y: "lat" } })
        .shape("cylinder")
        .size("value", (h) => [8, 8, h as number])
        .color("#00ffcc")
        .style({ opacity: 0.8, stroke: "#FFFFFF", strokeWidth: 1.5 })
        .active(true);
      newDanusersLayer.on('click', (ev) => {
        if (ev.feature && ev.feature.properties) {
          if (currentPopupRef.current) currentPopupRef.current.remove();
          const props = ev.feature.properties as Danuser & { name: string }; 
          if (onDanuserMarkerClick) {
            const clickedDanuser = danusers.find(d => d.id === props.id);
            if (clickedDanuser) onDanuserMarkerClick(clickedDanuser);
          }
          const popup = new Popup({ offsets: [0, 0], closeButton: true, closeOnClick: true })
            .setLnglat(ev.lngLat)
            .setHTML(`
              <div style="font-family: Arial, sans-serif; font-size: 14px; padding: 8px;">
                <h4 style="margin: 0 0 5px 0; color: #333;">${props.name}</h4>
                <p style="margin: 0; font-size: 12px; color: #666;">ID: ${props.id}</p>
              </div>`);
          scene.addPopup(popup);
          currentPopupRef.current = popup;
        }
      });
      scene.addLayer(newDanusersLayer);
      danusersPointLayerRef.current = newDanusersLayer;
    }
  }, [isMapLoaded, danusers, onDanuserMarkerClick]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
        <AlertTriangle className="h-12 w-12 mb-3" />
        <h3 className="text-xl font-semibold mb-1">Map Error</h3>
        <p className="text-center text-sm">{error}</p>
      </div>
    );
  }

  // More specific loading states
  let loadingMessage = "Initializing Map...";
  if (isMapLoaded && isLoadingDanusers) {
    loadingMessage = "Loading User Locations...";
  } else if (isMapLoaded && enableLocationTracking && !rawUserLocation && !error) {
    // Only show "Acquiring your location..." if map is loaded and we are trying to get location
    loadingMessage = "Acquiring your location...";
  } else if (isMapLoaded && !isLoadingDanusers && enableLocationTracking && !displayedUserLocation && rawUserLocation) {
    // Map loaded, danusers loaded, tracking enabled, raw location exists, but displayed not yet set (waiting for interval)
    loadingMessage = "Waiting for location update...";
  }


  if (!isMapLoaded || (isMapLoaded && isLoadingDanusers) || (enableLocationTracking && !displayedUserLocation && !error && !isLoadingDanusers)) { 
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
        <Loader className="h-10 w-10 animate-spin mb-3 text-blue-500" />
        <p className="text-lg text-gray-600">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full rounded-lg overflow-hidden bg-gray-300"
    />
  );
}
