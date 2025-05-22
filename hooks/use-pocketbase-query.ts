"use client"

import { pb } from "@/lib/pocketbase"
import { useEffect, useRef, useState } from "react"

interface UsePocketBaseQueryOptions<T> {
  collection: string
  queryParams?: Record<string, any>
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
}

export function usePocketBaseQuery<T = any>({
  collection,
  queryParams = {},
  enabled = true,
  onSuccess,
  onError,
}: UsePocketBaseQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const cancelTokenRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Don't run the query if it's disabled
    if (!enabled) {
      setIsLoading(false)
      return () => {}
    }

    // Generate a unique cancel token for this request
    cancelTokenRef.current = `${collection}_${Date.now()}`
    const cancelToken = cancelTokenRef.current

    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        // Use the PocketBase recommended approach for cancellation
        const result = await pb.collection(collection).getList(1, 50, {
          ...queryParams,
          $autoCancel: false, // Disable auto-cancellation
          $cancelKey: cancelToken, // Use our custom cancel token
        })

        if (isMountedRef.current) {
          setData(result as unknown as T)
          onSuccess?.(result as unknown as T)
        }
      } catch (err: any) {
        // Only handle errors if component is still mounted and it's not a cancellation
        if (isMountedRef.current && err.name !== "AbortError" && err.message !== "The request was autocancelled") {
          setError(err)
          onError?.(err)
          console.error(`Error fetching data from ${collection}:`, err)
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Cleanup function
    return () => {
      // Cancel the request using the PocketBase cancel method
      pb.cancelRequest(cancelToken)
    }
  }, [collection, enabled, onError, onSuccess, JSON.stringify(queryParams)])

  // Function to manually refetch data
  const refetch = async () => {
    // Generate a new cancel token
    cancelTokenRef.current = `${collection}_${Date.now()}`
    const cancelToken = cancelTokenRef.current

    try {
      setIsLoading(true)
      setError(null)

      // Use the PocketBase recommended approach for cancellation
      const result = await pb.collection(collection).getList(1, 50, {
        ...queryParams,
        $autoCancel: false,
        $cancelKey: cancelToken,
      })

      if (isMountedRef.current) {
        setData(result as unknown as T)
        onSuccess?.(result as unknown as T)
      }
      return result
    } catch (err: any) {
      // Only handle errors if it's not a cancellation
      if (err.name !== "AbortError" && err.message !== "The request was autocancelled") {
        setError(err)
        onError?.(err)
        console.error(`Error fetching data from ${collection}:`, err)
      }
      throw err
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  return { data, isLoading, error, refetch }
}
