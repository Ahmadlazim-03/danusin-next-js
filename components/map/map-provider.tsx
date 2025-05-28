"use client"

import type { GeoJSONSource, LngLatLike } from "mapbox-gl";
import mapboxgl from "mapbox-gl"; // Corrected import
import type PocketBase from "pocketbase";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { pb } from "@/lib/pocketbase";
export const INDONESIA_CENTER: [number, number] =[118.0, -2.5];

const LOCATION_UPDATE_INTERVAL = 10000
const INACTIVITY_TIMEOUT = 120000 // 2 minutes
const LOCATION_UPDATE_DEBOUNCE = 2000 // 2 seconds

export interface UserLocation {
  id: string
  userId: string
  username?: string
  name?: string
  avatar?: string
  coordinates: [number, number] // [longitude, latitude]
  isActive: boolean
  isCurrentUser?: boolean
  updated?: string
  organizationId?: string
  organizationName?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  image?: string
  description?: string
  target?: string
  targetProgress?: number
  phone?: string
  created: string
  updated: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  discount?: number
  slug: string
  images: string[]
  created: string
  updated: string
  organizationId?: string
  organizationName?: string
  organizationSlug?: string
}

export interface SearchResult {
  type: "product" | "organization" | "user"
  id: string
  name: string
  description?: string
  image?: string
  data: Product | Organization | UserLocation
}

export interface RouteInfo {
  distance: number // in meters
  duration: number // in seconds
  geometry: any // GeoJSON LineString
}

