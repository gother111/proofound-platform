'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  zenPractices,
  localGatherings,
  supportChannels,
  toolkitFilters,
  assessments,
  externalResources,
  locationConsentCopy,
  type ZenPractice,
} from '@/data/zen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Heart, Info, Phone, Shield } from 'lucide-react';
import { PrivacyBanner } from '@/components/zen/PrivacyBanner';
import { CheckInDialog } from '@/components/zen/CheckInDialog';
import { ReflectionDialog } from '@/components/zen/ReflectionDialog';
import { MoodResponsiveContainer, useMood } from '@/components/zen/MoodResponsiveContainer';
import { QuickCheckIn } from '@/components/zen/QuickCheckIn';
import { GuidedBreathing } from '@/components/zen/GuidedBreathing';
import { ReflectionJournal } from '@/components/zen/ReflectionJournal';
import { PracticeCard } from '@/components/zen/PracticeCard';
import { InterviewPrepTab } from '@/components/zen/interview-prep/InterviewPrepTab';
import { MiracleMindCTA } from '@/components/zen/MiracleMindCTA';
import { WellBeingDeltaWidget } from '@/components/wellbeing/WellBeingDeltaWidget';
import { WellBeingTrendChart } from '@/components/wellbeing/WellBeingTrendChart';
import { CheckInHistory } from '@/components/wellbeing/CheckInHistory';
import { WorkScheduleEditor } from '@/components/wellbeing/WorkScheduleEditor';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

