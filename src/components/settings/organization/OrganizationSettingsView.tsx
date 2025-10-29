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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "../../ui/switch";

import type { LucideIcon } from "lucide-react";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  Key,
  Link2,
  Mail,
  MapPin,
  Plug,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
  Users,
  UserPlus,
} from "lucide-react";

type OrganizationInfo = {
  id: string;
  displayName: string;
  createdAt: Date;
  tagline?: string | null;
  website?: string | null;
  registrationCountry?: string | null;
  registrationRegion?: string | null;
  logoUrl?: string | null;
};

type MembershipInfo = {
  role: string;
};

type AuditLogEntry = {
  id: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: string;
};

export interface OrganizationSettingsViewProps {
  organization: OrganizationInfo;
  membership: MembershipInfo;
  logs: AuditLogEntry[];
}

export function OrganizationSettingsView({ organization, membership, logs }: OrganizationSettingsViewProps) {
  const sections = useMemo<SettingsSectionConfig[]>(
    () => [
      {
        id: "profile",
        label: "Organization Profile",
        icon: Building2,
        render: () => <OrgProfileSection organization={organization} />,
      },
      {
        id: "members",
        label: "Members & Roles",
        icon: Users,
        render: () => <MembersSection />,
      },
      {
        id: "security",
        label: "Security & Access",
        icon: Shield,
        render: () => <SecuritySection logs={logs} />,
      },
      {
        id: "billing",
        label: "Billing & Subscription",
        icon: CreditCard,
        render: () => <BillingSection />,
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: Plug,
        render: () => <IntegrationsSection />,
      },
      {
        id: "support",
        label: "Support & Legal",
        icon: HelpCircle,
        render: () => <SupportSection role={membership.role} />,
      },
    ],
    [organization, membership.role, logs]
  );

  return (
    <SettingsShell
      mode="organization"
      sections={sections}
      headerDescription={`Administer ${organization.displayName} and keep your workspace aligned.`}
    />
  );
}

