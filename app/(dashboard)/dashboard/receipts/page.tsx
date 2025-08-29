'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Edit, Trash2, Calendar, DollarSign, Eye } from 'lucide-react';

import { ReceiptForm } from '@/components/receipt-form';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { BusinessTemplate, ReceiptFormData } from '@/lib/types/receipt';
import { DownloadButton } from '@/components/download-button';
import useSWR from 'swr';
import { HttpError, serializeError } from '@/lib/serializeError';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url, { 
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      let errorData;
      
      if (responseText.trim()) {
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: 'Invalid response format' };
        }
      } else {
        errorData = { error: 'Empty response from server' };
      }
      
      throw new HttpError(response.status, response.statusText, responseText);
    }
    
    const responseText = await response.text();
    if (!responseText.trim()) {
      throw new Error('Empty response from server');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
};

interface ReceiptItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  [key: string]: any; // For dynamic fields
}

interface Receipt {
  id: string;
  receiptNumber: string;
  issueDate: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: ReceiptItem[];
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  status: string;
  notes?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  dueDate?: string;
  paymentTerms?: string;
  reference?: string;
  itemAdditionalFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
  }>;
  createdAt: string;
}

function ReceiptsPageContent() {
  const searchParams = useSearchParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: receiptsResponse, error: receiptsError, mutate } = useSWR<{ ok: boolean; data: Receipt[] }>('/api/receipts', fetcher, {
    onError: (err) => {
      console.warn('Failed to fetch receipts:', err);
    },
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });
  const { data: teamData, error: teamError } = useSWR('/api/team', fetcher, {
    onError: (err) => {
      console.warn('Failed to fetch team data:', err);
    }
  });
  const { data: usageData, error: usageError } = useSWR<{ ok: boolean; data: { currentUsage: number } }>('/api/usage', fetcher, {
    onError: (err) => {
      console.warn('Failed to fetch usage data:', err);
    }
  });

  // Handle edit parameter from URL
  useEffect(() => {
    const editReceiptId = searchParams.get('edit');
    if (editReceiptId && receiptsResponse?.data) {
      const receiptToEdit = receiptsResponse.data.find(r => r.id === editReceiptId);
      if (receiptToEdit) {
        setEditingReceipt(receiptToEdit);
        setShowCreateForm(true);
      }
    }
  }, [searchParams, receiptsResponse?.data]);

  const receipts = receiptsResponse?.data || [];



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const handleSubmit = async (formData: any) => {
    console.log('Submitting form data:', { formData, editingReceipt });
    setIsSubmitting(true);
    
    try {
      const url = editingReceipt ? `/api/receipts/${editingReceipt.id}` : '/api/receipts';
      const method = editingReceipt ? 'PUT' : 'POST';
      
      // Clean up form data - convert empty strings to null for optional fields
      const cleanedFormData = {
        ...formData,
        customerEmail: formData.customerEmail || null,
        customerPhone: formData.customerPhone || null,
        customerAddress: formData.customerAddress || null,
        notes: formData.notes || null,
        businessName: formData.businessName || null,
        businessAddress: formData.businessAddress || null,
        businessPhone: formData.businessPhone || null,
        businessEmail: formData.businessEmail || null,
        dueDate: formData.dueDate || null,
        paymentTerms: formData.paymentTerms || null,
        reference: formData.reference || null,
        itemAdditionalFields: formData.itemAdditionalFields || null,
      };
      
      console.log('Making request:', { url, method, cleanedFormData });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(cleanedFormData),
      });

      // Always read response as text first
      const responseText = await response.text();
      let responseData;
      
      // Parse JSON only if body is non-empty
      if (responseText.trim()) {
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response JSON:', parseError);
          responseData = { error: 'Invalid response format' };
        }
      } else {
        responseData = { error: 'Empty response from server' };
      }

      if (response.ok) {
        console.log('Receipt saved successfully:', responseData);
        setShowCreateForm(false);
        setEditingReceipt(null);
        mutate();
      } else {
        // Throw HttpError with status and body
        throw new HttpError(response.status, response.statusText, responseText);
      }
    } catch (error) {
      if (error instanceof HttpError && error.status === 409) {
        alert("That receipt number already exists. Please try again.");
      } else {
        console.error('Error saving receipt:', serializeError(error));
        
        let errorMessage = 'Failed to save receipt';
        if (error instanceof HttpError) {
          errorMessage = `HTTP ${error.status}: ${error.message}`;
          if (error.body) {
            try {
              const errorData = JSON.parse(error.body);
              errorMessage = errorData.error || errorData.details || errorMessage;
            } catch {
              errorMessage = `${errorMessage} - ${error.body}`;
            }
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingReceipt(null);
  };

  const handleEdit = (receipt: Receipt) => {
    console.log('Editing receipt:', receipt);
    setEditingReceipt(receipt);
    setShowCreateForm(true);
  };

  const handleDelete = async (receiptId: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        mutate();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete receipt');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt');
    }
  };

  // Show loading state while fetching data
  if (!receiptsResponse && !receiptsError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="text-gray-600 mt-1">Loading...</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (receiptsError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
            <p className="text-gray-600 mt-1">Error loading receipts</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load receipts</h3>
          <p className="text-gray-600 mb-6">
            {receiptsError instanceof HttpError 
              ? `HTTP ${receiptsError.status}: ${receiptsError.message}`
              : receiptsError instanceof Error 
                ? receiptsError.message 
                : 'An unexpected error occurred'
            }
          </p>
          <Button 
            onClick={() => mutate()} 
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-1">
            {receipts.length} total receipts
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            title="Create a new receipt"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Receipt
          </Button>
        </motion.div>
      </div>



      {/* Create/Edit Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {editingReceipt ? 'Edit Receipt' : 'Create New Receipt'}
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <ErrorBoundary>
                <ReceiptForm
                  key={editingReceipt?.id || 'new'}
                  initialData={editingReceipt ? {
                    issueDate: editingReceipt.issueDate,
                    customerName: editingReceipt.customerName,
                    customerEmail: editingReceipt.customerEmail,
                    customerPhone: editingReceipt.customerPhone,
                    customerAddress: editingReceipt.customerAddress,
                    items: editingReceipt.items.map((item, index) => ({
                      ...item,
                      id: item.id || (index + 1).toString()
                    })),
                    subtotal: Number(editingReceipt.subtotal),
                    taxAmount: Number(editingReceipt.taxAmount),
                    totalAmount: Number(editingReceipt.totalAmount),
                    currency: editingReceipt.currency,
                    status: editingReceipt.status,
                    notes: editingReceipt.notes,
                    businessName: editingReceipt.businessName,
                    businessAddress: editingReceipt.businessAddress,
                    businessPhone: editingReceipt.businessPhone,
                    businessEmail: editingReceipt.businessEmail,
                    dueDate: editingReceipt.dueDate,
                    paymentTerms: editingReceipt.paymentTerms,
                    reference: editingReceipt.reference,
                    itemAdditionalFields: editingReceipt.itemAdditionalFields || [],
                  } : undefined}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}

                />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipts List */}
      {receipts && receipts.length > 0 ? (
        <div className="grid gap-4">
          {receipts.map((receipt, index) => (
            <motion.div
              key={receipt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">{receipt.receiptNumber}</h3>
                            <p className="text-gray-600 truncate">{receipt.customerName}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full self-start sm:self-auto ${
                          receipt.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{formatDate(receipt.issueDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4 flex-shrink-0" />
                          <span className="font-semibold text-gray-900">{formatCurrency(receipt.totalAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Eye className="w-4 h-4 flex-shrink-0" />
                          <span>{receipt.items.length} items</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Always visible on mobile, hover on desktop */}
                    <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 w-full sm:w-auto justify-center sm:justify-start">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(receipt)}
                          className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                          title="Edit receipt"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Edit</span>
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
                        <DownloadButton
                          receiptId={receipt.id}
                          receiptNumber={receipt.receiptNumber}
                          variant="pdf"
                          className="w-full sm:w-auto"
                        />
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(receipt.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1 sm:hidden">Delete</span>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-lg border border-gray-100"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No receipts yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first receipt to get started.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              title="Create a new receipt"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Receipt
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReceiptsPageContent />
    </Suspense>
  );
} 