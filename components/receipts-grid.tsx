'use client';

import { motion } from 'framer-motion';
import { FileText, Calendar, DollarSign, Eye } from 'lucide-react';
import Link from 'next/link';
import { Receipt } from '@/lib/types/receipt';

interface ReceiptsGridProps {
  receipts: Receipt[];
}

export function ReceiptsGrid({ receipts }: ReceiptsGridProps) {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  if (receipts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-4"
        >
          <FileText className="w-8 h-8 text-orange-600" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No receipts yet</h3>
        <p className="text-gray-600 mb-6">Create your first receipt to get started</p>
        <Link href="/dashboard/receipts">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
          >
            Create Receipt
          </motion.button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {receipts.map((receipt, index) => (
        <motion.div
          key={receipt.id}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.1,
            duration: 0.5,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{
            y: -8,
            scale: 1.02,
            rotateY: 2,
            transition: { duration: 0.2 }
          }}
          className="group relative"
        >
          <Link href={`/dashboard/receipts/${receipt.id}`}>
            <motion.div
              whileHover={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 cursor-pointer overflow-hidden relative"
            >
              {/* Floating effect background */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Receipt header */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {receipt.customerName}
                      </h3>
                      <p className="text-sm text-gray-500">#{receipt.receiptNumber}</p>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </motion.div>
                </div>

                {/* Receipt details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(receipt.issueDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(receipt.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      receipt.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                    </span>
                    
                    {/* Items count */}
                    <span className="text-xs text-gray-500">
                      {receipt.items?.length || 0} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl"
              />
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
} 