function OrgProfileSection({ organization }: { organization: OrganizationInfo }) {
  const initials = organization.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SettingsPanel
      title="Organization Profile"
      description="Update your public profile, brand assets, and primary contact information."
      actions={
        <Button variant="outline" className="rounded-full">
          View Public Profile
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <Label className="text-sm font-semibold text-proofound-charcoal">Organization Logo</Label>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="h-24 w-24 rounded-2xl border border-proofound-stone/70">
              {organization.logoUrl ? (
                <AvatarImage src={organization.logoUrl} alt={organization.displayName} />
              ) : null}
              <AvatarFallback className="rounded-2xl bg-proofound-forest/10 text-xl text-proofound-forest">
                {initials || "ORG"}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
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
          <TextInput label="Organization Name" defaultValue={organization.displayName} />
          <TextInput label="Tagline" placeholder="Summarize your mission in a sentence" defaultValue={organization.tagline ?? ""} />
        </section>

        <section className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Share the impact you deliver, focus areas, and who you serve."
            className="min-h-[120px] rounded-2xl border-proofound-stone/70"
          />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <FieldWithIcon icon={Globe} label="Website">
            <Input
              placeholder="https://proofound.com"
              defaultValue={organization.website ?? ""}
              className="h-11 rounded-xl border-proofound-stone/70"
            />
          </FieldWithIcon>
          <FieldWithIcon icon={MapPin} label="Primary Location">
            <Input
              placeholder="Country, Region"
              defaultValue={
                organization.registrationCountry
                  ? `${organization.registrationCountry}${organization.registrationRegion ? ` • ${organization.registrationRegion}` : ""}`
                  : ""
              }
              className="h-11 rounded-xl border-proofound-stone/70"
            />
          </FieldWithIcon>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <TextInput label="Registration Country" defaultValue={organization.registrationCountry ?? ""} />
          <TextInput label="Registration Region" defaultValue={organization.registrationRegion ?? ""} />
        </section>

        <div className="flex flex-wrap justify-end gap-3">
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

function MembersSection() {
  return (
    <SettingsPanel
      title="Members & Roles"
      description="Manage who can access your workspace and control their permissions."
      actions={
        <Button className="rounded-full bg-proofound-forest text-white hover:bg-proofound-forest/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      }
    >
      <div className="space-y-4">
        {["Owner", "Admin", "Contributor"].map((role) => (
          <MemberRow key={role} role={role} />
        ))}

        <Separator className="border-proofound-stone/70" />

        <div className="rounded-2xl border border-dashed border-proofound-stone/70 bg-proofound-stone/20 p-6 text-center text-sm text-proofound-charcoal/70">
          Role-based permission matrix coming soon.
        </div>
      </div>
    </SettingsPanel>
  );
}

function SecuritySection({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <SettingsPanel
      title="Security & Access"
      description="Strengthen workspace protection and review recent sensitive activity."
    >
      <div className="space-y-6">
        <ToggleRow title="Require 2FA for all members" description="Ensure everyone signs in with two-factor authentication." />
        <ToggleRow title="SSO enforcement" description="Force single sign-on for enterprise teams." />

        <Separator className="border-proofound-stone/70" />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-['Crimson_Pro'] text-xl text-proofound-charcoal">API Tokens</h3>
              <p className="text-sm text-proofound-charcoal/70">Manage production and sandbox keys.</p>
            </div>
            <Button variant="outline" className="rounded-full">
              <Key className="mr-2 h-4 w-4" />
              Generate New Token
            </Button>
          </div>

          <div className="space-y-3">
            <TokenRow name="Production API Key" token="prod_*****************a7f3" />
            <TokenRow name="Sandbox API Key" token="sbx_*****************1f9c" />
          </div>
        </section>

        <Separator className="border-proofound-stone/70" />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Crimson_Pro'] text-xl text-proofound-charcoal">Recent Activity</h3>
            <Badge variant="secondary" className="rounded-full bg-proofound-forest/10 text-proofound-forest">
              Last {logs.length} events
            </Badge>
          </div>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-proofound-stone/70 bg-white/70 p-6 text-center text-sm text-proofound-charcoal/70">
                No audit events yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4">
                  <div>
                    <p className="text-sm font-medium text-proofound-charcoal">{log.action}</p>
                    <p className="text-xs text-proofound-charcoal/70">
                      {log.targetType ? `${log.targetType} • ${log.targetId ?? ""}` : "System"}
                    </p>
                  </div>
                  <p className="text-xs text-proofound-charcoal/60">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SettingsPanel>
  );
}

function BillingSection() {
  return (
    <SettingsPanel
      title="Billing & Subscription"
      description="Review your plan, invoices, and payment methods."
      actions={
        <Button className="rounded-full bg-proofound-forest text-white hover:bg-proofound-forest/90">
          Update Payment Method
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-proofound-stone/70 bg-proofound-parchment/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-proofound-forest">Impact Collective Plan</h3>
              <p className="text-sm text-proofound-charcoal/70">Supports up to 25 members with advanced Atlas analytics.</p>
            </div>
            <Badge variant="outline" className="rounded-full border-proofound-forest/40 bg-proofound-forest/10 text-proofound-forest">
              Active
            </Badge>
          </div>
          <p className="mt-4 text-sm text-proofound-charcoal/70">Next billing date: <strong>November 12, 2025</strong></p>
        </div>

        <section className="space-y-3">
          <h3 className="font-['Crimson_Pro'] text-xl text-proofound-charcoal">Invoices</h3>
          {[1, 2, 3].map((index) => (
            <div key={index} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4">
              <div>
                <p className="text-sm font-medium text-proofound-charcoal">Invoice #{2400 + index}</p>
                <p className="text-xs text-proofound-charcoal/70">Issued September {10 + index}, 2025</p>
              </div>
              <Button variant="outline" className="rounded-full">
                <DownloadIcon />
                Download PDF
              </Button>
            </div>
          ))}
        </section>
      </div>
    </SettingsPanel>
  );
}

function IntegrationsSection() {
  return (
    <SettingsPanel
      title="Integrations"
      description="Connect Proofound with the tools your team already uses."
      actions={
        <Button className="rounded-full bg-proofound-forest text-white hover:bg-proofound-forest/90">
          <Plug className="mr-2 h-4 w-4" />
          Browse Marketplace
        </Button>
      }
    >
      <div className="space-y-4">
        <IntegrationRow name="Slack" description="Keep the team up to date" connected />
        <IntegrationRow name="Google Workspace" description="Sync calendars and Docs" connected />
        <IntegrationRow name="Zapier" description="Automate your workflows" />

        <Separator className="border-proofound-stone/70" />

        <div className="space-y-3">
          <h3 className="font-['Crimson_Pro'] text-xl text-proofound-charcoal">Webhooks</h3>
          <div className="rounded-2xl border border-proofound-stone/70 bg-white/70 p-4">
            <p className="text-sm font-medium text-proofound-charcoal">Endpoint</p>
            <p className="font-mono text-xs text-proofound-charcoal/70">https://hooks.proofound.com/org/new-event</p>
          </div>
          <Button variant="outline" className="rounded-full">
            <Link2 className="mr-2 h-4 w-4" />
            Manage Webhooks
          </Button>
        </div>
      </div>
    </SettingsPanel>
  );
}

function SupportSection({ role }: { role: string }) {
  return (
    <SettingsPanel
      title="Support & Legal"
      description="Access help resources, escalate issues, and review policies."
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <SupportButton icon={HelpCircle} title="Help Center" description="Browse knowledge base articles." />
          <SupportButton icon={Mail} title="Contact Account Manager" description="Priority support for paying teams." />
          <SupportButton icon={AlertTriangle} title="Report an Incident" description="Flag security or trust issues." />
        </div>

        <Separator className="border-proofound-stone/70" />

        <div className="space-y-3">
          <LegalLink title="Master Service Agreement" />
          <LegalLink title="Data Processing Addendum" />
          <LegalLink title="Security Practices" />
        </div>

        {role === "owner" ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-destructive">Danger Zone</p>
                <p className="text-xs text-destructive/80">Transfer or delete the organization. This action cannot be undone.</p>
              </div>
              <Button variant="outline" className="rounded-full border-destructive text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Manage
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </SettingsPanel>
  );
}

function TextInput({ label, defaultValue, placeholder }: { label: string; defaultValue?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 rounded-xl border-proofound-stone/70"
      />
    </div>
  );
}

function FieldWithIcon({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
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

function MemberRow({ role }: { role: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-proofound-forest/10 text-proofound-forest">{role[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-proofound-charcoal">{role} Team Lead</p>
          <p className="text-xs text-proofound-charcoal/70">lead@proofound.com</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="rounded-full bg-proofound-forest/10 text-proofound-forest">
          {role}
        </Badge>
        <Button variant="ghost" className="rounded-full text-destructive">
          <Trash2 className="mr-1 h-4 w-4" />
          Remove
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-proofound-charcoal">{title}</p>
        <p className="text-sm text-proofound-charcoal/70">{description}</p>
      </div>
      <Switch />
    </div>
  );
}

function TokenRow({ name, token }: { name: string; token: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4">
      <div>
        <p className="text-sm font-medium text-proofound-charcoal">{name}</p>
        <p className="font-mono text-xs text-proofound-charcoal/70">{token}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" className="rounded-full">
          <EyeIcon />
        </Button>
        <Button variant="ghost" className="rounded-full">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function IntegrationRow({ name, description, connected }: { name: string; description: string; connected?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-proofound-stone/70 bg-white/70 p-4">
      <div>
        <p className="text-sm font-medium text-proofound-charcoal">{name}</p>
        <p className="text-xs text-proofound-charcoal/70">{description}</p>
      </div>
      {connected ? (
        <Badge variant="secondary" className="rounded-full bg-proofound-forest/10 text-proofound-forest">
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Connected
        </Badge>
      ) : (
        <Button variant="outline" className="rounded-full">
          Connect
        </Button>
      )}
    </div>
  );
}

function SupportButton({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
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
      <FileText className="h-4 w-4 text-proofound-charcoal/50" />
    </button>
  );
}

function EyeIcon() {
  return <svg aria-hidden className="h-4 w-4 text-proofound-charcoal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7"></path><circle cx="12" cy="12" r="3"></circle></svg>;
}

function DownloadIcon() {
  return <svg aria-hidden className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>;
}


