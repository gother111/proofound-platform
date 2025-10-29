"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Building2,
  Landmark,
  Search,
  User,
  ChevronRight,
} from "lucide-react";

export type SettingsMode = "individual" | "organization" | "government";

export interface SettingsSectionConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
}

export interface SettingsShellProps {
  mode: SettingsMode;
  sections: SettingsSectionConfig[];
  initialSectionId?: string;
  headerDescription?: string;
}

const badgeMeta: Record<SettingsMode, { label: string; icon: LucideIcon; tint: string }> = {
  organization: {
    label: "Organization Settings",
    icon: Building2,
    tint: "#7A9278",
  },
  government: {
    label: "Government Settings",
    icon: Landmark,
    tint: "#5C8B89",
  },
  individual: {
    label: "Individual Settings",
    icon: User,
    tint: "#C76B4A",
  },
};

export function SettingsShell({
  mode,
  sections,
  initialSectionId,
  headerDescription,
}: SettingsShellProps) {
  const [activeSectionId, setActiveSectionId] = useState(
    () => initialSectionId ?? sections[0]?.id ?? ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    const normalisedQuery = searchQuery.trim().toLowerCase();
    if (!normalisedQuery) return sections;
    return sections.filter((section) =>
      section.label.toLowerCase().includes(normalisedQuery)
    );
  }, [sections, searchQuery]);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId),
    [sections, activeSectionId]
  );

  const meta = badgeMeta[mode];

  return (
    <div className="min-h-screen bg-proofound-parchment dark:bg-background">
      <div className="sticky top-0 z-30 border-b border-proofound-stone/80 bg-white/80 backdrop-blur-sm dark:border-border dark:bg-background/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-['Crimson_Pro'] text-4xl font-semibold text-proofound-forest dark:text-primary">
                Settings
              </h1>
              {headerDescription ? (
                <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
                  {headerDescription}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full text-sm"
                style={{
                  borderColor: `${meta.tint}33`,
                  backgroundColor: `${meta.tint}14`,
                  color: meta.tint,
                }}
              >
                <meta.icon className="h-3.5 w-3.5" />
                {meta.label}
              </Badge>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                Use the sidebar to switch sections
              </p>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-proofound-charcoal/40 dark:text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search settings..."
              className="rounded-full border-proofound-stone/70 bg-white pl-10 text-proofound-charcoal placeholder:text-proofound-charcoal/40 focus-visible:ring-2 focus-visible:ring-proofound-forest dark:border-border dark:bg-background"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <motion.nav
            key={mode}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-32 space-y-1 border-proofound-stone/80 bg-white/90 p-4 shadow-sm dark:border-border dark:bg-background/90">
              {filteredSections.length ? (
                filteredSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = section.id === activeSectionId;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionId(section.id)}
                      className={
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest" +
                        (isActive
                          ? " bg-proofound-forest/10 text-proofound-forest"
                          : " text-proofound-charcoal/70 hover:bg-proofound-stone/40 hover:text-proofound-charcoal")
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{section.label}</span>
                      {isActive ? (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-xl bg-proofound-stone/40 px-4 py-6 text-center text-sm text-proofound-charcoal/70">
                  No sections match “{searchQuery}”
                </p>
              )}
            </Card>
          </motion.nav>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeSection ? (
                <motion.div
                  key={activeSection.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {activeSection.render()}
                </motion.div>
              ) : (
                <Card className="border-dashed border-proofound-stone/80 bg-white/60 p-10 text-center text-proofound-charcoal/60 dark:border-border">
                  <p>Please choose a section to view its settings.</p>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Separator className="mt-12 border-proofound-stone/70" />
      </div>
    </div>
  );
}


