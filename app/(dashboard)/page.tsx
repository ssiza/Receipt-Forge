'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Download, Cloud, Settings, CheckCircle, Star, Users, Plus, Settings as SettingsIcon, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ReceiptsFetcher } from '@/components/receipts-fetcher';
import { NavigationGrid } from '@/components/navigation-grid';
import { AnimatedBackground } from '@/components/animated-background';
import { useAuth } from '@/lib/hooks/useAuth';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show personalized dashboard
  if (user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30 relative">
        <AnimatedBackground />
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.email?.split('@')[0]}!
                </h1>
                <p className="text-gray-600 mt-1">Manage your receipts and account</p>
              </div>
              <div className="hidden sm:flex items-center space-x-3">
                <Button 
                  onClick={() => logout()}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </Button>
                <Link href="/dashboard/receipts">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Receipt
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Layout: Vertical Split */}
          <div className="lg:hidden space-y-8">
            {/* Receipts Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Receipts</h2>
                <Link href="/dashboard/receipts" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View all
                </Link>
              </div>
              <ReceiptsFetcher />
            </section>

            {/* Navigation Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <NavigationGrid />
            </section>
          </div>

          {/* Desktop Layout: Side-by-side Split */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Left Side - Receipts Section */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Receipts</h2>
                <Link href="/dashboard/receipts" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View all
                </Link>
              </div>
              <ReceiptsFetcher />
            </div>

            {/* Right Side - Navigation Section */}
            <div className="lg:col-span-5">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <NavigationGrid />
            </div>
          </div>
        </div>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          <Link href="/dashboard/receipts">
            <Button className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl">
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  // For guest users, show the marketing landing page
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30">
      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Create Professional
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                  {' '}Receipts{' '}
                </span>
                in Seconds
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Transform your business with our powerful receipt generation platform. 
                Create, customize, and manage professional receipts with ease.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/sign-up">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 text-lg">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Terminal Demo */}
            <div className="mt-12 lg:mt-0">
              <div className="bg-gray-900 rounded-lg p-6 shadow-2xl">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="font-mono text-sm text-green-400">
                  <div>$ git clone https://github.com/ssiza/Receipt-Forge.git</div>
                  <div className="text-gray-400">Cloning into 'Receipt-Forge'...</div>
                  <div className="text-gray-400">✓ Receipt generation ready</div>
                  <div className="text-gray-400">✓ Professional templates</div>
                  <div className="text-gray-400">✓ Custom branding</div>
                  <div className="text-gray-400">✓ Export to PDF</div>
                  <div className="text-green-400">$ npm start</div>
                  <div className="text-gray-400">🚀 ReceiptForge is running!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to create professional receipts
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From simple receipts to complex invoices, we've got you covered with powerful features and beautiful templates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Templates</h3>
              <p className="text-gray-600">
                Choose from a variety of professionally designed templates that match your brand.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Export to PDF</h3>
              <p className="text-gray-600">
                Download your receipts as high-quality PDF files for printing or sharing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cloud Storage</h3>
              <p className="text-gray-600">
                All your receipts are safely stored in the cloud and accessible from anywhere.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Branding</h3>
              <p className="text-gray-600">
                Add your logo, colors, and business information to make receipts uniquely yours.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Management</h3>
              <p className="text-gray-600">
                Organize, search, and manage all your receipts from one simple dashboard.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Support</h3>
              <p className="text-gray-600">
                Get help when you need it with our responsive customer support team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to create professional receipts?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of businesses that trust ReceiptForge for their receipt generation needs.
          </p>
          <Link href="/sign-up">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 text-lg">
              Start Creating Receipts
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
