'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Menu, FileText, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { 
      href: '/dashboard/receipts', 
      icon: FileText, 
      label: 'Receipts',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-700'
    },
    { 
      href: '/dashboard/general', 
      icon: Settings, 
      label: 'General',
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      textColor: 'text-green-700'
    },
    { 
      href: '/dashboard/security', 
      icon: Shield, 
      label: 'Security',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      textColor: 'text-purple-700'
    },

    { 
      href: '/dashboard/help', 
      icon: HelpCircle, 
      label: 'Help',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-50 to-teal-100',
      textColor: 'text-teal-700'
    }
  ];

  return (
    <div className="flex-1 flex bg-gradient-to-br from-gray-50 via-orange-50/30 to-rose-50/30 min-h-screen">
                {/* Mobile header - fixed at top */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">Dashboard</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="-mr-2"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </div>
          </div>

      {/* Main layout container */}
      <div className="flex w-full h-full">
        {/* Mobile overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 
          lg:block lg:relative lg:translate-x-0 lg:z-auto lg:static
          fixed inset-y-0 left-0 z-50 lg:inset-y-0 lg:left-0
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200/50">
            <h2 className="font-semibold text-gray-900">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between p-4 border-b border-gray-200/50">
            <h2 className="font-semibold text-gray-900">Dashboard</h2>
          </div>

          {/* Navigation items */}
          <nav className="h-full overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={pathname === item.href ? 'secondary' : 'ghost'}
                      className={`w-full justify-start h-12 px-4 rounded-xl transition-all duration-200 ${
                        pathname === item.href 
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                          : `hover:bg-gradient-to-r ${item.bgColor} ${item.textColor} hover:shadow-md`
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </motion.div>
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* Mobile content padding for header */}
          <div className="lg:hidden h-16"></div>
          
          {/* Content wrapper */}
          <div className="p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
