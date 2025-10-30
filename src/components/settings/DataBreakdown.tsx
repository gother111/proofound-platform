'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface DataBreakdownProps {
  userId: string;
}

interface ExportData {
  profile: {
    basic: any;
    individual: any;
  };
  skills: {
    skills: any[];
    capabilities: any[];
    evidence: any[];
    totalSkills: number;
    verifiedSkills: number;
  };
  workHistory: {
    projects: any[];
    experiences: any[];
    education: any[];
    volunteering: any[];
    impactStories: any[];
    totalProjects: number;
    totalExperiences: number;
  };
  matches: {
    matches: any[];
    interests: any[];
    totalMatches: number;
    totalInterests: number;
  };
  analytics: {
    events: any[];
    totalEvents: number;
  };
}

export function DataBreakdown({ userId }: DataBreakdownProps) {
  const [data, setData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['profile']));

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/user/export');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const exportData = await response.json();
      setData(exportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-proofound-forest" />
            <span className="ml-3 text-proofound-charcoal/70 dark:text-muted-foreground">
              Loading your data...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 dark:border-red-900 rounded-2xl">
        <CardContent className="pt-6">
          <p className="text-red-600 dark:text-red-400">
            {error || 'Failed to load data. Please try again.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const sections = [
    {
      id: 'profile',
      title: 'Profile Data',
      description: `Basic profile information (Last updated: ${formatDate(data.profile.basic?.updatedAt)})`,
      data: data.profile,
      render: (profileData: any) => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Display Name</p>
              <p className="text-sm font-medium">{profileData.basic?.displayName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Handle</p>
              <p className="text-sm font-medium">{profileData.basic?.handle || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Locale</p>
              <p className="text-sm font-medium">{profileData.basic?.locale || 'en'}</p>
            </div>
            <div>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Persona</p>
              <p className="text-sm font-medium">{profileData.basic?.persona || 'unknown'}</p>
            </div>
          </div>
          {profileData.individual && (
            <div className="mt-4 pt-4 border-t border-proofound-stone dark:border-border">
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mb-2">Bio</p>
              <p className="text-sm">{profileData.individual.bio || 'No bio provided'}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      description: `${data.skills.totalSkills} skills, ${data.skills.verifiedSkills} verified`,
      data: data.skills,
      render: (skillsData: any) => (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-proofound-parchment dark:bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-proofound-forest">{skillsData.totalSkills}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Total Skills</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{skillsData.verifiedSkills}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Verified</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{skillsData.evidence.length}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Evidence Items</p>
            </div>
          </div>
          {skillsData.skills.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mb-2">Recent Skills</p>
              <div className="space-y-2">
                {skillsData.skills.slice(0, 5).map((skill: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-proofound-parchment dark:bg-slate-800 rounded">
                    <span className="text-sm">{skill.skillId}</span>
                    <span className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">
                      Level {skill.level} · {skill.monthsExperience} months
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'work',
      title: 'Projects & Work History',
      description: `${data.workHistory.totalProjects} projects, ${data.workHistory.totalExperiences} experiences`,
      data: data.workHistory,
      render: (workData: any) => (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-proofound-parchment dark:bg-slate-800 rounded-lg">
              <p className="text-xl font-bold">{workData.totalProjects}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Projects</p>
            </div>
            <div className="text-center p-3 bg-proofound-parchment dark:bg-slate-800 rounded-lg">
              <p className="text-xl font-bold">{workData.totalExperiences}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Experiences</p>
            </div>
            <div className="text-center p-3 bg-proofound-parchment dark:bg-slate-800 rounded-lg">
              <p className="text-xl font-bold">{workData.education.length}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Education</p>
            </div>
            <div className="text-center p-3 bg-proofound-parchment dark:bg-slate-800 rounded-lg">
              <p className="text-xl font-bold">{workData.volunteering.length}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Volunteering</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'matches',
      title: 'Match History',
      description: `${data.matches.totalMatches} matches, ${data.matches.totalInterests} interests expressed`,
      data: data.matches,
      render: (matchData: any) => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-proofound-parchment dark:bg-slate-800 rounded-lg p-3">
              <p className="text-2xl font-bold text-proofound-forest">{matchData.totalMatches}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Total Matches</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{matchData.totalInterests}</p>
              <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground">Interests Expressed</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'Analytics Data',
      description: `${data.analytics.totalEvents} events (anonymized with hashed IPs)`,
      data: data.analytics,
      render: (analyticsData: any) => (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              ℹ️ All analytics data is pseudonymized. IP addresses and user agents are hashed (SHA-256) before storage, making them irreversible and GDPR-compliant.
            </p>
          </div>
          <div className="text-center p-4 bg-proofound-parchment dark:bg-slate-800 rounded-lg">
            <p className="text-3xl font-bold text-proofound-forest">{analyticsData.totalEvents}</p>
            <p className="text-sm text-proofound-charcoal/60 dark:text-muted-foreground mt-1">
              Total Events Tracked
            </p>
            <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground mt-2">
              Auto-deleted after 90 days
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-['Crimson_Pro']">Data Breakdown</CardTitle>
          <CardDescription>
            Detailed view of all data we have collected about you
          </CardDescription>
        </CardHeader>
      </Card>

      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        return (
          <Card
            key={section.id}
            className="border-proofound-stone dark:border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full text-left"
            >
              <CardHeader className="hover:bg-proofound-parchment/50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-['Crimson_Pro'] flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 mr-2 text-proofound-forest" />
                      ) : (
                        <ChevronRight className="h-5 w-5 mr-2 text-proofound-charcoal/60" />
                      )}
                      {section.title}
                    </CardTitle>
                    <CardDescription className="ml-7">{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </button>

            {isExpanded && (
              <CardContent className="border-t border-proofound-stone dark:border-border">
                {section.render(section.data)}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

