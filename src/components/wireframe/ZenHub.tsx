'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { HelpCircle, Settings, Pin, BarChart3, MapPin, Moon, Sun } from 'lucide-react';
import { FilterChip } from './zen-hub/FilterChip';
import { PracticeTileCard } from './zen-hub/PracticeTileCard';
import { ToggleControl } from './zen-hub/ToggleControl';
import { RiskBanner } from './zen-hub/RiskBanner';
import { HighRiskOverlay } from './zen-hub/HighRiskOverlay';
import { PracticeDetailSheet } from './zen-hub/PracticeDetailSheet';
import { HelpPanel } from './zen-hub/HelpPanel';
import { SafetyPlanWizard } from './zen-hub/SafetyPlanWizard';
import { PrivacyConsole } from './zen-hub/PrivacyConsole';

type EvidenceType = 'rct-backed' | 'nice-recommended' | 'meta-reviewed' | 'initial' | 'third-party';
type RiskLevel = 'normal' | 'elevated' | 'high';
type ViewMode = 'desktop' | 'mobile';
type Goal = 'Stress' | 'Sleep' | 'Focus';
type Style = 'Secular' | 'Spiritual';
type TimeFilter = 2 | 5 | 10 | '20+';
type TabView = 'home' | 'toolkit' | 'local' | 'privacy';

interface Practice {
  id: string;
  title: string;
  duration: string;
  benefit: string;
  promise: string;
  evidenceType: EvidenceType;
  whatToExpect: string;
  steps: string[];
  evidencePoints: string[];
  adverseNote?: string;
  isThirdParty: boolean;
  goal: Goal;
  style: Style;
  time: number;
  isSpiritual: boolean;
}

