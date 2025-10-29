"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";

import { SettingsShell, type SettingsSectionConfig } from "@/components/settings/SettingsShell";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "../../ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import type { LucideIcon } from "lucide-react";

import {
  Bell,
  CreditCard,
  Database,
  Download,
  Globe,
  HelpCircle,
  Link2,
  LogOut,
  Mail,
  MessageCircle,
  Monitor,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  User,
  Calendar,
  MapPin,
  Link,
} from "lucide-react";

type IndividualProfile = {
  id: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  locale: string;
  persona: string | null;
};

export interface IndividualSettingsViewProps {
  profile: IndividualProfile;
  email?: string | null;
}

export function IndividualSettingsView({ profile, email }: IndividualSettingsViewProps) {
  const sections = useMemo<SettingsSectionConfig[]>(
    () => [
      { id: "profile", label: "Profile", icon: User, render: () => <ProfileSection profile={profile} email={email} /> },
      { id: "security", label: "Security & Privacy", icon: Shield, render: () => <SecuritySection /> },
      { id: "notifications", label: "Notifications", icon: Bell, render: () => <NotificationsSection /> },
      { id: "appearance", label: "Appearance", icon: Palette, render: () => <AppearanceSection /> },
      {
        id: "subscription",
        label: "Subscription & Features",
        icon: CreditCard,
        render: () => <SubscriptionSection />,
      },
      { id: "data", label: "Data & Connections", icon: Database, render: () => <DataSection /> },
      { id: "support", label: "Support & Legal", icon: HelpCircle, render: () => <SupportSection /> },
    ],
    [profile, email]
  );

  return (
    <SettingsShell
      mode="individual"
      sections={sections}
      headerDescription="Manage your personal preferences, security, and connected services"
    />
  );
}

