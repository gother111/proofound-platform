"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  HelpCircle,
  Settings,
  Pin,
  BarChart3,
  Moon,
  Sun,
  Heart,
  Brain,
  Wind,
  Sparkles,
  Shield,
  AlertTriangle,
  ChevronRight,
  X
} from 'lucide-react';

type RiskLevel = 'normal' | 'elevated' | 'high';

// Evidence-based wellbeing practices
const PRACTICES = [
  {
    id: '1',
    title: 'Box Breathing',
    duration: '2m',
    benefit: 'Calm & focus',
    evidenceType: 'meta-reviewed',
    category: 'breathing',
    icon: <Wind className="w-5 h-5" />,
    description: 'Four equal phases of breath. Reduces anxiety within minutes. Works anywhere.',
    steps: [
      'Breathe in for 4 counts',
      'Hold for 4 counts',
      'Breathe out for 4 counts',
      'Hold for 4 counts',
      'Repeat 4–6 times'
    ],
    evidencePoints: [
      'Meta-analysis shows significant reduction in state anxiety',
      'Activates parasympathetic nervous system within 90 seconds',
      'No adverse effects reported in clinical trials'
    ],
    goal: 'Stress',
    style: 'Secular',
    time: 2,
    color: '#7A9278'
  },
  {
    id: '2',
    title: 'MBSR Body Scan',
    duration: '10m',
    benefit: 'Release tension',
    evidenceType: 'rct-backed',
    category: 'mindfulness',
    icon: <Brain className="w-5 h-5" />,
    description: 'Gentle attention to each part of your body. May notice tension you didn\'t know was there.',
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes',
      'Bring attention to your feet',
      'Slowly move awareness up through your body',
      'Notice sensations without judgment'
    ],
    evidencePoints: [
      'MBSR programs show 30% reduction in chronic pain intensity',
      'Improves body awareness and reduces rumination',
      'Part of NICE-recommended mindfulness interventions'
    ],
    goal: 'Stress',
    style: 'Secular',
    time: 10,
    color: '#5C8B89'
  },
  {
    id: '3',
    title: '3-Minute Breathing Space',
    duration: '3m',
    benefit: 'Ground yourself',
    evidenceType: 'nice-recommended',
    category: 'mindfulness',
    icon: <Wind className="w-5 h-5" />,
    description: 'Quick reset when overwhelmed. Three simple steps.',
    steps: [
      'Notice: What\'s happening right now?',
      'Focus: Bring attention to your breath',
      'Expand: Widen awareness to your whole body'
    ],
    evidencePoints: [
      'MBCT reduces depression relapse by 43%',
      'NICE-recommended for recurrent depression prevention',
      'Accessible mini-practice from full 8-week course'
    ],
    goal: 'Stress',
    style: 'Secular',
    time: 3,
    color: '#7A9278'
  },
  {
    id: '4',
    title: 'Progressive Muscle Relaxation',
    duration: '15m',
    benefit: 'Physical relaxation',
    evidenceType: 'rct-backed',
    category: 'relaxation',
    icon: <Heart className="w-5 h-5" />,
    description: 'Tense and release muscle groups systematically.',
    steps: [
      'Find a comfortable position',
      'Start with your feet',
      'Tense muscles for 5 seconds',
      'Release and notice the difference',
      'Move progressively through body'
    ],
    evidencePoints: [
      'Effective for anxiety and sleep disorders',
      'Reduces physical tension markers',
      'Widely used in clinical settings'
    ],
    goal: 'Sleep',
    style: 'Secular',
    time: 15,
    color: '#C76B4A'
  },
  {
    id: '5',
    title: 'Gratitude Reflection',
    duration: '5m',
    benefit: 'Positive mindset',
    evidenceType: 'rct-backed',
    category: 'reflection',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Focus on what you\'re thankful for.',
    steps: [
      'Find a quiet moment',
      'Think of 3 things you\'re grateful for',
      'Reflect on why they matter',
      'Notice how you feel'
    ],
    evidencePoints: [
      'Increases happiness and life satisfaction',
      'Reduces depression symptoms',
      'Improves sleep quality'
    ],
    goal: 'Mood',
    style: 'Secular',
    time: 5,
    color: '#D4A574'
  },
];

