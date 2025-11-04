'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

interface NotificationPreferences {
  inAppMatchSuggested: boolean;
  inAppIntroAccepted: boolean;
  inAppMessageReceived: boolean;
  inAppVerificationRequested: boolean;
  inAppVerificationCompleted: boolean;
  inAppAssignmentPublished: boolean;
  inAppInterviewScheduled: boolean;
  inAppContractSigned: boolean;
  emailMatchSuggested: boolean;
  emailIntroAccepted: boolean;
  emailMessageReceived: boolean;
  emailVerificationRequested: boolean;
  emailVerificationCompleted: boolean;
  emailAssignmentPublished: boolean;
  emailInterviewScheduled: boolean;
  emailContractSigned: boolean;
}

const NOTIFICATION_TYPES = [
  {
    id: 'MatchSuggested',
    label: 'New Matches',
    description: 'When the system finds a potential match for you',
  },
  {
    id: 'IntroAccepted',
    label: 'Intro Accepted',
    description: 'When someone accepts your introduction request',
  },
  {
    id: 'MessageReceived',
    label: 'New Messages',
    description: 'When you receive a new message',
  },
  {
    id: 'VerificationRequested',
    label: 'Verification Requests',
    description: 'When someone asks you to verify their skill',
  },
  {
    id: 'VerificationCompleted',
    label: 'Verification Results',
    description: 'When your skill verification is completed',
  },
  {
    id: 'AssignmentPublished',
    label: 'New Opportunities',
    description: 'When a new assignment matches your profile',
  },
  {
    id: 'InterviewScheduled',
    label: 'Interview Scheduled',
    description: 'When an interview is scheduled',
  },
  {
    id: 'ContractSigned',
    label: 'Contract Updates',
    description: 'When a contract is signed or updated',
  },
];

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: !prev[key] };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success('Preferences saved successfully');
        setHasChanges(false);
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !preferences) {
    return (
      <div className="min-h-screen bg-[#F7F6F1] p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#6B6760]">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2D3330]">Notification Settings</h1>
            <p className="text-[#6B6760] mt-1">Manage how you receive notifications</p>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <p className="text-sm text-[#2D3330]">
            Choose how you want to be notified for each type of activity. You can enable or disable
            in-app and email notifications independently.
          </p>
        </Card>

        {/* Notification Types */}
        <Card className="p-6">
          <div className="space-y-6">
            {NOTIFICATION_TYPES.map((type, index) => (
              <div key={type.id}>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#2D3330]">{type.label}</h3>
                    <p className="text-sm text-[#6B6760] mt-1">{type.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 ml-4">
                    {/* In-App Toggle */}
                    <div className="flex items-center justify-between space-x-4 p-3 bg-[#F7F6F1] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-4 w-4 text-[#6B6760]" />
                        <Label htmlFor={`inApp${type.id}`} className="cursor-pointer">
                          In-App
                        </Label>
                      </div>
                      <Switch
                        id={`inApp${type.id}`}
                        checked={preferences[`inApp${type.id}` as keyof NotificationPreferences]}
                        onCheckedChange={() =>
                          handleToggle(`inApp${type.id}` as keyof NotificationPreferences)
                        }
                      />
                    </div>

                    {/* Email Toggle */}
                    <div className="flex items-center justify-between space-x-4 p-3 bg-[#F7F6F1] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-[#6B6760]" />
                        <Label htmlFor={`email${type.id}`} className="cursor-pointer">
                          Email
                        </Label>
                      </div>
                      <Switch
                        id={`email${type.id}`}
                        checked={preferences[`email${type.id}` as keyof NotificationPreferences]}
                        onCheckedChange={() =>
                          handleToggle(`email${type.id}` as keyof NotificationPreferences)
                        }
                      />
                    </div>
                  </div>
                </div>

                {index < NOTIFICATION_TYPES.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        </Card>

        {/* Save Button (Bottom) */}
        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
