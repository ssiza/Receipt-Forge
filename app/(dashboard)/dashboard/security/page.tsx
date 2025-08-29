'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Trash2, Loader2, Shield, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useActionState } from 'react';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';
import { motion, AnimatePresence } from 'framer-motion';

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account security and privacy</p>
      </motion.div>

      {/* Password Change Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Password</h2>
              <p className="text-purple-100 text-sm">Update your account password</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form className="space-y-4" action={passwordAction}>
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium text-gray-700">
                Current Password
              </Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.currentPassword}
                className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.newPassword}
                className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={passwordState.confirmPassword}
                className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <AnimatePresence>
              {passwordState.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700 font-medium">{passwordState.error}</p>
                </motion.div>
              )}
              {passwordState.success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">{passwordState.success}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isPasswordPending}
              >
                {isPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>

      {/* Account Deletion Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Delete Account</h2>
              <p className="text-red-100 text-sm">Permanently delete your account and data</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">Warning</p>
              <p className="text-sm text-red-700">
                Account deletion is permanent and cannot be undone. All your data, receipts, and settings will be permanently removed.
              </p>
            </div>
          </div>
          
          <form action={deleteAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                defaultValue={deleteState.password}
                className="rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                placeholder="Enter your password to confirm"
              />
            </div>
            
            <AnimatePresence>
              {deleteState.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700 font-medium">{deleteState.error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isDeletePending}
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>

      {/* Security Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Security Tips</h2>
              <p className="text-blue-100 text-sm">Best practices for account security</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Use a strong password</p>
                <p className="text-sm text-gray-600">Include uppercase, lowercase, numbers, and special characters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Never share your password</p>
                <p className="text-sm text-gray-600">Keep your password private and don't use it on other sites</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Enable two-factor authentication</p>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Regular password updates</p>
                <p className="text-sm text-gray-600">Change your password periodically for better security</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