function ZenHubContent() {
  const { mood } = useMood();
  const [optInStatus, setOptInStatus] = useState<{
    optedIn: boolean;
    privacyBannerAcknowledged: boolean;
  } | null>(null);
  const [isLoadingOptIn, setIsLoadingOptIn] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('checkin');
  const [activeFilter, setActiveFilter] = useState('All');

  // Dialog states
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);
  const [defaultMilestone, setDefaultMilestone] = useState<'rejection' | 'interview' | 'offer' | undefined>();

  // Data states
  const [deltaData, setDeltaData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [milestoneSuggestion, setMilestoneSuggestion] = useState<'rejection' | 'interview' | 'offer' | null>(null);

  useEffect(() => {
    const fetchOptInStatus = async () => {
      try {
        const response = await fetch('/api/wellbeing/opt-in');
        if (response.ok) {
          const data = await response.json();
          setOptInStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch opt-in status:', error);
      } finally {
        setIsLoadingOptIn(false);
      }
    };
    fetchOptInStatus();
  }, []);

  // Get user id for widgets that need it
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          setUserId(data.user.id);
        }
      } catch (error) {
        console.error('ZenHub: failed to fetch user', error);
      }
    };
    fetchUser();
  }, []);

  const fetchInsights = useCallback(async () => {
    if (!optInStatus?.optedIn) return;
    try {
      const [deltaRes, trendRes] = await Promise.all([
        fetch('/api/wellbeing/delta?period=14'),
        fetch('/api/wellbeing/trend?weeks=4'),
      ]);
      if (deltaRes.ok) setDeltaData(await deltaRes.json());
      if (trendRes.ok) setTrendData(await trendRes.json());
    } catch (e) {
      console.error('Failed to fetch insights', e);
    }
  }, [optInStatus?.optedIn]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    const fetchMilestones = async () => {
      if (!optInStatus?.optedIn || !userId) return;
      try {
        const res = await fetch('/api/wellbeing/milestones');
        if (!res.ok) return;
        const data = await res.json();
        if (data.milestones?.length > 0) {
          setMilestoneSuggestion(data.milestones[0].type);
        }
      } catch (error) {
        console.error('Failed to fetch milestones', error);
      }
    };
    fetchMilestones();
  }, [optInStatus?.optedIn, userId]);

  const handleOptIn = async () => {
    try {
      const response = await fetch('/api/wellbeing/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optedIn: true, privacyBannerAcknowledged: true }),
      });
      if (response.ok) {
        // The POST response has a different format, so set the expected structure
        setOptInStatus({ optedIn: true, privacyBannerAcknowledged: true });
        toast.success('Welcome to Zen Hub');
      }
    } catch (error) {
      toast.error('Failed to enable Zen Hub');
    }
  };

  const handleOpenCheckIn = (milestone?: 'rejection' | 'interview' | 'offer') => {
    setDefaultMilestone(milestone);
    setShowCheckInDialog(true);
  };

  const filteredPractices = useMemo(() => {
    if (activeFilter === 'All') return zenPractices;
    return zenPractices.filter(
      (p) =>
        p.style.toLowerCase() === activeFilter.toLowerCase() ||
        (activeFilter === 'Short' && p.time <= 5) ||
        (activeFilter === 'Long' && p.time > 5)
    );
  }, [activeFilter]);

  if (isLoadingOptIn) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!optInStatus?.optedIn) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="mb-6 font-serif text-3xl text-[#2D3330] dark:text-[#E8E6DD]">Zen Hub</h1>
        <PrivacyBanner onOptIn={handleOptIn} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-[#2D3330] dark:text-[#E8E6DD]">
            Zen Hub
          </h1>
          <p className="text-[#6B6760] dark:text-[#C9C2B8]">
            Your private center for calm and clarity.
          </p>
        </div>

        {/* Crisis Support (Visible when mood is 'support') */}
        {mood === 'support' && (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200 animate-in fade-in slide-in-from-top-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm font-medium">Crisis Support Available 24/7</span>
            <div className="h-4 w-px bg-rose-200 dark:bg-rose-800" />
            <a href="tel:988" className="text-sm font-bold hover:underline">
              Call 988
            </a>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-[#EEF1EA] dark:bg-[#3F473B] p-1">
          <TabsTrigger
            value="checkin"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F2823]"
          >
            Check-In
          </TabsTrigger>
          <TabsTrigger
            value="practices"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F2823]"
          >
            Practices
          </TabsTrigger>
          <TabsTrigger
            value="journal"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F2823]"
          >
            Journal
          </TabsTrigger>
          <TabsTrigger
            value="assessments"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F2823]"
          >
            Assessments
          </TabsTrigger>
          <TabsTrigger
            value="interview-prep"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F2823]"
          >
            Interview Prep
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#2F2823]"
          >
            Insights
          </TabsTrigger>
        </TabsList>

        {/* CHECK-IN TAB */}
        <TabsContent value="checkin" className="space-y-8 animate-in fade-in duration-500">
          {milestoneSuggestion && (
            <Card className="p-4 border-[#E8E6DD] bg-white/70 dark:bg-[#2F2823]/70">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2D3330] dark:text-[#E8E6DD]">
                    Recent update detected
                  </p>
                  <p className="text-sm text-[#6B6760] dark:text-[#C9C2B8]">
                    Log a quick check-in after your recent {milestoneSuggestion}.
                  </p>
                </div>
                <Button onClick={() => handleOpenCheckIn(milestoneSuggestion)} className="bg-[#1C4D3A] text-white">
                  Log check-in
                </Button>
              </div>
            </Card>
          )}

          <QuickCheckIn />

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-[#2D3330] dark:text-[#E8E6DD]">Quick Reset</h3>
              <GuidedBreathing />
            </div>

            <div className="space-y-4">
              <h3 className="font-serif text-xl text-[#2D3330] dark:text-[#E8E6DD]">
                Recommended for You
              </h3>
              <div className="space-y-4">
                {zenPractices.slice(0, 2).map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    onStart={() => {
                      toast.success(`Started ${practice.title}`);
                      // In real app, this might open a modal or navigation
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PRACTICES TAB */}
        <TabsContent value="practices" className="space-y-6 animate-in fade-in duration-500">
          <MiracleMindCTA />

          <div className="flex flex-wrap gap-2">
            {['All', ...toolkitFilters].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                onClick={() => setActiveFilter(filter)}
                size="sm"
                className={activeFilter === filter ? 'bg-[#1C4D3A] text-white' : 'border-[#E8E6DD]'}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPractices.map((practice) => (
              <PracticeCard
                key={practice.id}
                practice={practice}
                onStart={() => toast.success(`Started ${practice.title}`)}
              />
            ))}
          </div>

          <div className="pt-8 border-t border-[#E8E6DD] dark:border-[#3C332C]">
            <h3 className="font-serif text-xl mb-4 text-[#2D3330] dark:text-[#E8E6DD] flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Local Gatherings
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {localGatherings.map((gathering) => (
                <Card
                  key={gathering.id}
                  className="p-4 bg-white/50 dark:bg-[#2F2823]/50 border border-[#E8E6DD] dark:border-[#3C332C]"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-[#7A9278] mb-1">
                    {gathering.location}
                  </div>
                  <h4 className="font-medium text-[#2D3330] dark:text-[#E8E6DD]">
                    {gathering.title}
                  </h4>
                  <p className="text-sm text-[#6B6760] dark:text-[#C9C2B8] mt-1">
                    {gathering.when}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-[#6B6760]">
                      {gathering.spotsRemaining} spots left
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#1C4D3A] hover:text-[#1C4D3A] hover:bg-[#EEF1EA]"
                    >
                      RSVP
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-xs text-center mt-4 text-[#6B6760] dark:text-[#C9C2B8]">
              <Info className="h-3 w-3 inline mr-1" />
              {locationConsentCopy.prompt} {locationConsentCopy.clearAction} · {locationConsentCopy.fallback}
            </p>
          </div>

          <div className="pt-8 border-t border-[#E8E6DD] dark:border-[#3C332C]">
            <h3 className="font-serif text-xl mb-4 text-[#2D3330] dark:text-[#E8E6DD] flex items-center gap-2">
              External Resources
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {externalResources.map((resource) => (
                <Card
                  key={resource.id}
                  className="p-4 bg-white/50 dark:bg-[#2F2823]/50 border border-[#E8E6DD] dark:border-[#3C332C]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#7A9278] mb-1">
                      {resource.provider}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {resource.cost}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-[#2D3330] dark:text-[#E8E6DD]">{resource.title}</h4>
                  <p className="text-sm text-[#6B6760] dark:text-[#C9C2B8] mt-2">{resource.description}</p>
                  {resource.safetyNote && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-200">{resource.safetyNote}</p>
                  )}
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-[#1C4D3A] hover:text-[#1C4D3A] hover:bg-[#EEF1EA]"
                  >
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      Open external link
                    </a>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* JOURNAL TAB */}
        <TabsContent value="journal" className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-xl text-[#2D3330] dark:text-[#E8E6DD]">
              Your Reflections
            </h3>
            <Button
              onClick={() => setShowReflectionDialog(true)}
              className="bg-[#1C4D3A] text-white"
            >
              New Entry
            </Button>
          </div>
          <ReflectionJournal />
        </TabsContent>

        {/* ASSESSMENTS TAB */}
        <TabsContent value="assessments" className="space-y-6 animate-in fade-in duration-500">
          <div className="space-y-2">
            <h3 className="font-serif text-xl text-[#2D3330] dark:text-[#E8E6DD]">Assessments</h3>
            <p className="text-sm text-muted-foreground">
              Quick, non-diagnostic check-ins to spot trends. Results stay private to you.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment) => (
              <Card
                key={assessment.id}
                className="p-4 bg-white/70 dark:bg-[#2F2823]/70 border border-[#E8E6DD] dark:border-[#3C332C]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-[#2D3330] dark:text-[#E8E6DD]">{assessment.name}</h4>
                    <p className="text-xs text-[#6B6760] dark:text-[#C9C2B8]">{assessment.duration}</p>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    Private
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{assessment.resultScale}</p>
                <p className="mt-2 text-xs text-[#6B6760] dark:text-[#C9C2B8]">{assessment.disclaimer}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => toast.success(`Assessment started: ${assessment.name}`)}
                >
                  Start assessment
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* INTERVIEW PREP TAB */}
        <TabsContent value="interview-prep" className="space-y-6 animate-in fade-in duration-500">
          <InterviewPrepTab />
        </TabsContent>

        {/* INSIGHTS TAB */}
        <TabsContent value="insights" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {deltaData && (
                <WellBeingDeltaWidget
                  stressDelta={deltaData.stressDelta}
                  controlDelta={deltaData.controlDelta}
                  period={deltaData.period}
                  checkinsCount={deltaData.checkinsCount}
                  hasBaseline={deltaData.hasBaseline}
                />
              )}
              {userId && <WorkScheduleEditor userId={userId} />}
            </div>
            <div className="space-y-6">
              {trendData.length > 0 && <WellBeingTrendChart trend={trendData} />}
              {userId && <CheckInHistory userId={userId} />}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ReflectionDialog
        open={showReflectionDialog}
        onOpenChange={setShowReflectionDialog}
        onSuccess={() => toast.success('Reflection saved')}
      />
      <CheckInDialog
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        onSuccess={() => {
          fetchInsights();
          setMilestoneSuggestion(null);
        }}
        defaultMilestone={defaultMilestone}
      />
    </div>
  );
}

export default function ZenHubPage() {
  return (
    <MoodResponsiveContainer>
      <ZenHubContent />
    </MoodResponsiveContainer>
  );
}
