'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  zenPractices,
  localGatherings,
  supportChannels,
  toolkitFilters,
  zenResources,
  type ZenPractice,
} from '@/data/zen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, MapPin, Heart, Info, Phone, Shield } from 'lucide-react';
import { PrivacyBanner } from '@/components/zen/PrivacyBanner';
import { CheckInDialog } from '@/components/zen/CheckInDialog';
import { ReflectionDialog } from '@/components/zen/ReflectionDialog';
import { MoodResponsiveContainer, useMood } from '@/components/zen/MoodResponsiveContainer';
import { QuickCheckIn } from '@/components/zen/QuickCheckIn';
import { GuidedBreathing } from '@/components/zen/GuidedBreathing';
import { ReflectionJournal } from '@/components/zen/ReflectionJournal';
import { PracticeCard } from '@/components/zen/PracticeCard';
import { InterviewPrepTab } from '@/components/zen/interview-prep/InterviewPrepTab';
import { WellBeingDeltaWidget } from '@/components/wellbeing/WellBeingDeltaWidget';
import { WellBeingTrendChart } from '@/components/wellbeing/WellBeingTrendChart';
import { CheckInHistory } from '@/components/wellbeing/CheckInHistory';
import { WorkScheduleEditor } from '@/components/wellbeing/WorkScheduleEditor';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

function ZenHubContent() {
  const { mood } = useMood();
  const miracleCardEnabled = process.env.NEXT_PUBLIC_FEATURE_ZEN_MIRACLE_OF_MIND !== 'false';
  const [optInStatus, setOptInStatus] = useState<{
    optedIn: boolean;
    privacyBannerAcknowledged: boolean;
  } | null>(null);
  const [isLoadingOptIn, setIsLoadingOptIn] = useState(true);
  const [activeTab, setActiveTab] = useState('checkin');
  const [activeFilter, setActiveFilter] = useState('All');

  // Dialog states
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);

  // Data states
  const [deltaData, setDeltaData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

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

  useEffect(() => {
    if (optInStatus?.optedIn) {
      // Fetch insights data
      const fetchData = async () => {
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
      };
      fetchData();
    }
  }, [optInStatus]);

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

          {miracleCardEnabled && zenResources.length > 0 && (
            <div className="pt-6 border-t border-[#E8E6DD] dark:border-[#3C332C] space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl text-[#2D3330] dark:text-[#E8E6DD]">
                  External Toolkit
                </h3>
                <Badge variant="outline" className="text-xs bg-[#F7F6F1] border-[#E8E6DD]">
                  External link
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {zenResources.map((resource) => (
                  <Card
                    key={resource.id}
                    className="flex flex-col justify-between gap-3 p-4 bg-white/70 dark:bg-[#2F2823]/70 border border-[#E8E6DD] dark:border-[#3C332C]"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {resource.duration && (
                          <Badge
                            variant="secondary"
                            className="bg-[#EEF1EA] text-[#1C4D3A] dark:bg-[#3F473B] dark:text-[#D8E8D0]"
                          >
                            {resource.duration}
                          </Badge>
                        )}
                        {resource.badges.map((badge) => (
                          <Badge
                            key={badge}
                            variant="outline"
                            className="border-[#E8E6DD] text-[#2D3330] dark:border-[#3C332C] dark:text-[#E8E6DD]"
                          >
                            {badge}
                          </Badge>
                        ))}
                      </div>
                      <h4 className="font-medium text-[#2D3330] dark:text-[#E8E6DD]">
                        {resource.title}
                      </h4>
                      <p className="text-sm text-[#6B6760] dark:text-[#C9C2B8] line-clamp-2">
                        {resource.summary}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-center text-[#1C4D3A] hover:text-white hover:bg-[#1C4D3A] dark:text-[#E8E6DD] dark:hover:text-[#1C4D3A] dark:hover:bg-[#CBE5CA]"
                      >
                        <a href={resource.url} target="_blank" rel="noreferrer">
                          Open {resource.title}
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                      {resource.privacyNote && (
                        <p className="text-xs text-[#6B6760] dark:text-[#C9C2B8]">
                          {resource.privacyNote}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

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
              Location features require opt-in. Currently showing examples.
            </p>
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
              <WorkScheduleEditor userId="" />
            </div>
            <div className="space-y-6">
              {trendData.length > 0 && <WellBeingTrendChart trend={trendData} />}
              <CheckInHistory userId="" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ReflectionDialog
        open={showReflectionDialog}
        onOpenChange={setShowReflectionDialog}
        onSuccess={() => toast.success('Reflection saved')}
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
