"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles,
  Bot,
  Heart,
  Crown,
  Network,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const productIcons: { [key: string]: any } = {
  'development-hub': Sparkles,
  'ai-cofounder': Bot,
  'zen-hub': Heart,
  'bundle': Crown,
  'platform': Network,
  'assignment-fees': Target,
  'zen-enterprise': Heart,
  'employee-dev': TrendingUp,
};

const productNames: { [key: string]: string } = {
  'development-hub': 'Development Hub Subscription',
  'ai-cofounder': 'AI Co-Founder Tool',
  'zen-hub': 'Zen Hub Premium',
  'bundle': 'Full Bundle Package',
  'platform': 'Platform Subscription',
  'assignment-fees': 'Assignment Completion Fees',
  'zen-enterprise': 'Zen Hub Enterprise',
  'employee-dev': 'Employee Development Hubs',
};

export default function WaitlistPage() {
  const searchParams = useSearchParams();
  const product = searchParams.get('product') || 'bundle';
  const accountType = searchParams.get('type') || 'individual';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const Icon = productIcons[product] || Crown;
  const productName = productNames[product] || 'Subscription Features';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const supabase = createClient();

      const { error: insertError } = await (supabase
        .from('subscription_waitlist') as any)
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          company: formData.company || null,
          product_interest: product,
          account_type: accountType as 'individual' | 'organization',
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Error joining waitlist:', err);
      setError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#E8E6DD', backgroundColor: 'white' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-['Crimson_Pro'] text-xl font-bold" style={{ backgroundColor: '#1C4D3A', color: '#F7F6F1' }}>
              P
            </div>
            <span className="text-xl font-['Crimson_Pro']" style={{ color: '#1C4D3A' }}>
              Proofound
            </span>
          </Link>
          <Link href="/#subscriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {!isSuccess ? (
            <>
              {/* Icon & Title */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(28, 77, 58, 0.1)' }}>
                  <Icon className="w-8 h-8" style={{ color: '#1C4D3A' }} />
                </div>
                <h1 className="text-4xl font-['Crimson_Pro'] mb-3" style={{ color: '#1C4D3A' }}>
                  Join the Waitlist
                </h1>
                <p className="text-lg" style={{ color: '#6B6760' }}>
                  Be the first to know when <strong>{productName}</strong> launches
                </p>
              </div>

              {/* Benefits */}
              <Card className="p-6 mb-8" style={{ backgroundColor: 'white', borderColor: '#E8E6DD' }}>
                <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>
                  As an early subscriber, you'll get:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7A9278' }} />
                    <p className="text-sm" style={{ color: '#2D3330' }}>
                      <strong>Early access</strong> before public launch
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7A9278' }} />
                    <p className="text-sm" style={{ color: '#2D3330' }}>
                      <strong>30% lifetime discount</strong> on all subscriptions
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7A9278' }} />
                    <p className="text-sm" style={{ color: '#2D3330' }}>
                      <strong>Extended free trial</strong> to explore all features
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#7A9278' }} />
                    <p className="text-sm" style={{ color: '#2D3330' }}>
                      <strong>Priority support</strong> and feature requests
                    </p>
                  </div>
                </div>
              </Card>

              {/* Form */}
              <Card className="p-8" style={{ backgroundColor: 'white', borderColor: '#E8E6DD' }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="mt-2"
                    />
                  </div>

                  {accountType === 'organization' && (
                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Your Company"
                        className="mt-2"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(199, 107, 74, 0.1)' }}>
                      <p className="text-sm" style={{ color: '#C76B4A' }}>{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white"
                    style={{ backgroundColor: '#1C4D3A' }}
                  >
                    {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
                  </Button>

                  <p className="text-xs text-center" style={{ color: '#6B6760' }}>
                    We'll notify you as soon as this feature becomes available. No spam, we promise.
                  </p>
                </form>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center" style={{ backgroundColor: 'white', borderColor: '#E8E6DD' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(122, 146, 120, 0.1)' }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: '#7A9278' }} />
              </div>
              <h2 className="text-3xl font-['Crimson_Pro'] mb-4" style={{ color: '#1C4D3A' }}>
                You're on the list!
              </h2>
              <p className="text-lg mb-6" style={{ color: '#6B6760' }}>
                Thanks for your interest in <strong>{productName}</strong>. We'll send you an email as soon as it's ready.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/#subscriptions">
                  <Button variant="outline">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="text-white" style={{ backgroundColor: '#1C4D3A' }}>
                    Join Pilot Program
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