const mockPractices: Practice[] = [
  {
    id: '1',
    title: 'Box Breathing',
    duration: '2m',
    benefit: 'Calm & focus',
    promise: 'Four equal phases of breath to steady your nervous system anywhere.',
    evidenceType: 'meta-reviewed',
    whatToExpect: 'Four equal phases of breath. Reduces anxiety within minutes. Works anywhere.',
    steps: [
      'Breathe in for 4 counts',
      'Hold for 4 counts',
      'Breathe out for 4 counts',
      'Hold for 4 counts',
      'Repeat 4–6 times',
    ],
    evidencePoints: [
      'Meta-analysis of 15 RCTs shows significant reduction in state anxiety (d = 0.39)',
      'Activates parasympathetic nervous system within 90 seconds',
      'No adverse effects reported in clinical trials',
    ],
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 2,
    isSpiritual: false,
  },
  {
    id: '2',
    title: 'MBSR Body Scan',
    duration: '10m',
    benefit: 'Release tension',
    promise: 'Gentle attention to each part of your body to release hidden tension.',
    evidenceType: 'rct-backed',
    whatToExpect:
      "Gentle attention to each part of your body. May notice tension you didn't know was there.",
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes',
      'Bring attention to your feet',
      'Slowly move awareness up through your body',
      'Notice sensations without judgment',
      'End with full-body awareness',
    ],
    evidencePoints: [
      'MBSR programs show 30% reduction in chronic pain intensity (Kabat-Zinn, 1982)',
      'Improves body awareness and reduces rumination',
      'Part of NICE-recommended mindfulness interventions',
    ],
    adverseNote:
      'Some people experience increased awareness of discomfort initially. If distressing, stop and try shorter practice.',
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 10,
    isSpiritual: false,
  },
  {
    id: '3',
    title: 'MBCT 3-Minute Breathing Space',
    duration: '3m',
    benefit: 'Ground yourself',
    promise: 'Quick reset when overwhelmed — notice, focus, expand.',
    evidenceType: 'nice-recommended',
    whatToExpect: 'Quick reset when overwhelmed. Three simple steps.',
    steps: [
      "Notice: What's happening right now?",
      'Focus: Bring attention to your breath',
      'Expand: Widen awareness to your whole body',
    ],
    evidencePoints: [
      'MBCT reduces depression relapse by 43% (Teasdale et al., 2000)',
      'NICE-recommended for recurrent depression prevention',
      'Accessible mini-practice from full 8-week course',
    ],
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 3,
    isSpiritual: false,
  },
  {
    id: '4',
    title: 'Isha Kriya',
    duration: '12m',
    benefit: 'Inner peace',
    promise: 'Guided meditation with mantra rooted in yogic tradition.',
    evidenceType: 'initial',
    whatToExpect: 'Guided meditation with mantra. Rooted in yogic tradition.',
    steps: [
      'Sit with spine erect',
      'Follow breathing pattern',
      'Repeat "I am not the body, I am not even the mind"',
      'Rest in silence',
    ],
    evidencePoints: [
      'Pilot study (n=52) shows improved well-being scores',
      'Preliminary evidence for stress reduction',
      'Larger RCTs needed for definitive claims',
    ],
    isThirdParty: true,
    goal: 'Stress',
    style: 'Spiritual',
    time: 12,
    isSpiritual: true,
  },
  {
    id: '5',
    title: 'Miracle of Mindfulness',
    duration: '7m',
    benefit: 'Present moment awareness',
    promise: 'Buddhist-inspired practice for anchoring awareness in everyday moments.',
    evidenceType: 'initial',
    whatToExpect: 'Buddhist-inspired practice. Wash dishes mindfully, drink tea mindfully.',
    steps: [
      'Choose a simple activity',
      'Do it with full attention',
      'Notice when mind wanders',
      'Gently return to the activity',
    ],
    evidencePoints: [
      "Based on Thich Nhat Hanh's teachings",
      'Preliminary research on informal mindfulness practices',
      'Anecdotal reports of increased calm',
    ],
    isThirdParty: true,
    goal: 'Focus',
    style: 'Spiritual',
    time: 7,
    isSpiritual: true,
  },
  {
    id: '6',
    title: 'Local MBSR Course',
    duration: '8 weeks',
    benefit: 'Deep transformation',
    promise: 'Weekly 2.5-hour sessions plus daily home practice. Full evidence-based program.',
    evidenceType: 'rct-backed',
    whatToExpect: 'Weekly 2.5-hour sessions plus daily home practice. Full evidence-based program.',
    steps: [
      'Attend orientation session',
      'Commit to 8 weekly sessions',
      'Practice 45 min daily at home',
      'Attend all-day retreat (week 6)',
      'Complete final session',
    ],
    evidencePoints: [
      'Gold-standard mindfulness intervention with 40+ years of research',
      'Reduces anxiety, depression, chronic pain',
      'Effect sizes comparable to medication for some conditions',
    ],
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 999,
    isSpiritual: false,
  },
  {
    id: '7',
    title: 'Yoga Nidra for Sleep',
    duration: '15m',
    benefit: 'Rest deeply',
    promise: 'Guided relaxation to settle your nervous system before sleep.',
    evidenceType: 'meta-reviewed',
    whatToExpect:
      'Guided body scan with paced breathing to release muscle tension and invite rest.',
    steps: [
      'Dim the lights and lie down comfortably',
      'Follow four-count inhalations and six-count exhalations',
      'Move awareness slowly from toes to head',
      'Stay with the calm breath until you feel drowsy',
    ],
    evidencePoints: [
      'Meta-analyses show Yoga Nidra improves sleep onset and efficiency for adults with insomnia',
      'Reduces sympathetic arousal, lowering nighttime cortisol',
      'Audio-guided and accessible—no prior experience required',
    ],
    isThirdParty: false,
    goal: 'Sleep',
    style: 'Secular',
    time: 15,
    isSpiritual: false,
  },
];

