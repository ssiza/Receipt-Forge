'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { HelpCircle, Mail, MessageCircle, ExternalLink, ChevronDown, ChevronUp, BookOpen, Video, Users, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: "How do I create a receipt?",
    answer: "Navigate to the Receipts page and click the 'Create New Receipt' button. Fill in the required information including items, quantities, and prices. You can also add custom fields if needed."
  },
  {
    question: "Can I customize my receipt template?",
    answer: "Yes! Go to the General settings page where you can upload your company logo and customize the receipt appearance. You can also add custom fields to match your business needs."
  },
  {
    question: "How do I download my receipts?",
    answer: "After creating a receipt, you can download it as a PDF by clicking the download button. You can also access all your receipts from the Receipts page and download them individually."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards including Visa, Mastercard, American Express, and Discover. All payments are processed securely through Stripe."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from the Billing page. Your access will continue until the end of your current billing period."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption and security practices to protect your data. All data is stored securely and we never share your information with third parties."
  }
];

function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
            <p className="text-teal-100 text-sm">Find answers to common questions</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-teal-300 transition-colors"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openItems.includes(index) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 bg-gray-50"
                  >
                    <div className="pt-3">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Contact Support</h2>
            <p className="text-blue-100 text-sm">Get help from our support team</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          
          <AnimatePresence>
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700 font-medium">
                  Thank you! Your message has been sent. We'll get back to you within 24 hours.
                </p>
              </motion.div>
            )}
            
            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700 font-medium">
                  Sorry, there was an error sending your message. Please try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}

function QuickLinks() {
  const links = [
    {
      title: "Documentation",
      description: "Browse our comprehensive documentation",
      url: "#",
      icon: BookOpen,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Video Tutorials",
      description: "Learn with step-by-step video guides",
      url: "#",
      icon: Video,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Community Forum",
      description: "Connect with other users",
      url: "#",
      icon: Users,
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Additional Resources</h2>
            <p className="text-purple-100 text-sm">Helpful links and resources</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {links.map((link, index) => (
            <motion.a
              key={index}
              href={link.url}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${link.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <link.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{link.title}</p>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">Get help, find answers, and contact our support team</p>
      </motion.div>
      
      <div className="space-y-6">
        <FAQSection />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ContactForm />
          <QuickLinks />
        </div>
      </div>
    </div>
  );
} 