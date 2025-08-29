'use client';

import { motion } from 'framer-motion';

export function ReceiptSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.1,
            duration: 0.5
          }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>

              {/* Status and items */}
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 