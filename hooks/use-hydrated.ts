"use client"

import { useEffect, useState } from "react"

/**
 * Hook để đảm bảo component chỉ render sau khi đã hydrate ở client
 * Giúp tránh hydration mismatch giữa server và client
 */
export function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

