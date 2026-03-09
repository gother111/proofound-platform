'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PrivacyOverview } from './PrivacyOverview';
import { VerificationStatus } from './VerificationStatus';
import { LinkedInConnect } from './LinkedInConnect';
import { EmailManager } from './EmailManager';
import { PasswordChangeForm } from './PasswordChangeForm';
import { resetTour } from '@/actions/tour';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { RotateCcw, Loader2 } from 'lucide-react';
import { CustomizableDashboard } from '../dashboard/CustomizableDashboard';
import { VideoIntegrationsManager } from './VideoIntegrationsManager';
import { PortfolioVisibilityCard } from './PortfolioVisibilityCard';
import { AppSurface } from '@/components/ui/v2/AppSurface';

interface SettingsContentProps {
  userId: string;
}

const ALLOWED_TABS = ['account', 'dashboard', 'integrations', 'notifications', 'privacy'] as const;
type AllowedTab = (typeof ALLOWED_TABS)[number];

export function SettingsContent({ userId }: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState('account');
  const [isResettingTour, setIsResettingTour] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch user email on mount
  useEffect(() => {
    async function fetchUserEmail() {
      try {
        const response = await fetch('/api/user/email');
        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email);
        }
      } catch (error) {
        console.error('Failed to fetch user email:', error);
      } finally {
        setIsLoadingEmail(false);
      }
    }
    fetchUserEmail();
  }, []);

  // Sync active tab with ?tab= query param (for OAuth callbacks and deep links).
  useEffect(() => {
    const requestedTab = searchParams?.get('tab') as AllowedTab | null;
    if (requestedTab && ALLOWED_TABS.includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  const handleRestartTour = async () => {
    setIsResettingTour(true);
    try {
      const result = await resetTour();
      if (result.success) {
        toast.success('Tour reset successfully!', {
          description: 'Redirecting to dashboard to start the tour...',
        });
        // Wait a moment then redirect to home to trigger tour
        setTimeout(() => {
          router.push('/app/i/home');
          router.refresh();
        }, 1000);
      } else {
        const errorMessage = result.error || 'Failed to reset tour. Please try again.';
        console.error('Tour reset error:', errorMessage);
        toast.error(errorMessage);
        setIsResettingTour(false);
      }
    } catch (error) {
      console.error('Failed to reset tour:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error('Failed to reset tour', {
        description: errorMessage,
      });
      setIsResettingTour(false);
    }
  };

  return (
    <AppSurface>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
            Settings
          </h1>
          <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
            Manage your account preferences, security, and privacy
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-card border border-proofound-stone dark:border-border">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Email & Authentication
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Manage your email and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEmail ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-proofound-forest" />
                  </div>
                ) : (
                  <EmailManager
                    currentEmail={userEmail || userId}
                    onEmailUpdated={() => {
                      // Refresh email after update
                      fetch('/api/user/email')
                        .then((res) => res.json())
                        .then((data) => setUserEmail(data.email))
                        .catch(console.error);
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Identity Verification
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Add identity and workplace trust signals with precise badge meanings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VerificationStatus />
              </CardContent>
            </Card>

            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Password
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm />
              </CardContent>
            </Card>

            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Language
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Choose your preferred language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  defaultValue="en"
                  className="flex h-11 w-full max-w-xs rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base text-proofound-charcoal dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest"
                >
                  <option value="en">English</option>
                  <option value="sv">Svenska (Swedish)</option>
                </select>
              </CardContent>
            </Card>

            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Help & Support
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Get help and learn about platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-proofound-charcoal dark:text-foreground mb-2">
                    Platform Tour
                  </p>
                  <p className="text-sm text-proofound-charcoal/70 dark:text-muted-foreground mb-3">
                    Want a refresher? Restart the guided tour to learn about key features again.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleRestartTour}
                    disabled={isResettingTour}
                    className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isResettingTour ? 'Restarting...' : 'Restart Tour'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <CustomizableDashboard userId={userId} persona="individual" />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Connected Accounts
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Connect external accounts to import data and enhance your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <LinkedInConnect />
              </CardContent>
            </Card>

            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Video Conferencing
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Connect your calendar for automated interview scheduling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <VideoIntegrationsManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card variant="bento" className="border-proofound-stone dark:border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                  Notifications
                </CardTitle>
                <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Configure how you receive updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  Notification preferences coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Data Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <PortfolioVisibilityCard />
            <PrivacyOverview userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppSurface>
  );
}