const goalOptions: Goal[] = ['Stress', 'Sleep', 'Focus'];
const styleOptions: Style[] = ['Secular', 'Spiritual'];
const timeOptions: { label: string; value: TimeFilter }[] = [
  { label: '2 min', value: 2 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '20+ min', value: '20+' },
];
const evidenceOptions: { label: string; value: EvidenceType }[] = [
  { label: 'RCT-backed', value: 'rct-backed' },
  { label: 'NICE recommended', value: 'nice-recommended' },
  { label: 'Meta-reviewed', value: 'meta-reviewed' },
  { label: 'Initial evidence', value: 'initial' },
  { label: 'Third-party', value: 'third-party' },
];

export function ZenHub() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('normal');
  const [activeView, setActiveView] = useState<TabView>('home');
  const [darkMode, setDarkMode] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeFilter | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceType | null>(null);

  const [skepticMode, setSkepticMode] = useState(true);
  const [lowSpoonsMode, setLowSpoonsMode] = useState(false);

  const [pinnedPractices, setPinnedPractices] = useState<string[]>(['1', '2']);
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [safetyPlanOpen, setSafetyPlanOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  const filteredPractices = mockPractices.filter((practice) => {
    if (skepticMode && practice.isSpiritual) return false;
    if (selectedGoal && practice.goal !== selectedGoal) return false;
    if (selectedStyle && practice.style !== selectedStyle) return false;
    if (selectedEvidence && practice.evidenceType !== selectedEvidence) return false;

    if (selectedTime) {
      if (selectedTime === '20+' && practice.time < 20) return false;
      if (selectedTime !== '20+' && practice.time > selectedTime) return false;
    }

    return true;
  });

  const displayPractices =
    riskLevel === 'elevated'
      ? [...filteredPractices].sort((a, b) => a.time - b.time)
      : filteredPractices;

  const togglePin = (id: string) => {
    setPinnedPractices((prev) =>
      prev.includes(id) ? prev.filter((pinned) => pinned !== id) : [...prev, id]
    );
  };

  const handleStartPractice = (practice: Practice) => {
    if (riskLevel === 'high') return;
    setSelectedPractice(practice);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] dark:bg-[var(--color-background-dark)] transition-colors duration-300">
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <Button
          onClick={() => setDarkMode((prev) => !prev)}
          variant="outline"
          size="sm"
          className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-lg p-1 flex gap-1">
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              viewMode === 'desktop'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              viewMode === 'mobile'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="fixed top-4 left-4 z-40 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-lg p-3">
        <div className="text-xs text-[var(--color-text-secondary)] mb-2">Risk State (Demo)</div>
        <div className="flex gap-2">
          {(['normal', 'elevated', 'high'] as RiskLevel[]).map((level) => (
            <button
              type="button"
              key={level}
              onClick={() => setRiskLevel(level)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                riskLevel === level
                  ? level === 'high'
                    ? 'bg-rose-600 text-white'
                    : level === 'elevated'
                      ? 'bg-amber-600 text-white'
                      : 'bg-green-600 text-white'
                  : 'bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] text-[var(--color-text-secondary)]'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`${
          viewMode === 'mobile'
            ? 'max-w-[390px] mx-auto border-x border-[var(--color-border)]'
            : 'max-w-7xl mx-auto'
        } px-6 py-8`}
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="mb-2 text-[var(--color-text-primary)]">Zen Hub</h1>
            <p className="text-[var(--color-text-secondary)]">Quiet tools to steady the mind.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setHelpPanelOpen(true)} variant="outline" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {riskLevel === 'elevated' && (
          <RiskBanner level="elevated" onHelp={() => setHelpPanelOpen(true)} />
        )}

        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as TabView)}
          className="space-y-6"
        >
          <TabsList className="w-full justify-start border-b border-[var(--color-border)] bg-transparent rounded-none h-auto p-0">
            <TabsTrigger
              value="home"
              className="rounded-none border-b-2 data-[state=active]:border-[var(--color-primary)]"
            >
              <Pin className="w-4 h-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger
              value="toolkit"
              className="rounded-none border-b-2 data-[state=active]:border-[var(--color-primary)]"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Toolkit
            </TabsTrigger>
            <TabsTrigger
              value="local"
              className="rounded-none border-b-2 data-[state=active]:border-[var(--color-primary)]"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Local Classes
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="rounded-none border-b-2 data-[state=active]:border-[var(--color-primary)]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-2xl p-6">
                <h3 className="mb-2 text-[var(--color-text-primary)]">Today</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  How are you feeling?
                </p>
                <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white">
                  Quick check-in
                </Button>
              </div>

              <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-2xl p-6">
                <h3 className="mb-2 text-[var(--color-text-primary)]">This week</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl text-[var(--color-primary)]">4</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    practices completed
                  </span>
                </div>
                <div className="h-16 flex items-end gap-1">
                  {[40, 60, 30, 80, 50, 70, 90].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-[var(--color-primary)] bg-opacity-20 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-[var(--color-text-primary)]">Pinned practices</h3>
              {pinnedPractices.length === 0 ? (
                <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] border-dashed rounded-2xl p-8 text-center">
                  <Pin className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-3" />
                  <p className="text-[var(--color-text-secondary)]">
                    Pin tools you like to find them quickly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedPractices.map((id) => {
                    const practice = mockPractices.find((item) => item.id === id);
                    if (!practice) return null;
                    return (
                      <PracticeTileCard
                        key={practice.id}
                        {...practice}
                        isPinned
                        onStart={() => handleStartPractice(practice)}
                        onPin={() => togglePin(practice.id)}
                        onOpenDetail={() => setSelectedPractice(practice)}
                        showCaution={riskLevel === 'elevated' && practice.time > 10}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="toolkit" className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="mb-2 text-[var(--color-text-primary)]">Meditative Practices</h2>
                <p className="text-[var(--color-text-secondary)]">
                  Quiet tools to steady the mind. Short first, depth when you want it.
                </p>
                <button className="text-sm text-[var(--color-primary)] hover:underline mt-2">
                  How we vet content
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ToggleControl
                label="Keep it secular"
                description="Hide spiritual content"
                checked={skepticMode}
                onChange={setSkepticMode}
              />
              <ToggleControl
                label="Make everything lighter"
                description="Bigger taps, fewer choices, audio on"
                checked={lowSpoonsMode}
                onChange={setLowSpoonsMode}
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">Goal</div>
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => (
                    <FilterChip
                      key={goal}
                      label={goal}
                      active={selectedGoal === goal}
                      onClick={() => setSelectedGoal(selectedGoal === goal ? null : goal)}
                      onRemove={() => setSelectedGoal(null)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">Time</div>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map((option) => (
                    <FilterChip
                      key={option.label}
                      label={option.label}
                      active={selectedTime === option.value}
                      onClick={() =>
                        setSelectedTime(selectedTime === option.value ? null : option.value)
                      }
                      onRemove={() => setSelectedTime(null)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">Style</div>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map((style) => (
                    <FilterChip
                      key={style}
                      label={style}
                      active={selectedStyle === style}
                      onClick={() => setSelectedStyle(selectedStyle === style ? null : style)}
                      onRemove={() => setSelectedStyle(null)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">Evidence</div>
                <div className="flex flex-wrap gap-2">
                  {evidenceOptions.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      active={selectedEvidence === option.value}
                      onClick={() =>
                        setSelectedEvidence(selectedEvidence === option.value ? null : option.value)
                      }
                      onRemove={() => setSelectedEvidence(null)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-2xl p-6 animate-pulse"
                  >
                    <div className="h-6 bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] rounded mb-3" />
                    <div className="h-4 bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] rounded w-2/3 mb-4" />
                    <div className="h-10 bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] rounded" />
                  </div>
                ))}
              </div>
            ) : showEmpty || displayPractices.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] border-dashed rounded-2xl p-12">
                  <h3 className="mb-4 text-[var(--color-text-primary)]">Starter Pack</h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Try these simple practices to get started.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {mockPractices.slice(0, 3).map((practice) => (
                      <PracticeTileCard
                        key={practice.id}
                        {...practice}
                        isPinned={pinnedPractices.includes(practice.id)}
                        onStart={() => handleStartPractice(practice)}
                        onPin={() => togglePin(practice.id)}
                        onOpenDetail={() => setSelectedPractice(practice)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayPractices.map((practice) => (
                  <PracticeTileCard
                    key={practice.id}
                    {...practice}
                    isPinned={pinnedPractices.includes(practice.id)}
                    onStart={() => handleStartPractice(practice)}
                    onPin={() => togglePin(practice.id)}
                    onOpenDetail={() => setSelectedPractice(practice)}
                    showCaution={riskLevel === 'elevated' && practice.time > 10}
                  />
                ))}
              </div>
            )}

            {skepticMode && mockPractices.some((practice) => practice.isSpiritual) && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setSkepticMode(false)}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  Show all practices (including spiritual)
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="local" className="space-y-6">
            <div>
              <h2 className="mb-2 text-[var(--color-text-primary)]">Courses & Local Classes</h2>
              <p className="text-[var(--color-text-secondary)]">
                In-person and online programs near you.
              </p>
            </div>

            <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-2xl p-6">
              <div className="aspect-video bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] rounded-xl mb-4 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-[var(--color-text-tertiary)]" />
              </div>
              <p className="text-center text-[var(--color-text-secondary)]">
                Map view showing local MBSR courses, meditation centers, and certified instructors
                would appear here.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyConsole />
          </TabsContent>
        </Tabs>
      </div>

      {riskLevel === 'high' && (
        <HighRiskOverlay
          onOpenSafetyPlan={() => {
            setRiskLevel('normal');
            setSafetyPlanOpen(true);
          }}
          onGetSupport={() => setHelpPanelOpen(true)}
          onClose={() => setRiskLevel('elevated')}
        />
      )}

      {selectedPractice && (
        <PracticeDetailSheet
          open
          onClose={() => setSelectedPractice(null)}
          practice={selectedPractice}
          onStart={() => {
            alert(`Starting: ${selectedPractice.title}`);
            setSelectedPractice(null);
          }}
          onSchedule={() => {
            alert(`Scheduled: ${selectedPractice.title}`);
          }}
          onPin={() => togglePin(selectedPractice.id)}
        />
      )}

      <HelpPanel
        open={helpPanelOpen}
        onClose={() => setHelpPanelOpen(false)}
        onOpenSafetyPlan={() => {
          setHelpPanelOpen(false);
          setSafetyPlanOpen(true);
        }}
      />

      <SafetyPlanWizard open={safetyPlanOpen} onClose={() => setSafetyPlanOpen(false)} />

      <div className="fixed bottom-4 left-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-lg p-3 text-xs space-y-2 max-w-xs">
        <div className="text-[var(--color-text-secondary)] mb-2">Demo Controls</div>
        <button
          type="button"
          onClick={() => setIsLoading((prev) => !prev)}
          className="w-full px-3 py-1 bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] rounded text-[var(--color-text-primary)] hover:bg-opacity-80"
        >
          Toggle Loading State
        </button>
        <button
          type="button"
          onClick={() => setShowEmpty((prev) => !prev)}
          className="w-full px-3 py-1 bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] rounded text-[var(--color-text-primary)] hover:bg-opacity-80"
        >
          Toggle Empty State
        </button>
        <button
          type="button"
          onClick={() => setPinnedPractices([])}
          className="w-full px-3 py-1 bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] rounded text-[var(--color-text-primary)] hover:bg-opacity-80"
        >
          Clear Pinned
        </button>
      </div>
    </div>
  );
}