function ProfileSection({ profile, email }: { profile: IndividualProfile; email?: string | null }) {
  const initials = (profile.displayName ?? "").split(" ").map((part) => part[0]).join("") || "U";

  return (
    <SettingsPanel
      title="Profile Settings"
      description="Update how you appear across Proofound and keep your contact info current."
      actions={
        <Button variant="outline" className="rounded-full">
          Preview Profile
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="space-y-4">
          <Label className="text-sm font-semibold text-proofound-charcoal">Profile Photo</Label>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="h-24 w-24 rounded-2xl border border-proofound-stone/70">
              {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.displayName ?? "Avatar"} /> : null}
              <AvatarFallback className="rounded-2xl bg-proofound-forest/10 text-xl text-proofound-forest">
                {initials.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
              <Button variant="ghost" className="rounded-full text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </section>

        <Separator className="border-proofound-stone/70" />

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display-name">Full Name</Label>
            <Input id="display-name" defaultValue={profile.displayName ?? ""} className="h-11 rounded-xl border-proofound-stone/70" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="handle">Username</Label>
            <Input
              id="handle"
              defaultValue={profile.handle ? `@${profile.handle}` : ""}
              placeholder="@your-handle"
              className="h-11 rounded-xl border-proofound-stone/70"
            />
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="Designer, researcher, systems thinker"
            className="h-11 rounded-xl border-proofound-stone/70"
          />
        </section>

        <section className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell others about your mission and interests..."
            className="min-h-[120px] rounded-2xl border-proofound-stone/70"
          />
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <FieldWithPrefix icon={Globe} label="Primary Language">
            <Select defaultValue={profile.locale ?? "en"}>
              <SelectTrigger id="language" className="h-11 rounded-xl border-proofound-stone/70">
                <SelectValue placeholder="Choose language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sv">Svenska</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </FieldWithPrefix>
          <FieldWithPrefix icon={MapPin} label="Region">
            <Select defaultValue="us">
              <SelectTrigger id="region" className="h-11 rounded-xl border-proofound-stone/70">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="eu">European Union</SelectItem>
                <SelectItem value="apac">APAC</SelectItem>
              </SelectContent>
            </Select>
          </FieldWithPrefix>
          <FieldWithPrefix icon={Calendar} label="Timezone">
            <Select defaultValue="utc">
              <SelectTrigger id="timezone" className="h-11 rounded-xl border-proofound-stone/70">
                <SelectValue placeholder="Timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="pst">PST (UTC-8)</SelectItem>
                <SelectItem value="cet">CET (UTC+1)</SelectItem>
              </SelectContent>
            </Select>
          </FieldWithPrefix>
        </section>

        <Separator className="border-proofound-stone/70" />

        <section className="space-y-3">
          <div className="flex flex-col gap-1">
            <Label>Email</Label>
            <p className="text-sm text-proofound-charcoal/70">
              {email ?? "Email sync coming soon"}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Persona</Label>
            <Badge variant="secondary" className="w-fit rounded-full bg-proofound-forest/10 text-proofound-forest">
              {profile.persona ?? "Not set"}
            </Badge>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="outline" className="rounded-full">
            Discard
          </Button>
          <Button className="rounded-full bg-proofound-forest text-white hover:bg-proofound-forest/90">
            Save Changes
          </Button>
        </div>
      </div>
    </SettingsPanel>
  );
}

function SecuritySection() {
  return (
    <SettingsPanel
      title="Security & Privacy"
      description="Protect your account with strong passwords, 2FA, and visibility preferences."
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" className="h-11 rounded-xl border-proofound-stone/70" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" className="h-11 rounded-xl border-proofound-stone/70" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" className="h-11 rounded-xl border-proofound-stone/70" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="h-11 rounded-full">
                Update Password
              </Button>
            </div>
          </div>
        </div>

        <Separator className="border-proofound-stone/70" />

        <ToggleRow
          title="Two-Factor Authentication"
          description="Add an extra layer of security using an authenticator app."
        />
        <ToggleRow title="Public Profile" description="Allow others to view your profile." defaultChecked />
        <ToggleRow
          title="Discoverability"
          description="Appear in search results and recommendations."
          defaultChecked
        />
        <ToggleRow title="Data Sharing" description="Share anonymized analytics with partners." />

        <Separator className="border-proofound-stone/70" />

        <div className="space-y-4">
          <h3 className="font-['Crimson_Pro'] text-xl text-proofound-charcoal">Active Devices</h3>
          <DeviceRow title="MacBook Pro" subtitle="San Francisco • Active now" current />
          <DeviceRow title="iPhone 15" subtitle="Portland • 2 hours ago" />
          <DeviceRow title="iPad" subtitle="Seattle • 3 days ago" />
        </div>
      </div>
    </SettingsPanel>
  );
}

function NotificationsSection() {
  return (
    <SettingsPanel
      title="Notification Preferences"
      description="Choose how you stay informed about new matches, messages, and updates."
    >
      <div className="space-y-6">
        <NotificationGroup
          title="Email Notifications"
          items={[
            { title: "Match Recommendations", description: "Weekly digest of new opportunities", defaultChecked: true },
            { title: "Messages", description: "Direct messages and mentions", defaultChecked: true },
            { title: "Product Updates", description: "News about new features", defaultChecked: false },
          ]}
        />

        <Separator className="border-proofound-stone/70" />

        <NotificationGroup
          title="In-App Notifications"
          items={[
            { title: "Connection Requests", description: "When someone wants to connect", defaultChecked: true },
            { title: "Impact Milestones", description: "Celebrate major accomplishments", defaultChecked: true },
          ]}
        />

        <Separator className="border-proofound-stone/70" />

        <NotificationGroup
          title="Push Notifications"
          items={[
            { title: "Urgent Alerts", description: "Time-sensitive opportunities", defaultChecked: true },
          ]}
        />

        <Separator className="border-proofound-stone/70" />

        <div className="space-y-3">
          <Label>Email Digest Frequency</Label>
          <Select defaultValue="weekly">
            <SelectTrigger className="h-11 rounded-xl border-proofound-stone/70">
              <SelectValue placeholder="Choose frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily summary</SelectItem>
              <SelectItem value="weekly">Weekly digest</SelectItem>
              <SelectItem value="monthly">Monthly wrap-up</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-full">
            <Bell className="mr-2 h-4 w-4" />
            Send Test Notification
          </Button>
        </div>
      </div>
    </SettingsPanel>
  );
}

function AppearanceSection() {
  return (
    <SettingsPanel
      title="Appearance"
      description="Personalize the interface to match your preferences and accessibility needs."
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid gap-4 sm:grid-cols-3">
            <ThemeChoice icon={Sun} label="Light" active />
            <ThemeChoice icon={Moon} label="Dark" />
            <ThemeChoice icon={Monitor} label="System" />
          </div>
        </div>

        <Separator className="border-proofound-stone/70" />

        <div className="space-y-3">
          <Label>Accent Palette</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "#7A9278", label: "Sage" },
              { value: "#5C8B89", label: "Teal" },
              { value: "#C76B4A", label: "Terracotta" },
              { value: "#D4A574", label: "Ochre" },
            ].map((color) => (
              <button
                key={color.value}
                aria-label={color.label}
                className="h-12 w-12 rounded-full ring-2 ring-proofound-forest ring-offset-2"
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>

        <Separator className="border-proofound-stone/70" />

        <div className="space-y-3">
          <Label>Accessibility</Label>
          <ToggleRow title="Reduce Motion" description="Minimize animations and transitions." />
          <ToggleRow title="High Contrast" description="Increase color contrast for readability." />
          <ToggleRow
            title="Focus Highlights"
            description="Show enhanced focus outlines for keyboard navigation."
            defaultChecked
          />
        </div>
      </div>
    </SettingsPanel>
  );
}

function SubscriptionSection() {
  return (
    <SettingsPanel
      title="Subscription & Features"
      description="Review your plan, usage, and upcoming features available to you."
      actions={
        <Button className="rounded-full bg-proofound-forest text-white hover:bg-proofound-forest/90">
          Upgrade Plan
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-proofound-stone/70 bg-proofound-parchment/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-proofound-forest">Explorer Plan</h3>
              <p className="text-sm text-proofound-charcoal/70">Perfect for individual contributors building credibility.</p>
            </div>
            <Badge variant="outline" className="rounded-full border-proofound-forest/40 bg-proofound-forest/10 text-proofound-forest">
              Active
            </Badge>
          </div>
          <p className="mt-4 text-sm text-proofound-charcoal/70">
            Next billing date: <strong>November 30, 2025</strong>
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <FeatureCard title="Atlas Insights" description="Personalized recommendations based on your profile." />
          <FeatureCard title="Evidence Locker" description="Store and manage verification documents." />
          <FeatureCard title="Impact Highlights" description="Showcase measurable outcomes from collaborations." />
          <FeatureCard title="AI Summaries" description="Generate concise updates to share with organizations." />
        </div>
      </div>
    </SettingsPanel>
  );
}

function DataSection() {
  return (
    <SettingsPanel
      title="Data & Connections"
      description="Control your data exports, connected accounts, and automations."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-proofound-stone/70 bg-proofound-stone/20 p-6">
          <h3 className="font-semibold text-proofound-charcoal">Export Your Data</h3>
          <p className="mt-2 text-sm text-proofound-charcoal/70">
            Download a copy of your profile, activity history, and Atlas insights.
          </p>
          <Button variant="outline" className="mt-4 rounded-full">
            <Download className="mr-2 h-4 w-4" />
            Request Export
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-['Crimson_Pro'] text-xl text-proofound-charcoal">Connected Accounts</h3>
          <ConnectedAppCard name="Google" description="sarah.chen@gmail.com" />
          <ConnectedAppCard name="GitHub" description="@sarahchen" />
          <Button variant="outline" className="rounded-full">
            <Link2 className="mr-2 h-4 w-4" />
            Connect LinkedIn
          </Button>
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-['Crimson_Pro'] text-xl text-destructive">Danger Zone</h3>
          <p className="mt-2 text-sm text-proofound-charcoal/70">
            Permanently delete all your data. This action cannot be undone.
          </p>
          <Button variant="outline" className="mt-4 rounded-full text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Data
          </Button>
        </div>
      </div>
    </SettingsPanel>
  );
}

function SupportSection() {
  return (
    <SettingsPanel
      title="Support & Legal"
      description="Find help resources, reach our team, and review usage policies."
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <SupportButton icon={HelpCircle} title="Help Center" description="Browse guides and FAQs." />
          <SupportButton icon={MessageCircle} title="Submit Feedback" description="Share product ideas." />
          <SupportButton icon={Mail} title="Contact Support" description="We’ll reply within 1 business day." />
        </div>

        <Separator className="border-proofound-stone/70" />

        <div className="space-y-3">
          <LegalLink title="Terms of Service" />
          <LegalLink title="Privacy Policy" />
          <LegalLink title="Cookie Preferences" />
        </div>
      </div>
    </SettingsPanel>
  );
}

function FieldWithPrefix({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative flex items-center">
        <Icon className="absolute left-4 h-4 w-4 text-proofound-charcoal/40" />
        <div className="w-full pl-10">{children}</div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-proofound-charcoal">{title}</p>
        <p className="text-sm text-proofound-charcoal/70">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function DeviceRow({ title, subtitle, current }: { title: string; subtitle: string; current?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Smartphone className="h-5 w-5 text-proofound-charcoal/40" />
        <div>
          <p className="text-sm font-medium text-proofound-charcoal">{title}</p>
          <p className="text-xs text-proofound-charcoal/70">{subtitle}</p>
        </div>
      </div>
      {current ? (
        <Badge variant="secondary" className="rounded-full bg-proofound-forest/10 text-proofound-forest">
          Current
        </Badge>
      ) : (
        <Button variant="ghost" size="sm" className="rounded-full text-destructive">
          <LogOut className="mr-1 h-4 w-4" />
          Sign Out
        </Button>
      )}
    </div>
  );
}

function NotificationGroup({
  title,
  items,
}: {
  title: string;
  items: { title: string; description: string; defaultChecked?: boolean }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-['Crimson_Pro'] text-xl text-proofound-charcoal">{title}</h3>
      {items.map((item) => (
        <ToggleRow key={item.title} title={item.title} description={item.description} defaultChecked={item.defaultChecked} />
      ))}
    </div>
  );
}

function ThemeChoice({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <button
      className={`flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-colors ${
        active ? "border-proofound-forest bg-proofound-forest/5" : "border-proofound-stone hover:border-proofound-forest/60"
      }`}
    >
      <Icon className="h-8 w-8 text-proofound-forest" />
      <span className="text-sm font-medium text-proofound-charcoal">{label}</span>
    </button>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-proofound-stone/60 bg-white/80 p-4">
      <p className="text-sm font-semibold text-proofound-charcoal">{title}</p>
      <p className="text-xs text-proofound-charcoal/70">{description}</p>
    </div>
  );
}

function ConnectedAppCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4">
      <div>
        <p className="text-sm font-medium text-proofound-charcoal">{name}</p>
        <p className="text-xs text-proofound-charcoal/70">{description}</p>
      </div>
      <Button variant="ghost" className="rounded-full text-destructive">
        Disconnect
      </Button>
    </div>
  );
}

function SupportButton({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Button variant="outline" className="h-auto justify-start rounded-2xl border-proofound-stone/70 bg-white/70 px-4 py-4 text-left">
      <Icon className="mr-3 h-5 w-5 text-proofound-forest" />
      <div>
        <p className="text-sm font-medium text-proofound-charcoal">{title}</p>
        <p className="text-xs text-proofound-charcoal/70">{description}</p>
      </div>
    </Button>
  );
}

function LegalLink({ title }: { title: string }) {
  return (
    <button className="flex w-full items-center justify-between rounded-2xl border border-proofound-stone/70 bg-white/70 px-4 py-3 text-sm text-proofound-charcoal transition-colors hover:bg-proofound-stone/40">
      <span>{title}</span>
      <Link className="h-4 w-4 text-proofound-charcoal/50" />
    </button>
  );
}


