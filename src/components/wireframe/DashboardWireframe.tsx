'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  GripVertical,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import proofoundLogo from '/wireframe-assets/proofound-logo.png';

const personas = ['individual', 'organization'] as const;
type Persona = (typeof personas)[number];

type DashboardState = 'empty' | 'filled';

type Goal = {
  title: string;
  due: string;
  progress: number;
  status: 'active' | 'done';
  meta?: string;
};
type TaskStatus = 'attention' | 'progress' | 'done';

type Task = { title: string; status: TaskStatus };

type Project = { title: string; role: string; progress: number };

type Match = { title: string; subtitle: string };

const INDIVIDUAL_GOALS: Goal[] = [
  { title: 'Ship portfolio case study v1', due: 'Nov 30', progress: 60, status: 'active' },
  { title: 'Complete identity verification', due: 'Today', progress: 100, status: 'done' },
  {
    title: 'Apply to 2 mission-aligned projects',
    due: 'Nov 15',
    progress: 50,
    status: 'active',
    meta: '1/2',
  },
];

const ORG_GOALS: Goal[] = [
  {
    title: 'Recruit 3 volunteers for Community Garden Day',
    due: 'Nov 20',
    progress: 67,
    status: 'active',
    meta: '2/3',
  },
  { title: 'Publish impact report draft', due: 'Nov 25', progress: 40, status: 'active' },
  { title: 'Complete org KYC', due: 'Completed', progress: 100, status: 'done' },
];

const INDIVIDUAL_TASKS: Task[] = [
  { title: 'Add two references', status: 'attention' },
  { title: 'Identity verification pending', status: 'progress' },
  { title: 'Email verified', status: 'done' },
];

const ORG_TASKS: Task[] = [
  { title: 'Upload board resolution', status: 'attention' },
  { title: 'Beneficial owners check', status: 'progress' },
  { title: 'Tax status confirmed', status: 'done' },
];

const INDIVIDUAL_PROJECTS: Project[] = [
  { title: 'Civic Data Clean-up', role: 'Contributor', progress: 65 },
  { title: 'ESG Dashboard', role: 'Volunteer', progress: 40 },
];

const ORG_PROJECTS: Project[] = [
  { title: 'Community Garden Day', role: 'Event', progress: 80 },
  { title: 'Mentor Circle Q4', role: 'Program', progress: 55 },
];

const INDIVIDUAL_MATCHES: Match[] = [
  { title: 'Civic Data Clean-up', subtitle: 'Skills match: Data viz' },
  { title: 'Green Streets', subtitle: 'Cause: Urban sustainability' },
  { title: 'Repair Café', subtitle: 'Local • Facilitation' },
];

const ORG_MATCHES: Match[] = [
  { title: 'Alex', subtitle: 'Data Viz • 5 hrs/wk' },
  { title: 'Maya', subtitle: 'Event Ops • Weekends' },
  { title: 'Climate Action Network', subtitle: 'Partner org' },
];

const awayTitles = [
  'While you were away making impact',
  'While you were out doing real-world things',
  'Meanwhile, the internet was busy…',
];