const EVIDENCE_BADGES = {
  'meta-reviewed': { label: 'Meta-reviewed', color: '#7A9278' },
  'rct-backed': { label: 'RCT-backed', color: '#5C8B89' },
  'nice-recommended': { label: 'NICE-recommended', color: '#1C4D3A' },
  'initial': { label: 'Initial evidence', color: '#C76B4A' }
};

interface ZenHubProps {
  profile?: any;
}

export function ZenHub({ profile }: ZenHubProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('normal');
  const [selectedPractice, setSelectedPractice] = useState<typeof PRACTICES[0] | null>(null);
  const [pinnedPractices, setPinnedPractices] = useState<string[]>([]);
  const [skepticMode, setSkepticMode] = useState(true);
  const [lowSpoonsMode, setLowSpoonsMode] = useState(false);
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  // Filter practices
  const filteredPractices = PRACTICES.filter(practice => {
    if (lowSpoonsMode && practice.time > 5) return false;
    if (selectedGoal && practice.goal !== selectedGoal) return false;
    return true;
  });

  const pinnedPracticesList = PRACTICES.filter(p => pinnedPractices.includes(p.id));

  const handlePinToggle = (practiceId: string) => {
    setPinnedPractices(prev =>
      prev.includes(practiceId)
        ? prev.filter(id => id !== practiceId)
        : [...prev, practiceId]
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] relative">
      {/* Flowing Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="zen-gradient">
              <stop offset="0%" style={{ stopColor: '#7A9278', stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: '#5C8B89', stopOpacity: 0.05 }} />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#zen-gradient)" />
          <motion.circle
            cx="30%"
            cy="40%"
            r="200"
            fill="#7A9278"
            opacity="0.05"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-display font-semibold mb-2" style={{ color: '#2D3330' }}>
              Zen Hub
            </h1>
            <p className="text-lg" style={{ color: '#6B6760' }}>
              Evidence-based practices for mental wellbeing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrivacyPanel(true)}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Privacy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Risk Level Banner */}
        {riskLevel !== 'normal' && (
          <Card className="p-4 border-2" style={{ borderColor: riskLevel === 'high' ? '#B5695C' : '#D4A574', backgroundColor: riskLevel === 'high' ? '#B5695C10' : '#D4A57410' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: riskLevel === 'high' ? '#B5695C' : '#D4A574' }} />
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: '#2D3330' }}>
                  {riskLevel === 'high' ? 'Immediate Support Available' : 'Elevated Stress Detected'}
                </h3>
                <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
                  {riskLevel === 'high'
                    ? 'If you\'re in crisis, please reach out to a crisis helpline immediately.'
                    : 'You might benefit from additional support. Consider reaching out to a professional.'}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Crisis Helpline
                  </Button>
                  <Button size="sm" variant="outline">
                    Find Therapist
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Controls */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="skeptic-mode" className="font-semibold" style={{ color: '#2D3330' }}>
                  Skeptic Mode
                </Label>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Show only secular, evidence-based practices
                </p>
              </div>
              <Switch
                id="skeptic-mode"
                checked={skepticMode}
                onCheckedChange={setSkepticMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="low-spoons" className="font-semibold" style={{ color: '#2D3330' }}>
                  Low Energy Mode
                </Label>
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Show only quick, easy practices (≤5 min)
                </p>
              </div>
              <Switch
                id="low-spoons"
                checked={lowSpoonsMode}
                onCheckedChange={setLowSpoonsMode}
              />
            </div>
          </div>
        </Card>

        {/* Goal Filters */}
        <div className="flex flex-wrap gap-2">
          {['Stress', 'Sleep', 'Focus', 'Mood'].map((goal) => (
            <button
              key={goal}
              onClick={() => setSelectedGoal(selectedGoal === goal ? null : goal)}
              className="px-4 py-2 rounded-full text-sm transition-all"
              style={{
                backgroundColor: selectedGoal === goal ? '#7A9278' : '#E8E6DD',
                color: selectedGoal === goal ? '#FFFFFF' : '#2D3330'
              }}
            >
              {goal}
            </button>
          ))}
        </div>

        {/* Pinned Practices */}
        {pinnedPracticesList.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2" style={{ color: '#2D3330' }}>
              <Pin className="w-5 h-5" />
              Your Pinned Practices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pinnedPracticesList.map((practice) => (
                <Card
                  key={practice.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPractice(practice)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${practice.color}20`, color: practice.color }}
                    >
                      {practice.icon}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinToggle(practice.id);
                      }}
                    >
                      <Pin className="w-4 h-4" style={{ color: '#7A9278' }} />
                    </Button>
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: '#2D3330' }}>
                    {practice.title}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
                    {practice.benefit} • {practice.duration}
                  </p>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: EVIDENCE_BADGES[practice.evidenceType as keyof typeof EVIDENCE_BADGES].color,
                      color: EVIDENCE_BADGES[practice.evidenceType as keyof typeof EVIDENCE_BADGES].color
                    }}
                  >
                    {EVIDENCE_BADGES[practice.evidenceType as keyof typeof EVIDENCE_BADGES].label}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Practices */}
        <div className="space-y-4">
          <h2 className="text-xl font-display font-semibold" style={{ color: '#2D3330' }}>
            All Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPractices.map((practice) => (
              <Card
                key={practice.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPractice(practice)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${practice.color}20`, color: practice.color }}
                  >
                    {practice.icon}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinToggle(practice.id);
                    }}
                  >
                    <Pin className={`w-4 h-4 ${pinnedPractices.includes(practice.id) ? 'fill-current' : ''}`} style={{ color: pinnedPractices.includes(practice.id) ? '#7A9278' : '#6B6760' }} />
                  </Button>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: '#2D3330' }}>
                  {practice.title}
                </h3>
                <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
                  {practice.benefit} • {practice.duration}
                </p>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: EVIDENCE_BADGES[practice.evidenceType as keyof typeof EVIDENCE_BADGES].color,
                      color: EVIDENCE_BADGES[practice.evidenceType as keyof typeof EVIDENCE_BADGES].color
                    }}
                  >
                    {EVIDENCE_BADGES[practice.evidenceType as keyof typeof EVIDENCE_BADGES].label}
                  </Badge>
                  <ChevronRight className="w-4 h-4" style={{ color: '#6B6760' }} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Practice Detail Modal */}
      <AnimatePresence>
        {selectedPractice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPractice(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedPractice.color}20`, color: selectedPractice.color }}
                  >
                    {selectedPractice.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                      {selectedPractice.title}
                    </h2>
                    <p className="text-sm" style={{ color: '#6B6760' }}>
                      {selectedPractice.duration} • {selectedPractice.benefit}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPractice(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: '#2D3330' }}>
                    What to Expect
                  </h3>
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    {selectedPractice.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3" style={{ color: '#2D3330' }}>
                    Steps
                  </h3>
                  <ol className="space-y-2">
                    {selectedPractice.steps.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span 
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: `${selectedPractice.color}20`, color: selectedPractice.color }}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm" style={{ color: '#2D3330' }}>
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2D3330' }}>
                    <BarChart3 className="w-4 h-4" />
                    Evidence Base
                  </h3>
                  <ul className="space-y-2">
                    {selectedPractice.evidencePoints.map((point, index) => (
                      <li key={index} className="flex gap-2 text-sm" style={{ color: '#6B6760' }}>
                        <span>•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full" style={{ backgroundColor: selectedPractice.color }}>
                  Begin Practice
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Panel */}
      <AnimatePresence>
        {showPrivacyPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivacyPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#7A9278]/10 flex items-center justify-center">
                    <Shield className="w-6 h-6" style={{ color: '#7A9278' }} />
                  </div>
                  <h2 className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                    Privacy First
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPrivacyPanel(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  Zen Hub is designed with your privacy as the top priority:
                </p>
                
                <ul className="space-y-3">
                  {[
                    'No wellbeing data is stored on servers',
                    'All preferences stay on your device',
                    'No tracking of practice sessions',
                    'No sharing of mental health information',
                    'Optional local export for your records'
                  ].map((item, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#7A9278' }} />
                      <span style={{ color: '#2D3330' }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 mt-4 border-t" style={{ borderColor: '#E8E6DD' }}>
                  <p className="text-xs" style={{ color: '#6B6760' }}>
                    Your mental wellbeing journey is yours alone. We believe privacy is essential for authentic healing.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

