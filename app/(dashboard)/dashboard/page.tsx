'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Download, Cloud, Settings, CheckCircle, Star, Users, Plus, Settings as SettingsIcon, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ReceiptsFetcher } from '@/components/receipts-fetcher';
import { NavigationGrid } from '@/components/navigation-grid';
import { AnimatedBackground } from '@/components/animated-background';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Professional Receipts
                <span className="block text-orange-500">Made Simple</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Create, customize, and download branded receipts in seconds. Perfect for freelancers and small businesses.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl"
                  >
                    Start Free - 5 Receipts/Month
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Receipt Preview Cards */}
            <div className="mt-12 lg:mt-0 relative">
              <div className="relative">
                {/* Main Receipt Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  {/* Receipt Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">Your Business Name</h3>
                        <p className="text-orange-100 text-sm">123 Business St, City, State</p>
                      </div>
                      <FileText className="w-8 h-8" />
                    </div>
                  </div>

                  {/* Receipt Content */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Date: {new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-900 font-semibold">#RCPT-001</div>
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Web Design Services</span>
                          <span className="font-medium">$500.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Logo Design</span>
                          <span className="font-medium">$200.00</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>Total</span>
                          <span>$700.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Paid</span>
                      </div>
                      <div className="text-xs text-gray-500">Thank you for your business!</div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-orange-100 rounded-full p-3 shadow-lg">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Professional Receipts
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make receipt creation effortless and professional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Design</h3>
              <p className="text-gray-600">Clean, modern receipts that impress your clients and reflect your brand.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant PDF Export</h3>
              <p className="text-gray-600">Download high-quality PDFs ready to email or print in one click.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Branding</h3>
              <p className="text-gray-600">Add your logo, colors, and business details to every receipt.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cloud Storage</h3>
              <p className="text-gray-600">All your receipts are safely stored and accessible from anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Start free with 5 receipts per month. Upgrade when you need more.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">$0</p>
              <p className="text-gray-600 mb-4">5 receipts/month</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>• Basic receipt creation</li>
                <li>• PDF downloads</li>
                <li>• Simple customization</li>
              </ul>
              <Link href="/sign-up">
                <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">6-Month Plan</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">$48</p>
              <p className="text-gray-600 mb-4">$8/month • Save 20%</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>• Unlimited receipts</li>
                <li>• Custom branding</li>
                <li>• Priority support</li>
              </ul>
              <Link href="/pricing">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  Choose Plan
                </Button>
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Yearly Plan</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">$72</p>
              <p className="text-gray-600 mb-4">$6/month • Save 40%</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>• Unlimited receipts</li>
                <li>• Premium support</li>
                <li>• All features included</li>
              </ul>
              <Link href="/pricing">
                <Button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                  Choose Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trusted by Freelancers & Small Businesses
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "ReceiptForge has saved me hours every month. The receipts look professional and my clients love them."
              </p>
              <p className="text-sm text-gray-500 font-medium">Sarah M., Freelance Designer</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "Perfect for my small business. Easy to use and the customization options are exactly what I needed."
              </p>
              <p className="text-sm text-gray-500 font-medium">Mike R., Local Contractor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of professionals creating professional receipts today.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="text-lg px-8 py-3 bg-white text-orange-600 hover:bg-gray-100 shadow-lg hover:shadow-xl"
            >
              Start Free - No Credit Card Required
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-lg font-semibold">ReceiptForge © 2025</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/pricing" className="text-gray-300 hover:text-white">
                Pricing
              </Link>
              <Link href="/sign-in" className="text-gray-300 hover:text-white">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
