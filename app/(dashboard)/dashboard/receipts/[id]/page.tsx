'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Calendar, DollarSign, User, MapPin, Phone, Mail, Download, Edit, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Receipt } from '@/lib/types/receipt';

import useSWR from 'swr';
import Link from 'next/link';

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    throw error;
  }
};

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const receiptId = params.id as string;

  // Fetch team and usage data for limit checking
  const { data: teamData } = useSWR('/api/team', fetcher);
  const { data: usageData } = useSWR<{ ok: boolean; data: { currentUsage: number } }>('/api/usage', fetcher);
  
  const currentUsage = usageData?.data?.currentUsage || 0;
  const isLimitReached = false; // No limits for testing

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/receipts/${receiptId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Receipt not found');
          }
          throw new Error('Failed to fetch receipt');
        }
        
        const data = await response.json();
        
        if (data.ok && data.data) {
          setReceipt(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch receipt');
        }
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId]);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const handleDownload = async () => {
    if (isLimitReached) {
      setShowUpgradeModal(true);
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/receipts/${receiptId}/pdf`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receipt?.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEdit = () => {
    if (isLimitReached) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Redirect to main receipts page with edit mode
    router.push(`/dashboard/receipts?edit=${receiptId}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/dashboard/receipts');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete receipt');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading receipt</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex space-x-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Try Again
              </Button>
                      </div>
        </motion.div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Monthly Limit Reached
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <p className="text-gray-600 mb-4">
                  You've reached your monthly limit of 5 receipts. To continue creating, editing, and downloading receipts, upgrade to a premium plan.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Premium Plan Benefits:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Unlimited receipts per month</li>
                    <li>• PDF & image downloads</li>
                    <li>• Custom branding</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    router.push('/pricing');
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Upgrade Now
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

  if (!receipt) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt not found</h3>
            <p className="text-gray-600 mb-6">The receipt you're looking for doesn't exist or has been removed.</p>
            <Button
              onClick={() => router.push('/dashboard/receipts')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Receipts
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Receipt #{receipt.receiptNumber}</h1>
              <p className="text-gray-600">Created on {formatDate(receipt.issueDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className={`${
                isLimitReached 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={isLimitReached ? 'Monthly limit reached. Upgrade to download receipts.' : 'Download PDF'}
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className={`${
                isLimitReached 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={isLimitReached ? 'Monthly limit reached. Upgrade to edit receipts.' : 'Edit receipt'}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </motion.div>

        {/* Receipt Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{receipt.businessName || 'Your Business'}</h2>
                  <p className="text-orange-100">{receipt.businessAddress || 'Business Address'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatCurrency(receipt.totalAmount)}</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  receipt.status === 'paid' 
                    ? 'bg-green-500/20 text-green-100' 
                    : 'bg-yellow-500/20 text-yellow-100'
                }`}>
                  {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{receipt.customerName}</p>
                  </div>
                  {receipt.customerEmail && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {receipt.customerEmail}
                      </p>
                    </div>
                  )}
                  {receipt.customerPhone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900 flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {receipt.customerPhone}
                      </p>
                    </div>
                  )}
                  {receipt.customerAddress && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {receipt.customerAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Receipt Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Receipt Number</label>
                    <p className="text-gray-900 font-mono">#{receipt.receiptNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Issue Date</label>
                    <p className="text-gray-900">{formatDate(receipt.issueDate)}</p>
                  </div>
                  {receipt.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      <p className="text-gray-900">{formatDate(receipt.dueDate)}</p>
                    </div>
                  )}
                  {receipt.paymentTerms && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                      <p className="text-gray-900">{receipt.paymentTerms}</p>
                    </div>
                  )}
                  {receipt.reference && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reference</label>
                      <p className="text-gray-900">{receipt.reference}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receipt.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.name || item.description || `Item ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {item.quantity || 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.price || item.unitPrice || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.total || (item.price || item.unitPrice || 0) * (item.quantity || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-md">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(receipt.subtotal)}</span>
                    </div>
                    {parseFloat(receipt.taxAmount || '0') > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">{formatCurrency(receipt.taxAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">{formatCurrency(receipt.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {receipt.notes && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">{receipt.notes}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
} 