export function DashboardWireframe({
  initialPersona = 'individual',
}: {
  initialPersona?: Persona;
}) {
  const [persona, setPersona] = useState<Persona>(initialPersona);
  const [state, setState] = useState<DashboardState>('filled');
  const [navCollapsed, setNavCollapsed] = useState(true);
  const [showUpdates, setShowUpdates] = useState(true);

  const goals = persona === 'individual' ? INDIVIDUAL_GOALS : ORG_GOALS;
  const tasks = persona === 'individual' ? INDIVIDUAL_TASKS : ORG_TASKS;
  const projects = persona === 'individual' ? INDIVIDUAL_PROJECTS : ORG_PROJECTS;
  const matches = persona === 'individual' ? INDIVIDUAL_MATCHES : ORG_MATCHES;
  const awayTitle = useMemo(() => awayTitles[Math.floor(Math.random() * awayTitles.length)], []);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F6F1] text-[#2D3330]">
      <DashboardHeader
        persona={persona}
        onPersonaChange={setPersona}
        state={state}
        onStateChange={setState}
      />
      <div className="flex flex-1 overflow-hidden">
        <DashboardNav collapsed={navCollapsed} onToggle={() => setNavCollapsed((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-6">
            {state === 'filled' && showUpdates && (
              <UpdatesCard
                awayTitle={awayTitle}
                persona={persona}
                onDismiss={() => setShowUpdates(false)}
              />
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <GoalsCard goals={goals} state={state} />
              <TasksCard tasks={tasks} state={state} />
              <ProjectsCard projects={projects} state={state} />
              <MatchesCard matches={matches} state={state} persona={persona} />
              {persona === 'organization' ? (
                <TeamCard state={state} />
              ) : (
                <ImpactCard state={state} />
              )}
              <ExploreCard state={state} persona={persona} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardHeader({
  persona,
  onPersonaChange,
  state,
  onStateChange,
}: {
  persona: Persona;
  onPersonaChange: (value: Persona) => void;
  state: DashboardState;
  onStateChange: (value: DashboardState) => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex flex-shrink-0 items-center justify-between border-b border-[#E8E6DD] bg-[#FDFCFA] px-4 py-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative h-7 w-7">
            <Image src={proofoundLogo} alt="Proofound" fill className="object-contain" />
          </div>
          <span className="text-sm font-semibold">Proofound</span>
        </div>
        <div className="h-6 w-px bg-[#E8E6DD]" />
        <h2 className="text-sm font-medium">Dashboard</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-[#E8E6DD] bg-white px-3 py-1.5 text-sm text-[#6B6760] md:flex">
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#E8E6DD] px-2.5 py-1 text-xs">
          <span>Empty</span>
          <button
            type="button"
            aria-pressed={state === 'filled'}
            onClick={() => onStateChange(state === 'filled' ? 'empty' : 'filled')}
            className={`h-5 w-10 rounded-full border border-white/60 bg-white transition ${state === 'filled' ? 'pl-5' : 'pl-1'} flex items-center`}
          >
            <span className="h-3.5 w-3.5 rounded-full bg-[#1C4D3A]" />
          </button>
          <span>Filled</span>
        </div>
        <Button variant="outline" size="sm" className="h-8 rounded-full border-[#E8E6DD] text-xs">
          Customize
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#1C4D3A] text-[#F7F6F1] text-xs">
            {persona === 'individual' ? 'AC' : 'GC'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function DashboardNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const items = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: User, label: 'Profile', active: false },
    { icon: FolderKanban, label: 'Projects', active: false },
    { icon: Users, label: 'Matching', active: false },
    { icon: Shield, label: 'Verifications', active: false },
    { icon: BadgeCheck, label: 'Compliance', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <aside
      className={`flex-shrink-0 border-r border-[#E8E6DD] bg-[#FDFCFA] transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-52'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-1 px-2 py-4">
          {items.map((item) => (
            <button
              key={item.label}
              className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                item.active ? 'bg-[#1C4D3A] text-white shadow-sm' : 'text-[#2D3330] hover:bg-white'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="border-t border-[#E8E6DD] p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-full rounded-full"
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function UpdatesCard({
  awayTitle,
  persona,
  onDismiss,
}: {
  awayTitle: string;
  persona: Persona;
  onDismiss: () => void;
}) {
  const items =
    persona === 'individual'
      ? [
          { text: 'Verification approved — Identity', action: 'View' },
          { text: "Partnership proposed by 'Green Streets'", action: 'Review' },
        ]
      : [
          { text: "Volunteer Anna matched to 'Community Garden Day'", action: 'Message' },
          { text: '2 new applications for Sustainability Coordinator', action: 'Review' },
        ];

  return (
    <Card className="border border-[#7A9278]/50 bg-[#7A9278]/10">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-[#2D3330]">{awayTitle}</h4>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div
                key={item.text}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs text-[#2D3330]"
              >
                <span>{item.text}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]"
                  >
                    {item.action}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-2 text-xs text-[#C76B4A]"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onDismiss}>
          <X className="h-4 w-4 text-[#2D3330]" />
        </Button>
      </div>
    </Card>
  );
}

function GoalsCard({ goals, state }: { goals: Goal[]; state: DashboardState }) {
  if (state === 'empty') {
    return (
      <Card className="border border-[#E8E6DD] bg-white/70 p-4 text-center">
        <Target className="mx-auto mb-2 h-10 w-10 text-[#E8E6DD]" />
        <p className="text-xs text-[#6B6760]">Set one meaningful goal for the week.</p>
        <Button size="sm" className="mt-3 h-7 rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]">
          <Plus className="mr-1 h-3 w-3" /> Create goal
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border border-[#E8E6DD] bg-white/80 p-4">
      <header className="mb-3 flex items-center justify-between text-sm text-[#2D3330]">
        <span className="font-medium">Goals</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
          <Plus className="h-3 w-3" />
        </Button>
      </header>
      <div className="space-y-3">
        {goals.map((goal, index) => (
          <div key={goal.title} className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-[#2D3330]">{goal.title}</span>
              {goal.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-[#1C4D3A]" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B6760]">
              <Clock className="h-3 w-3" /> <span>{goal.due}</span>
              {goal.meta && <span>• {goal.meta}</span>}
            </div>
            <Progress value={goal.progress} className="h-1" />
            {index < goals.length - 1 && <div className="h-px w-full bg-[#E8E6DD]" />}
          </div>
        ))}
      </div>
    </Card>
  );
}

function TasksCard({ tasks, state }: { tasks: Task[]; state: DashboardState }) {
  if (state === 'empty') {
    return (
      <Card className="border border-[#E8E6DD] bg-white/70 p-4 text-center">
        <Shield className="mx-auto mb-2 h-10 w-10 text-[#E8E6DD]" />
        <p className="text-xs text-[#6B6760]">Build trust through verification.</p>
        <Button size="sm" className="mt-3 h-7 rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]">
          Start
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border border-[#E8E6DD] bg-white/80 p-4">
      <header className="mb-3 text-sm font-medium text-[#2D3330]">Tasks</header>
      <div className="space-y-2">
        {tasks.slice(0, 2).map((task) => (
          <div
            key={task.title}
            className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs ${
              task.status === 'attention'
                ? 'bg-[#C76B4A]/10 text-[#2D3330]'
                : 'bg-[#F7F6F1] text-[#2D3330]'
            }`}
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="h-4 w-4 text-[#1C4D3A]" />
            ) : task.status === 'attention' ? (
              <AlertCircle className="h-4 w-4 text-[#C76B4A]" />
            ) : (
              <Clock className="h-4 w-4 text-[#6B6760]" />
            )}
            <span className="flex-1">{task.title}</span>
          </div>
        ))}
        <button className="flex items-center gap-1 text-xs text-[#C76B4A]">
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}

function ProjectsCard({ projects, state }: { projects: Project[]; state: DashboardState }) {
  if (state === 'empty') {
    return (
      <Card className="border border-[#E8E6DD] bg-white/70 p-4 text-center">
        <FolderKanban className="mx-auto mb-2 h-10 w-10 text-[#E8E6DD]" />
        <p className="text-xs text-[#6B6760]">No active projects yet.</p>
        <Button size="sm" className="mt-3 h-7 rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]">
          Explore
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border border-[#E8E6DD] bg-white/80 p-4">
      <header className="mb-3 text-sm font-medium text-[#2D3330]">Projects</header>
      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.title}
            className="rounded-xl border border-[#E8E6DD] bg-white px-3 py-3"
          >
            <h4 className="text-xs font-medium text-[#2D3330]">{project.title}</h4>
            <Badge variant="secondary" className="mt-1 h-5 rounded-full px-2 text-[10px]">
              {project.role}
            </Badge>
            <Progress value={project.progress} className="mt-2 h-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function MatchesCard({
  matches,
  state,
  persona,
}: {
  matches: Match[];
  state: DashboardState;
  persona: Persona;
}) {
  if (state === 'empty') {
    return (
      <Card className="lg:col-span-2 border border-[#E8E6DD] bg-white/70 p-4 text-center">
        <Sparkles className="mx-auto mb-2 h-10 w-10 text-[#E8E6DD]" />
        <p className="text-xs text-[#6B6760]">
          Turn on matching to discover aligned people and projects.
        </p>
        <Button size="sm" className="mt-3 h-7 rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]">
          Open preferences
        </Button>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 border border-[#E8E6DD] bg-white/80 p-4">
      <header className="mb-3 flex items-center justify-between text-sm font-medium text-[#2D3330]">
        <span>Matches</span>
        <button className="flex items-center gap-1 text-xs text-[#C76B4A]">
          See more <ArrowRight className="h-3 w-3" />
        </button>
      </header>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {matches.map((match) => (
          <div
            key={match.title}
            className="min-w-[180px] rounded-xl border border-[#E8E6DD] bg-white p-3"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#E8E6DD] text-xs text-[#2D3330]">
                {match.title
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-2 text-xs text-[#2D3330]">{match.title}</div>
            <div className="text-[11px] text-[#6B6760]">{match.subtitle}</div>
            <Button
              size="xs"
              className="mt-3 h-6 w-full rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]"
            >
              View
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TeamCard({ state }: { state: DashboardState }) {
  if (state === 'empty') {
    return (
      <Card className="border border-[#E8E6DD] bg-white/70 p-4 text-center">
        <Users className="mx-auto mb-2 h-10 w-10 text-[#E8E6DD]" />
        <p className="text-xs text-[#6B6760]">Build your team.</p>
        <Button size="sm" className="mt-3 h-7 rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]">
          Add members
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border border-[#E8E6DD] bg-white/80 p-4">
      <header className="mb-3 text-sm font-medium text-[#2D3330]">Team</header>
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4].map((idx) => (
          <Avatar key={idx} className="h-7 w-7">
            <AvatarFallback className="bg-[#E8E6DD] text-[10px] text-[#2D3330]">
              T{idx}
            </AvatarFallback>
          </Avatar>
        ))}
        <span className="ml-1 text-xs text-[#6B6760]">+3</span>
      </div>
      <div className="space-y-2 text-xs text-[#2D3330]">
        <div className="flex items-center justify-between">
          <span>Active</span>
          <span className="text-[#6B6760]">7</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Open roles</span>
          <span className="text-[#C76B4A]">2</span>
        </div>
      </div>
      <Button
        size="sm"
        className="mt-4 h-7 w-full rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]"
      >
        Post role
      </Button>
    </Card>
  );
}

function ImpactCard({ state }: { state: DashboardState }) {
  if (state === 'empty') {
    return (
      <Card className="border border-[#E8E6DD] bg-white/70 p-4 text-center">
        <TrendingUp className="mx-auto mb-2 h-10 w-10 text-[#E8E6DD]" />
        <p className="text-xs text-[#6B6760]">Track your impact as you grow.</p>
      </Card>
    );
  }

  return (
    <Card className="border border-[#E8E6DD] bg-white/80 p-4">
      <header className="mb-3 text-sm font-medium text-[#2D3330]">Impact</header>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-[#F7F6F1] p-3">
          <div className="text-2xl font-semibold text-[#1C4D3A]">2/3</div>
          <div className="text-xs text-[#6B6760]">Goals on track</div>
        </div>
        <div className="rounded-xl bg-[#F7F6F1] p-3">
          <div className="text-xl font-semibold text-[#C76B4A]">8</div>
          <div className="text-xs text-[#6B6760]">Matches</div>
        </div>
      </div>
    </Card>
  );
}

function ExploreCard({ state, persona }: { state: DashboardState; persona: Persona }) {
  if (state === 'empty') {
    return (
      <Card className="col-span-full border border-[#E8E6DD] bg-white/70 p-4 text-center">
        <Calendar className="mx-auto mb-2 h-10 w-10 text-[#E8E6DD]" />
        <p className="text-xs text-[#6B6760]">
          Discover opportunities aligned with your interests.
        </p>
        <Button size="sm" className="mt-3 h-7 rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]">
          Start exploring
        </Button>
      </Card>
    );
  }

  const tabs = ['People', 'Projects', 'Partners'];

  return (
    <Card className="col-span-full border border-[#E8E6DD] bg-white/80 p-4">
      <header className="mb-4 flex items-center justify-between text-sm font-medium text-[#2D3330]">
        <span>Explore</span>
      </header>
      <div className="mb-4 flex items-center gap-2 rounded-full bg-[#E8E6DD] p-1 text-xs">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`rounded-full px-3 py-1 transition ${index === 0 ? 'bg-white text-[#2D3330]' : 'text-[#2D3330]'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="rounded-2xl border border-[#E8E6DD] bg-white p-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#E8E6DD] text-xs text-[#2D3330]">OP</AvatarFallback>
              </Avatar>
              <div className="text-xs text-[#2D3330]">Opportunity {idx}</div>
            </div>
            <Button
              size="sm"
              className="mt-3 h-6 w-full rounded-full bg-[#1C4D3A] text-xs text-[#F7F6F1]"
            >
              View
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