interface MapContextType {
  userLocations: UserLocation[]
  selectedUser: UserLocation | null
  currentUserLocation: UserLocation | null
  isSharingLocation: boolean
  isLoading: boolean
  error: string | null
  pb: PocketBase
  selectUser: (user: UserLocation | null) => void
  startSharingLocation: () => Promise<void>
  stopSharingLocation: () => Promise<void>
  flyToUser: (coordinates: [number, number]) => void
  mapRef: React.MutableRefObject<mapboxgl.Map | null>
  userProducts: Product[]
  isLoadingProducts: boolean
  setError: React.Dispatch<React.SetStateAction<string | null>>
  lastLocationUpdate: Date | null
  searchResults: SearchResult[]
  isSearching: boolean
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  performSearch: () => Promise<void>
  clearSearch: () => void
  activeRoute: RouteInfo | null
  isLoadingRoute: boolean
  navigationTarget: UserLocation | null
  showDirectionsToUser: (user: UserLocation) => Promise<void>
  clearRoute: () => void
  isLocationServiceDegraded: boolean
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null)
  const [currentUserLocation, setCurrentUserLocation] = useState<UserLocation | null>(null)
  const [isSharingLocation, setIsSharingLocation] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // For initial data load
  const [error, setError] = useState<string | null>(null)
  const [userProducts, setUserProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLocationServiceDegraded, setIsLocationServiceDegraded] = useState(false)
  const { toast } = useToast()
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false) // For route calculation
  const [navigationTarget, setNavigationTarget] = useState<UserLocation | null>(null)
  
  const selectingUserRef = useRef(false)
  const locationIntervalRef = useRef<number | null>(null)
  const inactivityTimeoutRef = useRef<number | null>(null)
  const locationUpdateTimeoutRef = useRef<number | null>(null)
  const fetchingLocationsRef = useRef(false)
  const consecutiveErrorsRef = useRef(0)

  const [pbInstance] = useState(() => pb) // Initialize PocketBase instance
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const auth = useAuth()

  const flyToUser = useCallback((coordinates: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coordinates,
        zoom: 15, // Sensible zoom level for user location
        pitch: 60, // 3D-like view
        bearing: 0,
        duration: 2000, // Animation duration
      })
    }
  }, [])

  const stopSharingLocation = useCallback(async () => {
    if (!currentUserLocation) {
      console.warn("Attempted to stop sharing, but no currentUserLocation found.");
      return;
    }
    console.log("Stopping location sharing for user:", currentUserLocation.userId);
    try {
      setIsLoading(true); 
      setIsLocationServiceDegraded(false); 

      if (inactivityTimeoutRef.current) { window.clearTimeout(inactivityTimeoutRef.current); inactivityTimeoutRef.current = null; }
      if (locationUpdateTimeoutRef.current) { window.clearTimeout(locationUpdateTimeoutRef.current); locationUpdateTimeoutRef.current = null; }
      if (locationIntervalRef.current) { window.clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; delete (window as any).locationIntervalId; }
      if ((window as any).locationWatchId) { navigator.geolocation.clearWatch((window as any).locationWatchId); delete (window as any).locationWatchId; }
      
      if (auth.deactivateLiveLocation) {
        await auth.deactivateLiveLocation(currentUserLocation.id);
      } else if ((window as any).authProvider?.deactivateLiveLocation) {
        await (window as any).authProvider.deactivateLiveLocation(currentUserLocation.id);
      } else {
        await pbInstance.collection("danusin_users_location").update(currentUserLocation.id, { isactive: false });
      }
      
      setIsSharingLocation(false);
      setLastLocationUpdate(null); 
      setError(null); 
      
      toast({ title: "Location Sharing Stopped", description: "You are no longer sharing your location.", variant: "default" });
    } catch (err: any) {
      console.error("Error stopping location sharing:", err);
      const errorMsg = `Failed to stop sharing location: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      toast({ title: "Error Stopping Sharing", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserLocation, auth, pbInstance, toast])

  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) { window.clearTimeout(inactivityTimeoutRef.current); }
    if (isSharingLocation && currentUserLocation) { 
      inactivityTimeoutRef.current = window.setTimeout(async () => {
        console.log("Inactivity timeout reached, user marked as inactive:", currentUserLocation.name);
        toast({ title: "Inactive Due to Inactivity", description: "You've been marked as inactive.", variant: "default" });
        await stopSharingLocation(); 
      }, INACTIVITY_TIMEOUT);
    }
  }, [isSharingLocation, currentUserLocation, stopSharingLocation, toast]);

  useEffect(() => {
    const trackActivity = () => resetInactivityTimeout();
    window.addEventListener("mousemove", trackActivity);
    window.addEventListener("keydown", trackActivity);
    window.addEventListener("click", trackActivity);
    window.addEventListener("touchstart", trackActivity);
    resetInactivityTimeout(); 
    return () => {
      window.removeEventListener("mousemove", trackActivity);
      window.removeEventListener("keydown", trackActivity);
      window.removeEventListener("click", trackActivity);
      window.removeEventListener("touchstart", trackActivity);
      if (inactivityTimeoutRef.current) { window.clearTimeout(inactivityTimeoutRef.current); }
    };
  }, [resetInactivityTimeout]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    console.log("Performing search for:", searchQuery);
    try {
      setIsSearching(true);
      const results: SearchResult[] = [];

      const productRecords = await pbInstance.collection("danusin_product").getList(1, 10, {
        filter: `product_name~"${searchQuery}" || description~"${searchQuery}"`,
        sort: "-created", expand: "by_organization",
      });
      console.log(`Found ${productRecords.items.length} product records from search.`);
      for (const record of productRecords.items) {
        let organizationName = undefined, organizationSlug = undefined;
        if (record.by_organization) {
          try {
            if (record.expand?.by_organization) {
              organizationName = record.expand.by_organization.organization_name;
              organizationSlug = record.expand.by_organization.organization_slug;
            } else {
              const org = await pbInstance.collection("danusin_organizations").getOne(record.by_organization);
              organizationName = org.organization_name; organizationSlug = org.organization_slug;
            }
          } catch (e) { console.warn("Could not fetch organization details for product search:", e); }
        }
        const images = record.product_image?.map((image: string) => pbInstance.files.getUrl(record, image, { thumb: "300x300" })) || [];
        const product: Product = { id: record.id, name: record.product_name || "Unnamed Product", description: record.description || "", price: record.price || 0, discount: record.discount, slug: record.slug || "", images, created: record.created, updated: record.updated, organizationId: record.by_organization, organizationName, organizationSlug };
        results.push({ type: "product", id: record.id, name: product.name, description: product.description.replace(/<[^>]*>?/gm, "").substring(0, 100), image: images[0], data: product });
      }

      const orgRecords = await pbInstance.collection("danusin_organizations").getList(1, 10, {
        filter: `organization_name~"${searchQuery}" || organization_description~"${searchQuery}" || organization_slug~"${searchQuery}"`,
        sort: "-created",
      });
      console.log(`Found ${orgRecords.items.length} organization records from search.`);
      for (const record of orgRecords.items) {
        const image = record.organization_image ? pbInstance.files.getUrl(record, record.organization_image, { thumb: "300x300" }) : undefined;
        const organization: Organization = { id: record.id, name: record.organization_name, slug: record.organization_slug, image, description: record.organization_description?.replace(/<[^>]*>?/gm, "") || "", target: record.target, targetProgress: record.target_progress, phone: record.group_phone, created: record.created, updated: record.updated };
        results.push({ type: "organization", id: record.id, name: organization.name, description: (organization.description || "").substring(0, 100), image, data: organization });
      }

      const userRecords = await pbInstance.collection("danusin_users").getList(1, 10, {
        filter: `name~"${searchQuery}" || username~"${searchQuery}"`,
        sort: "-created",
      });
      console.log(`Found ${userRecords.items.length} user records from search.`);
      for (const record of userRecords.items) {
        const locationRecord = userLocations.find((loc) => loc.userId === record.id); 
        if (locationRecord) { 
          results.push({ type: "user", id: record.id, name: record.name || record.username || `User ${record.id.substring(0, 5)}`, description: `@${record.username}`, image: record.avatar ? pbInstance.files.getUrl(record, record.avatar, { thumb: "100x100" }) : undefined, data: locationRecord });
        }
      }
      setSearchResults(results);
    } catch (err) {
      console.error("Error performing search:", err);
      setError("Failed to perform search. Please try again.");
      toast({ title: "Search Error", description: "An error occurred while searching.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, pbInstance, userLocations, toast]); 

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleSelectUser = useCallback((user: UserLocation | null) => {
    if (selectingUserRef.current && selectedUser?.id === user?.id) return; 
    selectingUserRef.current = true;
    console.log("Handling select user:", user?.name || "none");
    setSelectedUser(user); 
    if (user) {
      setTimeout(() => { 
        if (mapRef.current) {
          flyToUser(user.coordinates);
        }
        selectingUserRef.current = false;
      }, 50);
    } else {
      selectingUserRef.current = false;
    }
  }, [flyToUser, selectedUser?.id]); 

  useEffect(() => {
    if (!selectedUser) { setUserProducts([]); return; } 
    
    console.log(`Selected user changed to: ${selectedUser.name}. Fetching products.`);
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        let organizationIdToFetch = selectedUser.organizationId;

        if (!organizationIdToFetch && selectedUser.userId) {
          try {
            const fullUserData = await pbInstance.collection("danusin_users").getOne(selectedUser.userId);
            if (fullUserData.organizations && fullUserData.organizations.length > 0) {
              organizationIdToFetch = fullUserData.organizations[0]; 
              console.log(`Fetched organization ID ${organizationIdToFetch} from full user record for ${selectedUser.name}`);
            }
          } catch (err) {
            console.warn(`Could not fetch full user record or organization for ${selectedUser.name}:`, err);
          }
        }

        let productRecordsResponse;
        if (organizationIdToFetch) { 
          console.log(`Fetching products for organization ID: ${organizationIdToFetch}`);
          productRecordsResponse = await pbInstance.collection("danusin_product").getList(1, 20, { 
            filter: `by_organization="${organizationIdToFetch}"`,
            sort: "-created",
            expand: "by_organization", 
          });
        } else { 
          console.log(`No organization ID for ${selectedUser.name}. Fetching products added by user ID: ${selectedUser.userId}`);
          productRecordsResponse = await pbInstance.collection("danusin_product").getList(1, 20, {
            filter: `added_by="${selectedUser.userId}"`, 
            sort: "-created",
            expand: "by_organization", 
          });
        }
        
        const fetchedItems = productRecordsResponse.items;
        console.log(`Found ${fetchedItems.length} product records for ${selectedUser.name}.`);

        const products: Product[] = await Promise.all(
          fetchedItems.map(async (record: any) => {
            const images = record.product_image?.map((image: string) => pbInstance.files.getUrl(record, image, { thumb: "300x300" })) || [];
            
            let productOrgName = selectedUser.organizationName; 
            let productOrgSlug = undefined;

            if (record.by_organization) {
              if (record.expand?.by_organization) {
                productOrgName = record.expand.by_organization.organization_name;
                productOrgSlug = record.expand.by_organization.organization_slug;
              } else if (!productOrgName) { 
                try {
                  const orgData = await pbInstance.collection("danusin_organizations").getOne(record.by_organization);
                  productOrgName = orgData.organization_name;
                  productOrgSlug = orgData.organization_slug;
                } catch (e) { console.warn(`Could not fetch organization details for product ${record.id}:`, e); }
              }
            }

            return {
              id: record.id,
              name: record.product_name || "Unnamed Product",
              description: record.description || "",
              price: record.price || 0,
              discount: record.discount,
              slug: record.slug || "",
              images,
              created: record.created,
              updated: record.updated,
              organizationId: record.by_organization,
              organizationName: productOrgName,
              organizationSlug: productOrgSlug,
            };
          })
        );
        setUserProducts(products);
      } catch (err: any) {
        console.error("Error fetching products for selected user:", err);
        setUserProducts([]); 
        toast({ title: "Error Loading Products", description: "Failed to load products for this user.", variant: "destructive" });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedUser, pbInstance, toast]);

  useEffect(() => {
    const fetchInitialUserLocations = async () => {
      if (fetchingLocationsRef.current) return;
      fetchingLocationsRef.current = true;
      console.log("Fetching initial user locations...");
      try {
        setIsLoading(true); 
        const records = await pbInstance.collection("danusin_users_location").getList(1, 100, { expand: "danuser_related" });
        const locations: UserLocation[] = [];
        for (const record of records.items) {
          let user = record.expand?.danuser_related;
          if (!user && record.danuser_related) {
            try { user = await pbInstance.collection("danusin_users").getOne(record.danuser_related); } 
            catch (e) { console.warn(`Could not fetch user details for location ID ${record.id}, user ID ${record.danuser_related}:`, e); }
          }
          
          let organizationId = undefined, organizationName = undefined;
          if (user?.organizations && user.organizations.length > 0) {
            try {
              const orgId = user.organizations[0]; 
              const org = await pbInstance.collection("danusin_organizations").getOne(orgId);
              organizationId = org.id;
              organizationName = org.organization_name;
            } catch (e) { console.warn(`Could not fetch organization details for user ${user.id}:`, e); }
          }

          locations.push({ 
            id: record.id, userId: record.danuser_related, 
            username: user?.username || undefined, 
            name: user?.name || user?.username || `User ${record.danuser_related.substring(0, 5)}`, 
            avatar: user?.avatar ? pbInstance.files.getUrl(user, user.avatar, { thumb: "100x100" }) : undefined, 
            coordinates: [record.danuser_location.lon, record.danuser_location.lat], 
            isActive: record.isactive, 
            isCurrentUser: pbInstance.authStore.model?.id === record.danuser_related, 
            updated: record.updated,
            organizationId, 
            organizationName 
          });
        }
        setUserLocations(locations);
        console.log(`Fetched ${locations.length} initial user locations.`);

        const currentActiveUser = locations.find((loc) => loc.isCurrentUser && loc.isActive);
        if (currentActiveUser) {
          setCurrentUserLocation(currentActiveUser);
          setIsSharingLocation(true);
          console.log("Current user location set and sharing started from initial fetch:", currentActiveUser.name);
        } else {
          const currentUserRecord = locations.find(loc => loc.isCurrentUser);
          if (currentUserRecord && !currentUserRecord.isActive) {
            console.log("Current user found but is inactive:", currentUserRecord.name);
            setIsSharingLocation(false);
            setCurrentUserLocation(currentUserRecord); 
          } else if (!currentUserRecord) {
            console.log("Current user not found in initial locations.");
            setIsSharingLocation(false);
            setCurrentUserLocation(null);
          }
        }
        setError(null); 
      } catch (err: any) {
        console.error("Error fetching initial user locations:", err);
        setError(`Failed to load user locations: ${err.message || "Unknown error"}`);
        toast({ title: "Location Data Error", description: "Could not load initial map data. Please check your connection.", variant: "destructive" });
      } finally {
        setIsLoading(false);
        fetchingLocationsRef.current = false;
      }
    };
    fetchInitialUserLocations();

    const handleRealtimeLocationUpdate = async (data: { action: string, record: any }) => {
      console.log("Realtime location update received:", data.action, data.record.id);
      const record = data.record;
      let user = record.expand?.danuser_related; 
      if (!user && record.danuser_related) { 
        try { user = await pbInstance.collection("danusin_users").getOne(record.danuser_related); } 
        catch (e) { console.warn(`Subscription: Could not fetch user details for ${record.danuser_related}:`, e); }
      }
      
      let organizationId = undefined, organizationName = undefined;
      if (user?.organizations && user.organizations.length > 0) {
        try { 
            const orgId = user.organizations[0]; 
            const org = await pbInstance.collection("danusin_organizations").getOne(orgId);
            organizationId = org.id; organizationName = org.organization_name;
        } catch (e) { console.warn(`Subscription: Could not fetch org details for user ${user.id}:`, e); }
      }

      const newLocationData: UserLocation = {
        id: record.id, userId: record.danuser_related,
        username: user?.username || undefined,
        name: user?.name || user?.username || `User ${record.danuser_related.substring(0, 5)}`,
        avatar: user?.avatar ? pbInstance.files.getUrl(user, user.avatar, { thumb: "100x100" }) : undefined,
        coordinates: [record.danuser_location.lon, record.danuser_location.lat],
        isActive: record.isactive,
        isCurrentUser: pbInstance.authStore.model?.id === record.danuser_related,
        updated: record.updated,
        organizationId, organizationName
      };

      setUserLocations((prevLocations) => {
        const existingIndex = prevLocations.findIndex((loc) => loc.id === record.id);
        if (existingIndex >= 0) { 
          const updatedLocations = [...prevLocations];
          updatedLocations[existingIndex] = newLocationData;
          return updatedLocations;
        } else { 
          return [...prevLocations, newLocationData];
        }
      });

      if (newLocationData.isCurrentUser) {
        setCurrentUserLocation(newLocationData.isActive ? newLocationData : null); 
        setIsSharingLocation(newLocationData.isActive);
        if(newLocationData.isActive) setLastLocationUpdate(new Date(newLocationData.updated || Date.now())); 
        console.log(`Current user's location updated via subscription. Active: ${newLocationData.isActive}`);
      }
    };
    
    const unsubscribePromise = pbInstance.collection("danusin_users_location").subscribe("*", async (data) => {
      if (data.action === "create" || data.action === "update") {
        await handleRealtimeLocationUpdate(data);
      } else if (data.action === "delete") {
        console.log("Realtime location delete received:", data.record.id);
        setUserLocations((prev) => prev.filter((loc) => loc.id !== data.record.id));
        if (currentUserLocation?.id === data.record.id) { 
          setCurrentUserLocation(null);
          setIsSharingLocation(false);
          console.log("Current user's location record was deleted.");
        }
      }
    });
    
    return () => { 
      console.log("Unsubscribing from location updates.");
      unsubscribePromise.then(unsub => unsub()).catch(e => console.error("Error during unsubscribe:", e));
    };
  }, [pbInstance, toast, currentUserLocation?.id]); 

  const debouncedUpdateLocation = useCallback((recordId: string, longitude: number, latitude: number) => {
    if (locationUpdateTimeoutRef.current) { window.clearTimeout(locationUpdateTimeoutRef.current); }
    locationUpdateTimeoutRef.current = window.setTimeout(async () => {
      console.log(`Debounced update for record ${recordId}: ${latitude}, ${longitude}`);
      try {
        if (auth.upsertLiveLocation) { await auth.upsertLiveLocation({ lon: longitude, lat: latitude }, recordId); }
        else if ((window as any).authProvider?.upsertLiveLocation) { await (window as any).authProvider.upsertLiveLocation({ lon: longitude, lat: latitude }, recordId); }
        else { await pbInstance.collection("danusin_users_location").update(recordId, { danuser_location: { lat: latitude, lon: longitude }, isactive: true }); }
        
        setLastLocationUpdate(new Date()); 
        setError(null); 
        setIsLocationServiceDegraded(false); 
        consecutiveErrorsRef.current = 0; 
        console.log(`Successfully updated location for record ${recordId} on backend.`);
      } catch (err: any) {
        console.error("Error in debouncedUpdateLocation backend call:", err);
        if (err.message) { console.error("Backend error details:", err.message); }
        if (err.data) { console.error("Backend error data:", err.data); }
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 3) {
          toast({ title: "Persistent Update Issues", description: "Having trouble saving your location updates. Check connection.", variant: "destructive" });
          setIsLocationServiceDegraded(true); 
        }
      }
    }, LOCATION_UPDATE_DEBOUNCE);
  }, [auth, pbInstance, toast]);

  const updateLocation = useCallback(async (recordId: string) => {
    console.log(`Attempting to update location for record ID: ${recordId}`);
    try {
      resetInactivityTimeout(); 
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => { 
            if (err.code === 1) { reject(new Error("Location permission denied. Please enable location access in your browser settings.")); }
            else if (err.code === 2) { reject(new Error("Location unavailable. Your device could not determine your position.")); }
            else if (err.code === 3) { reject(new Error("Location request timed out. Please check your connection and try again.")); } 
            else { reject(new Error(`Geolocation error: ${err.message} (Code: ${err.code})`)); }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 } 
        );
      });
      const { latitude, longitude } = position.coords;
      console.log(`Geolocation success for ${recordId}: ${latitude}, ${longitude} at ${new Date().toLocaleTimeString()}`);
      
      setCurrentUserLocation((prev) => prev && prev.id === recordId ? { ...prev, coordinates: [longitude, latitude], updated: new Date().toISOString() } : prev);
      
      debouncedUpdateLocation(recordId, longitude, latitude); 
    } catch (err: any) {
      const errorMessage = err.message || "Unknown error getting location"; 
      const isTimeoutError = errorMessage.includes("timed out. Please check your connection and try again.");

      // Only log "Error in updateLocation" for non-timeout errors, or if it's a new type of error
      if (!isTimeoutError) {
        console.error("Error in updateLocation (geolocation fetch):", err); 
      }
      console.log("Attempted updateLocation, error occurred:", errorMessage); // General log for any error

      if (err.code && !isTimeoutError) { // Log specific geo error codes if not a timeout we're already toasting for
        console.error("Geolocation error code:", err.code); 
      }
      
      consecutiveErrorsRef.current += 1;

      if (isTimeoutError) { 
        toast({ 
          title: "Location Update Timeout", 
          description: "Location request timed out. Please check your connection. Retrying automatically.", 
          variant: "warning" 
        });
        setError(errorMessage); 
        setIsLocationServiceDegraded(true); 
        console.log("Location timeout detected by updateLocation. Will retry via interval or manual action.");
      } else if (errorMessage.includes("permission denied")) {
         toast({ title: "Location Permission Denied", description: "Please enable location access to share your position.", variant: "destructive" });
         setError(errorMessage);
         setIsLocationServiceDegraded(true); 
         stopSharingLocation(); 
      } else if (consecutiveErrorsRef.current >= 3) {
        toast({ title: "Persistent Location Error", description: errorMessage, variant: "destructive" });
        setError(errorMessage);
        setIsLocationServiceDegraded(true);
      } else {
        // For other errors that are not yet persistent, just log them if not already done.
        // This avoids too many toasts for minor, non-repeating glitches.
        console.warn("Minor location update issue (will not toast yet):", errorMessage);
      }
    }
  }, [resetInactivityTimeout, debouncedUpdateLocation, toast, stopSharingLocation]);

  const startSharingLocation = useCallback(async () => {
    if (!pbInstance.authStore.isValid) {
      const errorMsg = "You must be logged in to share your location";
      setError(errorMsg); toast({ title: "Authentication Required", description: errorMsg, variant: "destructive" }); return;
    }
    console.log("Attempting to start location sharing...");
    try {
      setIsLoading(true); setError(null); consecutiveErrorsRef.current = 0; setIsLocationServiceDegraded(false); 
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition( resolve,
          (err) => {
            if (err.code === 1) { reject(new Error("Location permission denied. Please enable location access in your browser settings.")); }
            else if (err.code === 2) { reject(new Error("Location unavailable. Your device could not determine your position.")); }
            else if (err.code === 3) { reject(new Error("Location request timed out. Please check your connection and try again.")); }
            else { reject(new Error(`Geolocation error: ${err.message} (Code: ${err.code})`)); }
          }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
      });
      const { latitude, longitude } = position.coords;
      console.log(`Initial geolocation success: ${latitude}, ${longitude}`);
      
      const locationData = { danuser_related: pbInstance.authStore.model?.id, danuser_location: { lat: latitude, lon: longitude }, isactive: true };
      let recordIdToUse;
      
      const existingLocationForCurrentUser = userLocations.find(loc => loc.isCurrentUser);

      try {
        if (auth.upsertLiveLocation) {
          recordIdToUse = await auth.upsertLiveLocation({ lon: longitude, lat: latitude }, existingLocationForCurrentUser?.id || null);
        } else if ((window as any).authProvider?.upsertLiveLocation) {
          recordIdToUse = await (window as any).authProvider.upsertLiveLocation({ lon: longitude, lat: latitude }, existingLocationForCurrentUser?.id || null);
        } else {
          let record;
          if (existingLocationForCurrentUser) {
            console.log(`Updating existing location record ${existingLocationForCurrentUser.id} for current user.`);
            record = await pbInstance.collection("danusin_users_location").update(existingLocationForCurrentUser.id, locationData);
          } else {
            console.log("Creating new location record for current user.");
            record = await pbInstance.collection("danusin_users_location").create(locationData);
          }
          recordIdToUse = record.id;
        }
      } catch (err: any) {
        console.error("Error creating/updating location record on backend:", err);
        throw new Error(`Failed to save location to server: ${err.message || "Unknown server error"}`);
      }

      if (!recordIdToUse) { throw new Error("Failed to obtain a record ID for the location after upsert."); }
      console.log(`Location record upserted with ID: ${recordIdToUse}`);
      
      const newCurrentLocationData: UserLocation = {
        id: recordIdToUse, userId: pbInstance.authStore.model?.id as string,
        username: pbInstance.authStore.model?.username,
        name: pbInstance.authStore.model?.name || pbInstance.authStore.model?.username || `User ${pbInstance.authStore.model?.id.substring(0, 5)}`,
        coordinates: [longitude, latitude], isActive: true, isCurrentUser: true,
        updated: new Date().toISOString(),
        organizationId: (pbInstance.authStore.model as any)?.organizations?.[0] || undefined, 
        organizationName: undefined, 
      };
      setCurrentUserLocation(newCurrentLocationData);
      setIsSharingLocation(true);
      setLastLocationUpdate(new Date());
      setError(null);
      
      toast({ title: "Location Sharing Started", description: "Your location is now live on the map!", variant: "default" });
      resetInactivityTimeout();
      flyToUser([longitude, latitude]);
      
      if (locationIntervalRef.current) { window.clearInterval(locationIntervalRef.current); }
      locationIntervalRef.current = window.setInterval(() => { updateLocation(recordIdToUse); }, LOCATION_UPDATE_INTERVAL);
      (window as any).locationIntervalId = locationIntervalRef.current;
      
      if ((window as any).locationWatchId) { navigator.geolocation.clearWatch((window as any).locationWatchId); }
      const watchId = navigator.geolocation.watchPosition(
        (pos) => { debouncedUpdateLocation(recordIdToUse, pos.coords.longitude, pos.coords.latitude); resetInactivityTimeout(); },
        (err) => {
          console.error("Geolocation watchPosition error during sharing:", err);
          if (err.code === 1) { 
            const msg = "Location permission was revoked during active sharing. Stopping updates.";
            setError(msg); toast({ title: "Permission Revoked", description: msg, variant: "destructive" });
            stopSharingLocation(); 
          }
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 } 
      );
      (window as any).locationWatchId = watchId;
    } catch (err: any) {
      console.error("Critical error starting location sharing:", err);
      const errorMsg = err.message || "An unknown error occurred while trying to share your location.";
      setError(`Failed to start sharing: ${errorMsg}`);
      toast({ title: "Location Sharing Failed", description: errorMsg, variant: "destructive" });
      if (locationIntervalRef.current) { window.clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; }
      if ((window as any).locationWatchId) { navigator.geolocation.clearWatch((window as any).locationWatchId); delete (window as any).locationWatchId; }
      setIsSharingLocation(false); 
    } finally {
      setIsLoading(false);
    }
  }, [pbInstance, auth, userLocations, toast, flyToUser, resetInactivityTimeout, updateLocation, debouncedUpdateLocation, stopSharingLocation]);

  useEffect(() => {
    return () => {
      console.log("MapProvider unmounting: Cleaning up timers and watchers.");
      if (locationIntervalRef.current) { window.clearInterval(locationIntervalRef.current); }
      if ((window as any).locationWatchId) { navigator.geolocation.clearWatch((window as any).locationWatchId); }
      if (inactivityTimeoutRef.current) { window.clearTimeout(inactivityTimeoutRef.current); }
      if (locationUpdateTimeoutRef.current) { window.clearTimeout(locationUpdateTimeoutRef.current); }
    };
  }, []);

  useEffect(() => {
    let connectionLostTimeoutId: number | null = null;
    const handleConnectionLoss = async () => {
      console.warn("Network connection lost. Starting 1-minute timer to mark as inactive if still offline.");
      toast({ title: "Connection Lost", description: "You appear to be offline. Will mark as inactive in 1 min if not restored.", variant: "warning" });
      if (connectionLostTimeoutId) window.clearTimeout(connectionLostTimeoutId); 
      connectionLostTimeoutId = window.setTimeout(async () => {
        if (!navigator.onLine && currentUserLocation?.id && isSharingLocation) {
          console.log("Still offline after 1 minute. Attempting to mark user as inactive on backend.");
          try {
            if (auth.deactivateLiveLocation) { await auth.deactivateLiveLocation(currentUserLocation.id); }
            else if ((window as any).authProvider?.deactivateLiveLocation) { await (window as any).authProvider.deactivateLiveLocation(currentUserLocation.id); }
            else { await pbInstance.collection("danusin_users_location").update(currentUserLocation.id, { isactive: false }); }
            toast({ title: "Marked Inactive (Offline)", description: "Marked as inactive due to prolonged connection loss.", variant: "destructive" });
          } catch (err) { console.error("Error marking user inactive after connection loss (timeout):", err); }
        }
      }, 60000); 
    };

    const handleConnectionRestore = () => {
      console.log("Network connection restored.");
      if (connectionLostTimeoutId) { window.clearTimeout(connectionLostTimeoutId); connectionLostTimeoutId = null; }
      toast({ title: "Connection Restored", description: "You are back online.", variant: "default" });
      if (isSharingLocation && currentUserLocation?.id) {
        console.log("Connection restored, attempting to update location.");
        updateLocation(currentUserLocation.id);
      }
      if (isLocationServiceDegraded && error?.includes("timed out")) { 
        setIsLocationServiceDegraded(false);
        setError(null); 
      }
    };

    window.addEventListener("offline", handleConnectionLoss);
    window.addEventListener("online", handleConnectionRestore);
    return () => {
      window.removeEventListener("offline", handleConnectionLoss);
      window.removeEventListener("online", handleConnectionRestore);
      if (connectionLostTimeoutId) { window.clearTimeout(connectionLostTimeoutId); }
    };
  }, [currentUserLocation, auth, toast, pbInstance, isSharingLocation, updateLocation, isLocationServiceDegraded, error]);

  const fetchDirections = useCallback(async (start: [number, number], end: [number, number]): Promise<RouteInfo | null> => {
    try {
      const accessToken = mapboxgl.accessToken; 
      if (!accessToken) { console.error("Mapbox access token is not set."); return null; }
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${accessToken}`;
      const response = await fetch(url);
      if (!response.ok) { throw new Error(`Directions API request failed with status ${response.status}: ${response.statusText}`); }
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return { distance: route.distance, duration: route.duration, geometry: route.geometry };
      }
      console.warn("No routes found by Mapbox Directions API for the given coordinates.");
      return null;
    } catch (error) { console.error("Error fetching directions from Mapbox:", error); return null; }
  }, []); 

  const showDirectionsToUser = useCallback(async (targetUser: UserLocation) => {
    if (!currentUserLocation) {
      toast({ title: "Your Location Needed", description: "Please share your location to get directions.", variant: "destructive" }); return;
    }
    if (!targetUser || !targetUser.coordinates) {
      toast({ title: "Invalid Destination", description: "Cannot get directions to an unspecified user location.", variant: "destructive" }); return;
    }
    console.log(`Showing directions from current user to ${targetUser.name}`);
    try {
      setIsLoadingRoute(true);
      setNavigationTarget(targetUser); 
      const routeInfo = await fetchDirections(currentUserLocation.coordinates, targetUser.coordinates);
      if (routeInfo) {
        setActiveRoute(routeInfo); 
        if (mapRef.current) { 
          const map = mapRef.current;
          const routeSource = map.getSource("route") as GeoJSONSource; 
          if (routeSource) { 
            routeSource.setData({ type: "Feature", properties: {}, geometry: routeInfo.geometry });
          } else { 
            map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: routeInfo.geometry } });
            map.addLayer({ id: "route", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#3b82f6", "line-width": 5, "line-opacity": 0.8 } });
          }
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend(currentUserLocation.coordinates as LngLatLike); 
          bounds.extend(targetUser.coordinates as LngLatLike);     
          map.fitBounds(bounds, { padding: { top: 100, bottom: 100, left: 100, right: 100 }, duration: 1000, maxZoom: 16 });
        }
        toast({ title: "Route Calculated", description: `Distance: ${(routeInfo.distance / 1000).toFixed(1)} km, Approx. ${Math.ceil(routeInfo.duration / 60)} min`, variant: "default" });
      } else {
        toast({ title: "Route Not Found", description: "Could not calculate a route to the selected user.", variant: "destructive" });
        setActiveRoute(null); 
      }
    } catch (error) {
      console.error("Error showing directions:", error);
      toast({ title: "Directions Error", description: "An unexpected error occurred while getting directions.", variant: "destructive" });
      setActiveRoute(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [currentUserLocation, fetchDirections, toast]);

  const clearRoute = useCallback(() => {
    console.log("Clearing active route.");
    setActiveRoute(null);
    setNavigationTarget(null); 
    if (mapRef.current) {
      const map = mapRef.current;
      if (map.getLayer("route")) { map.removeLayer("route"); }
      if (map.getSource("route")) { map.removeSource("route"); }
    }
    toast({ title: "Route Cleared", description: "Navigation route has been removed from the map.", variant: "info" });
  }, [toast]);

  return (
    <MapContext.Provider
      value={{
        userLocations, selectedUser, currentUserLocation, isSharingLocation, isLoading, error, pb: pbInstance,
        selectUser: handleSelectUser, startSharingLocation, stopSharingLocation, flyToUser, mapRef,
        userProducts, isLoadingProducts, setError, lastLocationUpdate, searchResults, isSearching,
        searchQuery, setSearchQuery, performSearch, clearSearch, activeRoute, isLoadingRoute,
        navigationTarget, showDirectionsToUser, clearRoute, isLocationServiceDegraded,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}
