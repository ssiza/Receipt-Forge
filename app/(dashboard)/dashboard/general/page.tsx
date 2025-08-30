'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, User, Palette, Upload, CheckCircle } from 'lucide-react';
import { User as UserType } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ReceiptPreferences {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  logoUrl?: string;
  tableColor?: string;
  footerThankYouText?: string;
  footerContactInfo?: string;
}

type AccountFormProps = {
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  nameValue = '',
  emailValue = ''
}: AccountFormProps) {
  const [name, setName] = useState(nameValue);
  const [email, setEmail] = useState(emailValue);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setName(nameValue);
    setEmail(emailValue);
  }, [nameValue, emailValue]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Account updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating account' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 p-3 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="button"
          onClick={handleSave}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Account Changes'
          )}
        </Button>
      </motion.div>
    </div>
  );
}

function AccountFormWithData() {
  const { data: user, error: userError } = useSWR<UserType>('/api/user', fetcher, {
    onError: (err) => {
      console.warn('Failed to fetch user data:', err);
    }
  });

  if (userError) {
    return (
      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-200">
        Failed to load user data. Please try refreshing the page.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-10 bg-gray-200 rounded-xl"></div>
          <div className="h-10 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <AccountForm
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

function ReceiptPreferencesForm() {
  const { data: preferencesData, error: preferencesError } = useSWR<{ ok: boolean; data: ReceiptPreferences }>('/api/receipt-preferences', fetcher, {
    onError: (err) => {
      console.warn('Failed to fetch receipt preferences:', err);
    }
  });
  const [preferences, setPreferences] = useState<ReceiptPreferences>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (preferencesData?.data) {
      setPreferences(preferencesData.data);
    }
  }, [preferencesData]);

  // Show loading state while fetching data
  if (!preferencesData && !preferencesError) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 rounded-xl"></div>
            <div className="h-10 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/receipt-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const result = await response.json();
      
      if (result.ok) {
        setMessage({ type: 'success', text: 'Receipt preferences saved successfully!' });
      } else {
        setMessage({ type: 'error', text: result.details || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Logo Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Business Logo</h3>
            <p className="text-sm text-gray-600">
              Upload your business logo to appear in the top-left corner of your receipts
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Current Logo Display */}
          {preferences.logoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-dashed border-orange-200"
            >
              <img 
                src={preferences.logoUrl} 
                alt="Business Logo" 
                className="w-20 h-12 object-contain bg-white rounded-lg shadow-sm"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Current Logo</p>
                <p className="text-xs text-gray-600">Your logo will appear in the top-left of receipts</p>
              </div>
            </motion.div>
          )}
          
          {/* Upload Area */}
          <div className="relative">
            <input
              type="file"
              id="logo"
              accept="image/jpeg,image/jpg,image/png"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const formData = new FormData();
                  formData.append('logo', file);
                  
                  try {
                    const response = await fetch('/api/upload-logo', {
                      method: 'POST',
                      body: formData,
                    });
                    
                    const result = await response.json();
                    if (result.ok) {
                      setPreferences(prev => ({ ...prev, logoUrl: result.data.logoUrl }));
                      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
                    } else {
                      setMessage({ type: 'error', text: result.details || 'Failed to upload logo' });
                    }
                  } catch (error) {
                    setMessage({ type: 'error', text: 'An error occurred while uploading logo' });
                  }
                }
              }}
              className="hidden"
            />
            <label
              htmlFor="logo"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-400" />
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  <span className="font-medium text-orange-600 hover:text-orange-500">Click to upload</span> your business logo
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG or JPEG (MAX. 2MB)
                </p>
              </div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Business Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
              Business Name
            </Label>
            <Input
              id="businessName"
              placeholder="Your Business Name"
              value={preferences.businessName || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, businessName: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Business Email */}
          <div className="space-y-2">
            <Label htmlFor="businessEmail" className="text-sm font-medium text-gray-700">
              Business Email
            </Label>
            <Input
              id="businessEmail"
              type="email"
              placeholder="business@example.com"
              value={preferences.businessEmail || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, businessEmail: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Phone */}
          <div className="space-y-2">
            <Label htmlFor="businessPhone" className="text-sm font-medium text-gray-700">
              Business Phone
            </Label>
            <Input
              id="businessPhone"
              placeholder="+1 (555) 123-4567"
              value={preferences.businessPhone || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, businessPhone: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Table Color */}
          <div className="space-y-2">
            <Label htmlFor="tableColor" className="text-sm font-medium text-gray-700">
              Table Color
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="tableColor"
                type="color"
                value={preferences.tableColor || '#3b82f6'}
                onChange={(e) => setPreferences(prev => ({ ...prev, tableColor: e.target.value }))}
                className="w-12 h-10 p-1 border rounded-lg"
              />
              <Input
                type="text"
                value={preferences.tableColor || '#3b82f6'}
                onChange={(e) => setPreferences(prev => ({ ...prev, tableColor: e.target.value }))}
                placeholder="#3b82f6"
                className="flex-1 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Business Address */}
        <div className="space-y-2">
          <Label htmlFor="businessAddress" className="text-sm font-medium text-gray-700">
            Business Address <span className="text-gray-400 font-normal">(Optional)</span>
          </Label>
          <Textarea
            id="businessAddress"
            placeholder="123 Business St, City, State 12345 (optional)"
            value={preferences.businessAddress || ''}
            onChange={(e) => setPreferences(prev => ({ ...prev, businessAddress: e.target.value }))}
            rows={2}
            className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500">
            Leave empty if you don't want to display an address on your receipts
          </p>
        </div>
      </motion.div>

      {/* Footer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Footer Text</h3>
        </div>
        
        {/* Footer Thank You Text */}
        <div className="space-y-2">
          <Label htmlFor="footerThankYouText" className="text-sm font-medium text-gray-700">
            Thank You Message
          </Label>
          <Input
            id="footerThankYouText"
            placeholder="Thank you for your business!"
            value={preferences.footerThankYouText || ''}
            onChange={(e) => setPreferences(prev => ({ ...prev, footerThankYouText: e.target.value }))}
            className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Footer Contact Information */}
        <div className="space-y-2">
          <Label htmlFor="footerContactInfo" className="text-sm font-medium text-gray-700">
            Contact Information
          </Label>
          <Textarea
            id="footerContactInfo"
            placeholder="This receipt serves as proof of payment. For questions, please contact us at support@yourbusiness.com"
            value={preferences.footerContactInfo || ''}
            onChange={(e) => setPreferences(prev => ({ ...prev, footerContactInfo: e.target.value }))}
            rows={3}
            className="rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </motion.div>

      {/* Message and Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 pt-6 border-t border-gray-200"
      >
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-2 p-3 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            type="button"
            onClick={handleSave}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function GeneralPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and receipt preferences</p>
      </motion.div>

      <div className="space-y-8">
        {/* Account Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Account Information</h2>
                  <p className="text-green-100 text-sm">
                    Update your personal account details
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
                <AccountFormWithData />
              </Suspense>
            </div>
          </div>
        </motion.div>

        {/* Receipt Branding Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Receipt Branding</h2>
                  <p className="text-purple-100 text-sm">
                    Customize how your receipts look with your business branding
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ReceiptPreferencesForm />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
