'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FileText, 
  Settings, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  Plus,
  Receipt,
  User
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Create Receipt',
    description: 'Generate a new receipt',
    icon: Plus,
    href: '/dashboard/receipts',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'from-orange-50 to-orange-100',
    textColor: 'text-orange-700'
  },
  {
    title: 'All Receipts',
    description: 'View and manage receipts',
    icon: Receipt,
    href: '/dashboard/receipts',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
    textColor: 'text-blue-700'
  },
  {
    title: 'Account Settings',
    description: 'Update your preferences',
    icon: User,
    href: '/dashboard/general',
    color: 'from-green-500 to-green-600',
    bgColor: 'from-green-50 to-green-100',
    textColor: 'text-green-700'
  },
  {
    title: 'Security',
    description: 'Manage your security',
    icon: Shield,
    href: '/dashboard/security',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100',
    textColor: 'text-purple-700'
  },
  {
    title: 'Billing',
    description: 'Manage your subscription',
    icon: CreditCard,
    href: '/dashboard/billing',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'from-indigo-50 to-indigo-100',
    textColor: 'text-indigo-700'
  },
  {
    title: 'Help & Support',
    description: 'Get help and contact support',
    icon: HelpCircle,
    href: '/dashboard/help',
    color: 'from-teal-500 to-teal-600',
    bgColor: 'from-teal-50 to-teal-100',
    textColor: 'text-teal-700'
  }
];

export function NavigationGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {navigationItems.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.1,
            duration: 0.5,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{
            y: -4,
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
        >
                      <Link href={item.href}>
              <motion.div
                whileHover={{ boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                className={`group relative bg-gradient-to-br ${item.bgColor} rounded-2xl p-4 sm:p-6 cursor-pointer border border-white/50 hover:border-white/80 transition-all duration-300 overflow-hidden`}
              >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.div>
                
                {/* Text */}
                <div>
                  <h3 className={`font-semibold text-base sm:text-lg mb-1 sm:mb-2 ${item.textColor} group-hover:text-gray-900 transition-colors`}>
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    {item.description}
                  </p>
                </div>
                
                {/* Arrow indicator */}
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <div className={`w-6 h-6 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              </div>
              
              {/* Hover effect */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-5 rounded-2xl`}
              />
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
} 