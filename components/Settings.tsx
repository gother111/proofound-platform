"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Search,
  Building2,
  User,
  Users,
  Shield,
  CreditCard,
  Plug,
  HelpCircle,
  Mail,
  Globe,
  MapPin,
  Bell,
  Palette,
  Database,
  ChevronRight,
  Moon,
  Sun,
  Eye,
  EyeOff,
  LogOut,
  Trash2
} from 'lucide-react';

type ViewMode = 'organization' | 'individual';
type OrgSection = 'profile' | 'members' | 'security' | 'billing' | 'integrations';
type IndividualSection = 'profile' | 'security-privacy' | 'notifications' | 'appearance' | 'data';

interface SettingsProps {
  profile: any;
}

export function Settings({ profile }: SettingsProps) {
  const router = useRouter();
  const supabase = createClient();
  
  // Determine initial view mode based on profile
  const initialMode: ViewMode = profile?.account_type === 'organization' ? 'organization' : 'individual';
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [activeOrgSection, setActiveOrgSection] = useState<OrgSection>('profile');
  const [activeIndSection, setActiveIndSection] = useState<IndividualSection>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [tagline, setTagline] = useState(profile?.tagline || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [website, setWebsite] = useState(profile?.website || '');

  // Privacy settings
  const [showEmail, setShowEmail] = useState(profile?.field_visibility?.email !== false);
  const [showLocation, setShowLocation] = useState(profile?.field_visibility?.location !== false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Appearance
  const [darkMode, setDarkMode] = useState(false);

  const orgSections = [
    { id: 'profile' as OrgSection, label: 'Organization Profile', icon: Building2 },
    { id: 'members' as OrgSection, label: 'Members & Roles', icon: Users },
    { id: 'security' as OrgSection, label: 'Security & Access', icon: Shield },
    { id: 'billing' as OrgSection, label: 'Billing & Subscription', icon: CreditCard },
    { id: 'integrations' as OrgSection, label: 'Integrations', icon: Plug },
  ];

  const indSections = [
    { id: 'profile' as IndividualSection, label: 'Profile', icon: User },
    { id: 'security-privacy' as IndividualSection, label: 'Security & Privacy', icon: Shield },
    { id: 'notifications' as IndividualSection, label: 'Notifications', icon: Bell },
    { id: 'appearance' as IndividualSection, label: 'Appearance', icon: Palette },
    { id: 'data' as IndividualSection, label: 'Data & Connections', icon: Database },
  ];

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          tagline,
          bio,
          location,
          website,
          field_visibility: {
            email: showEmail,
            location: showLocation
          }
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      console.log('Delete account');
    }
  };

  const renderProfileSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
          {viewMode === 'organization' ? 'Organization Profile' : 'Profile'}
        </h2>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Update your {viewMode === 'organization' ? 'organization' : 'personal'} information
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-xl bg-[#7A9278] text-white">
              {fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">Change Avatar</Button>
            <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
              JPG, PNG or GIF. Max size 2MB
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs mt-1" style={{ color: '#6B6760' }}>
                Contact support to change your email
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Brief description of what you do"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="bg-[#1C4D3A] hover:bg-[#1C4D3A]/90 text-white"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const renderSecurityPrivacySection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
          Security & Privacy
        </h2>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Manage your account security and privacy preferences
        </p>
      </div>

      {/* Password */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>Password</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" placeholder="••••••••" />
          </div>
          <Button variant="outline">Update Password</Button>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show email on profile</Label>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Let others see your email address
              </p>
            </div>
            <Switch checked={showEmail} onCheckedChange={setShowEmail} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Show location on profile</Label>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Display your location to potential matches
              </p>
            </div>
            <Switch checked={showLocation} onCheckedChange={setShowLocation} />
          </div>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>Two-Factor Authentication</h3>
        <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
          Add an extra layer of security to your account
        </p>
        <Button variant="outline">Enable 2FA</Button>
      </Card>

      {/* Account Actions */}
      <Card className="p-6 border-destructive/50">
        <h3 className="font-semibold mb-4 text-destructive">Danger Zone</h3>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <Button 
            variant="destructive" 
            className="w-full justify-start"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  const renderNotificationsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
          Notifications
        </h2>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Manage how you receive notifications
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>All email notifications</Label>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Receive notifications via email
              </p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>New matches</Label>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Get notified when you have new matches
              </p>
            </div>
            <Switch checked={matchNotifications} onCheckedChange={setMatchNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>New messages</Label>
              <p className="text-sm" style={{ color: '#6B6760' }}>
                Get notified when you receive messages
              </p>
            </div>
            <Switch checked={messageNotifications} onCheckedChange={setMessageNotifications} />
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const renderAppearanceSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
          Appearance
        </h2>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Customize how Proofound looks
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>Theme</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setDarkMode(false)}
            className={`p-6 rounded-lg border-2 transition-all ${
              !darkMode ? 'border-[#7A9278]' : 'border-border'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-2" style={{ color: '#D4A574' }} />
            <p className="font-medium" style={{ color: '#2D3330' }}>Light</p>
          </button>
          <button
            onClick={() => setDarkMode(true)}
            className={`p-6 rounded-lg border-2 transition-all ${
              darkMode ? 'border-[#7A9278]' : 'border-border'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-2" style={{ color: '#5C8B89' }} />
            <p className="font-medium" style={{ color: '#2D3330' }}>Dark</p>
          </button>
          <button className="p-6 rounded-lg border-2 border-border opacity-50 cursor-not-allowed">
            <div className="flex gap-2 justify-center mb-2">
              <Sun className="w-4 h-4" />
              <Moon className="w-4 h-4" />
            </div>
            <p className="font-medium text-sm" style={{ color: '#6B6760' }}>Auto (Soon)</p>
          </button>
        </div>
      </Card>
    </motion.div>
  );

  const renderDataSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
          Data & Connections
        </h2>
        <p className="text-sm" style={{ color: '#6B6760' }}>
          Manage your data and connected accounts
        </p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>Export Your Data</h3>
        <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
          Download a copy of your Proofound data
        </p>
        <Button variant="outline">Request Data Export</Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#2D3330' }}>Connected Accounts</h3>
        <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
          Manage your connected social accounts
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm">Google</span>
            <Button variant="ghost" size="sm">Disconnect</Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const activeSection = viewMode === 'organization' ? activeOrgSection : activeIndSection;

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-display font-semibold" style={{ color: '#2D3330' }}>
              Settings
            </h1>
            
            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: '#6B6760' }}>View as:</span>
              <div className="flex bg-muted/30 rounded-full p-1">
                <button
                  onClick={() => setViewMode('organization')}
                  className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${
                    viewMode === 'organization'
                      ? 'bg-[#C76B4A] text-white shadow-sm'
                      : 'text-[#6B6760]'
                  }`}
                >
                  <Building2 className="w-4 h-4 inline-block mr-2" />
                  Organization
                </button>
                <button
                  onClick={() => setViewMode('individual')}
                  className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${
                    viewMode === 'individual'
                      ? 'bg-[#C76B4A] text-white shadow-sm'
                      : 'text-[#6B6760]'
                  }`}
                >
                  <User className="w-4 h-4 inline-block mr-2" />
                  Individual
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6760' }} />
            <Input
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
              style={{ backgroundColor: '#EFEBE3' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="p-4 sticky top-32">
              <nav className="space-y-1">
                {viewMode === 'organization' ? (
                  orgSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeOrgSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveOrgSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-[#7A9278]/10 text-[#7A9278]'
                            : 'text-[#6B6760] hover:bg-[#E8E6DD]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })
                ) : (
                  indSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeIndSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveIndSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-[#7A9278]/10 text-[#7A9278]'
                            : 'text-[#6B6760] hover:bg-[#E8E6DD]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })
                )}
              </nav>
            </Card>
          </motion.div>

          {/* Content Panel */}
          <div className="lg:col-span-3">
            {activeSection === 'profile' && renderProfileSection()}
            {activeSection === 'security-privacy' && renderSecurityPrivacySection()}
            {activeSection === 'security' && renderSecurityPrivacySection()}
            {activeSection === 'notifications' && renderNotificationsSection()}
            {activeSection === 'appearance' && renderAppearanceSection()}
            {activeSection === 'data' && renderDataSection()}
            {(activeSection === 'members' || activeSection === 'billing' || activeSection === 'integrations') && (
              <Card className="p-12 text-center">
                <p className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
                  Coming Soon
                </p>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  This section is under development
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

