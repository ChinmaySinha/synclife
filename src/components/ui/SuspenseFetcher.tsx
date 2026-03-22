'use client';

import useSWR from 'swr';
import React, { ReactNode } from 'react';

interface SuspenseFetcherProps<T> {
  cacheKey: string | null;
  fetcher: () => Promise<T>;
  children: (data: T, mutate: () => void) => ReactNode;
}

/**
 * A utility component that uses SWR in Suspense mode to handle 
 * data fetching declaratively. Throwing promises to the nearest
 * <Suspense> boundary for instant streaming UI.
 */
export default function SuspenseFetcher<T>({ cacheKey, fetcher, children }: SuspenseFetcherProps<T>) {
  const { data, mutate } = useSWR<T>(
    cacheKey, 
    fetcher, 
    { 
      suspense: true,
      revalidateOnFocus: false, // Prevent aggressive refetching 
    }
  );

  return <>{children(data as T, mutate)}</>;
}
