'use client';

import { useEffect } from 'react';
import { wrapFetch } from '@/lib/wrapFetch';

export function FetchWrapper() {
  useEffect(() => {
    wrapFetch();
  }, []);

  return null;
} 