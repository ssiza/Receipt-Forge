'use client';

import { useEffect } from 'react';
import { wrapFetch } from '@/lib/wrapFetch';
import { SWRConfig } from 'swr';

export function FetchWrapper() {
  useEffect(() => {
    wrapFetch();
  }, []);

  return (
    <SWRConfig
      value={{
        onError: (error) => {
          console.error('SWR Error:', error);
        },
        shouldRetryOnError: false,
        revalidateOnFocus: false
      }}
    >
      {null}
    </SWRConfig>
  );
} 