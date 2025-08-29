'use client';

import { useEffect, useState } from 'react';
import { ReceiptsGrid } from './receipts-grid';
import { ReceiptSkeleton } from './receipt-skeleton';
import { Receipt } from '@/lib/types/receipt';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function ReceiptsFetcher() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/receipts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch receipts');
        }
        
        const data = await response.json();
        
        if (data.ok && data.data) {
          setReceipts(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch receipts');
        }
      } catch (err) {
        console.error('Error fetching receipts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  if (loading) {
    return <ReceiptSkeleton />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading receipts</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return <ReceiptsGrid receipts={receipts} />;
} 