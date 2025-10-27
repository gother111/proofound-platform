# Profile Page Code Package - Copy to Another Platform

This document contains all the essential code you need to replicate the Proofound profile page design on another platform.

---

## 1. TypeScript Type Definitions

```typescript
// types/profile.ts

import { LucideIcon } from 'lucide-react';

export interface BasicInfo {
  name: string;
  tagline: string | null;
  location: string | null;
  joinedDate: string;
  avatar: string | null; // Base64 or URL
  coverImage: string | null; // Base64 or URL
}

export interface Value {
  id: string;
  icon: string; // Icon name from lucide-react
  label: string;
  verified: boolean;
}

export interface Skill {
  id: string;
  name: string;
  verified: boolean;
}

export interface ImpactStory {
  id: string;
  title: string;
  orgDescription: string;
  impact: string;
  businessValue: string;
  outcomes: string;
  timeline: string;
  verified: boolean | null;
}

export interface Experience {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  learning: string;
  growth: string;
  verified: boolean | null;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  duration: string;
  skills: string;
  projects: string;
  verified: boolean | null;
}

export interface Volunteering {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  cause: string;
  impact: string;
  skillsDeployed: string;
  personalWhy: string;
  verified: boolean | null;
}

export interface ProfileData {
  basicInfo: BasicInfo;
  mission: string | null;
  values: Value[];
  causes: string[];
  skills: Skill[];
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
}
```

---

## 2. Color Palette (CSS Variables)

```css
/* styles/profile-colors.css */

:root {
  /* Brand Colors */
  --brand-sage: #7a9278;
  --brand-sage-rgb: 122, 146, 120;

  --brand-terracotta: #c67b5c;
  --brand-terracotta-rgb: 198, 123, 92;

  --brand-teal: #5c8b89;
  --brand-teal-rgb: 92, 139, 137;

  --brand-ochre: #d4a574;
  --brand-ochre-rgb: 212, 165, 116;

  /* Base Colors */
  --bg-base: #f5f3ee;
  --card-bg: #fdfcfa;
  --text-primary: #2c2a27;
  --muted-bg: #e8e4dc;

  /* Opacity Variants */
  --sage-5: rgba(var(--brand-sage-rgb), 0.05);
  --sage-10: rgba(var(--brand-sage-rgb), 0.1);
  --sage-20: rgba(var(--brand-sage-rgb), 0.2);
  --sage-30: rgba(var(--brand-sage-rgb), 0.3);

  --terracotta-5: rgba(var(--brand-terracotta-rgb), 0.05);
  --terracotta-10: rgba(var(--brand-terracotta-rgb), 0.1);
  --terracotta-20: rgba(var(--brand-terracotta-rgb), 0.2);
  --terracotta-60: rgba(var(--brand-terracotta-rgb), 0.6);

  --teal-10: rgba(var(--brand-teal-rgb), 0.1);
  --teal-60: rgba(var(--brand-teal-rgb), 0.6);

  --ochre-10: rgba(var(--brand-ochre-rgb), 0.1);
  --ochre-30: rgba(var(--brand-ochre-rgb), 0.3);
}

/* Tailwind-compatible utility classes */
.bg-brand-sage { background-color: var(--brand-sage); }
.text-brand-sage { color: var(--brand-sage); }
.border-brand-sage { border-color: var(--brand-sage); }

.bg-brand-terracotta { background-color: var(--brand-terracotta); }
.text-brand-terracotta { color: var(--brand-terracotta); }

.bg-brand-teal { background-color: var(--brand-teal); }
.text-brand-teal { color: var(--brand-teal); }

.bg-brand-ochre { background-color: var(--brand-ochre); }
.text-brand-ochre { color: var(--brand-ochre); }
```

---

## 3. Mission Card Component

```tsx
// components/profile/MissionCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface MissionCardProps {
  mission: string | null;
}

export function MissionCard({ mission }: MissionCardProps) {
  if (!mission) return null;

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: 'rgb(122, 146, 120)' }} />
          Mission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{mission}</p>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Values Card Component

```tsx
// components/profile/ValuesCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Sparkles,
  Users,
  CheckCircle2,
  Eye,
  Target,
  Shield,
  Leaf,
  Lightbulb,
  HandHeart,
} from 'lucide-react';

interface Value {
  icon: string;
  label: string;
  verified: boolean;
}

interface ValuesCardProps {
  values: Value[] | null;
}

const iconMap: Record<string, any> = {
  Heart,
  Sparkles,
  Users,
  Eye,
  Target,
  Shield,
  Leaf,
  Lightbulb,
  HandHeart,
};

export function ValuesCard({ values }: ValuesCardProps) {
  if (!values || values.length === 0) return null;

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Core Values</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {values.map((value, index) => {
            const IconComponent = iconMap[value.icon] || Heart;
            return (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                <IconComponent
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: 'rgb(198, 123, 92)' }}
                />
                <span className="text-sm flex-1">{value.label}</span>
                {value.verified && (
                  <CheckCircle2
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'rgb(122, 146, 120)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5. Causes Card Component

```tsx
// components/profile/CausesCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface CausesCardProps {
  causes: string[] | null;
}

export function CausesCard({ causes }: CausesCardProps) {
  if (!causes || causes.length === 0) return null;

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: 'rgb(92, 139, 137)' }} />
          Causes I Support
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {causes.map((cause, index) => (
            <Badge
              key={index}
              variant="outline"
              className="rounded-full px-3 py-1"
              style={{
                backgroundColor: 'rgba(92, 139, 137, 0.1)',
                borderColor: 'rgba(92, 139, 137, 0.3)',
                color: 'rgb(92, 139, 137)',
              }}
            >
              {cause}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 6. Skills Card Component

```tsx
// components/profile/SkillsCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lightbulb } from 'lucide-react';

interface Skill {
  name: string;
  verified: boolean;
}

interface SkillsCardProps {
  skills: string[] | Skill[] | null;
}

export function SkillsCard({ skills }: SkillsCardProps) {
  if (!skills || skills.length === 0) return null;

  // Handle both string[] and Skill[] formats
  const skillsArray: Skill[] = skills.map((skill) =>
    typeof skill === 'string' ? { name: skill, verified: false } : skill
  );

  return (
    <Card className="border-2 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5" style={{ color: 'rgb(212, 165, 116)' }} />
          Skills & Expertise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skillsArray.map((skill, index) => (
            <Badge
              key={index}
              variant="outline"
              className="rounded-full px-3 py-1 flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(212, 165, 116, 0.1)',
                borderColor: 'rgba(212, 165, 116, 0.3)',
                color: 'rgb(212, 165, 116)',
              }}
            >
              {skill.name}
              {skill.verified && (
                <CheckCircle2 className="w-3 h-3" style={{ color: 'rgb(122, 146, 120)' }} />
              )}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 7. Impact Story Card Component

```tsx
// components/profile/ImpactStoryCard.tsx

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, X } from 'lucide-react';

interface ImpactStory {
  id: string;
  title: string;
  orgDescription: string;
  impact: string;
  businessValue: string;
  outcomes: string;
  timeline: string;
  verified: boolean | null;
}

interface ImpactStoryCardProps {
  story: ImpactStory;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function ImpactStoryCard({ story, onDelete, editable = false }: ImpactStoryCardProps) {
  return (
    <Card className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative">
      {editable && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm('Are you sure you want to delete this impact story?')) {
              onDelete(story.id);
            }
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <div className="flex items-start justify-between mb-4 pr-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xl font-display font-semibold">{story.title}</h3>
            {story.verified && (
              <Badge
                variant="outline"
                className="gap-1"
                style={{
                  backgroundColor: 'rgba(122, 146, 120, 0.1)',
                  borderColor: 'rgba(122, 146, 120, 0.3)',
                  color: 'rgb(122, 146, 120)',
                }}
              >
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{story.orgDescription}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {story.timeline}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Impact</h4>
          <p className="text-sm">{story.impact}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Business Value</h4>
          <p className="text-sm">{story.businessValue}</p>
        </div>

        <div className="p-4 bg-muted/20 rounded-xl">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Outcomes</h4>
          <p className="text-sm">{story.outcomes}</p>
        </div>
      </div>
    </Card>
  );
}
```

---

## 8. Experience Card Component

```tsx
// components/profile/ExperienceCard.tsx

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, CheckCircle2, Lightbulb, TrendingUp, X } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  learning: string;
  growth: string;
  verified: boolean | null;
}

interface ExperienceCardProps {
  experience: Experience;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function ExperienceCard({ experience, onDelete, editable = false }: ExperienceCardProps) {
  return (
    <Card className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative">
      {editable && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm('Are you sure you want to delete this experience?')) {
              onDelete(experience.id);
            }
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5" style={{ color: 'rgb(198, 123, 92)' }} />
        </div>
        <div className="flex-1 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-display font-semibold">{experience.title}</h4>
            {experience.verified && (
              <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(122, 146, 120)' }} />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{experience.orgDescription}</p>
          <p className="text-xs text-muted-foreground mb-4">{experience.duration}</p>

          <div className="space-y-3">
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                What I Learned
              </h5>
              <p className="text-sm">{experience.learning}</p>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                How I Grew
              </h5>
              <p className="text-sm">{experience.growth}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 9. Education Card Component

```tsx
// components/profile/EducationCard.tsx

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, CheckCircle2, X } from 'lucide-react';

interface Education {
  id: string;
  institution: string;
  degree: string;
  duration: string;
  skills: string;
  projects: string;
  verified: boolean | null;
}

interface EducationCardProps {
  education: Education;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function EducationCard({ education, onDelete, editable = false }: EducationCardProps) {
  return (
    <Card className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative">
      {editable && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm('Are you sure you want to delete this education?')) {
              onDelete(education.id);
            }
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5" style={{ color: 'rgb(92, 139, 137)' }} />
        </div>
        <div className="flex-1 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-display font-semibold">{education.degree}</h4>
            {education.verified && (
              <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(122, 146, 120)' }} />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{education.institution}</p>
          <p className="text-xs text-muted-foreground mb-4">{education.duration}</p>

          <div className="space-y-3">
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Skills Gained</h5>
              <p className="text-sm">{education.skills}</p>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">
                Meaningful Projects
              </h5>
              <p className="text-sm">{education.projects}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 10. Volunteer Card Component

```tsx
// components/profile/VolunteerCard.tsx

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandHeart, CheckCircle2, X } from 'lucide-react';

interface Volunteering {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  cause: string;
  impact: string;
  skillsDeployed: string;
  personalWhy: string;
  verified: boolean | null;
}

interface VolunteerCardProps {
  volunteer: Volunteering;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function VolunteerCard({ volunteer, onDelete, editable = false }: VolunteerCardProps) {
  return (
    <Card className="p-6 border-2 hover:border-[rgb(122,146,120)]/30 transition-colors group relative">
      {editable && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm('Are you sure you want to delete this volunteer work?')) {
              onDelete(volunteer.id);
            }
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0">
          <HandHeart className="w-5 h-5" style={{ color: 'rgb(198, 123, 92)' }} />
        </div>
        <div className="flex-1 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-display font-semibold">{volunteer.title}</h4>
            {volunteer.verified && (
              <CheckCircle2 className="w-4 h-4" style={{ color: 'rgb(122, 146, 120)' }} />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{volunteer.orgDescription}</p>
          <p className="text-xs text-muted-foreground mb-4">{volunteer.duration}</p>

          <div className="space-y-3">
            {/* Personal Connection - HIGHLIGHTED */}
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'rgba(198, 123, 92, 0.05)',
                borderColor: 'rgba(198, 123, 92, 0.2)',
              }}
            >
              <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <HandHeart className="w-3 h-3" style={{ color: 'rgb(198, 123, 92)' }} />
                Personal Connection
              </h5>
              <p className="text-sm mb-2 font-medium">{volunteer.cause}</p>
              <p className="text-xs text-muted-foreground italic">{volunteer.personalWhy}</p>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Impact Made</h5>
              <p className="text-sm">{volunteer.impact}</p>
            </div>
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Skills Deployed</h5>
              <p className="text-sm">{volunteer.skillsDeployed}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 11. Profile Header Component

```tsx
// components/profile/ProfileHeader.tsx

import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Edit3, User } from 'lucide-react';

interface BasicInfo {
  name: string;
  tagline: string | null;
  location: string | null;
  joinedDate: string;
  avatar: string | null;
  coverImage: string | null;
}

interface ProfileHeaderProps {
  basicInfo: BasicInfo;
  onEditProfile?: () => void;
  editable?: boolean;
}

export function ProfileHeader({ basicInfo, onEditProfile, editable = false }: ProfileHeaderProps) {
  return (
    <>
      {/* Cover Image */}
      <div
        className="h-48 w-full bg-gradient-to-br from-[rgb(122,146,120)] via-[rgb(92,139,137)] to-[rgb(212,165,116)]"
        style={{
          backgroundImage: basicInfo.coverImage
            ? `url(${basicInfo.coverImage})`
            : 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Profile Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-8">
          <Card className="p-6 border-2">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-card shadow-lg ring-2 ring-[rgba(122,146,120,0.2)] ring-offset-2">
                  <AvatarImage src={basicInfo.avatar || undefined} />
                  <AvatarFallback className="bg-[rgb(245,243,238)] text-2xl">
                    <User className="w-12 h-12" style={{ color: 'rgb(122, 146, 120)' }} />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-display font-semibold">{basicInfo.name}</h1>
                  {editable && onEditProfile && (
                    <Button variant="ghost" size="sm" onClick={onEditProfile} className="h-8">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  {basicInfo.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {basicInfo.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {basicInfo.joinedDate}
                  </span>
                </div>

                {basicInfo.tagline && (
                  <p className="text-base text-foreground mb-4 max-w-3xl">{basicInfo.tagline}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
```

---

## 12. Completion Banner Component

```tsx
// components/profile/CompletionBanner.tsx

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompletionBannerProps {
  completion: number;
  show?: boolean;
}

export function CompletionBanner({ completion, show = true }: CompletionBannerProps) {
  if (!show || completion >= 80) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <Card className="p-6 border-2 border-[#7A9278]/30 bg-gradient-to-br from-[#7A9278]/5 via-background to-[#5C8B89]/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#7A9278]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-[#7A9278]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Welcome to Proofound!</h3>
              <span className="text-sm text-muted-foreground">{completion}% complete</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your profile is a space to share your impact, values, and growth journey. Add
              meaningful context to help others understand who you are and what you care about.
            </p>
            <Progress value={completion} className="h-2 mb-4" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Compass className="w-3 h-3" />
              <span>Start by adding a photo, tagline, and your mission</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
```

---

## 13. Empty State Components

```tsx
// components/profile/EmptyStates.tsx

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, Briefcase, GraduationCap, HandHeart } from 'lucide-react';

export function EmptyImpactState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#7A9278]/10 to-[#5C8B89]/10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-20 h-20">
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="#7A9278"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d="M 50 30 L 50 70 M 30 50 L 70 50"
                stroke="#7A9278"
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Share Your Impact Stories</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Highlight the meaningful work you've done. Focus on the change created, lives
            touched, and value delivered—not just tasks completed.
          </p>
        </div>
        <Button
          className="rounded-full bg-[#7A9278] hover:bg-[#7A9278]/90"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Impact Story
        </Button>
        <div className="pt-4 text-xs text-muted-foreground">
          <p>💡 Tip: Include context about the organization, your role, and measurable outcomes</p>
        </div>
      </div>
    </Card>
  );
}

export function EmptyJourneyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C67B5C]/10 to-[#D4A574]/10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-20 h-20">
              <path
                d="M 20 70 Q 35 40, 50 50 T 80 30"
                fill="none"
                stroke="#C67B5C"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx="20" cy="70" r="5" fill="#C67B5C" />
              <circle cx="50" cy="50" r="5" fill="#D4A574" />
              <circle cx="80" cy="30" r="5" fill="#7A9278" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Map Your Journey</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Share your professional experiences. Focus on what you learned, how you grew, and
            the skills you developed along the way.
          </p>
        </div>
        <Button
          className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
        <div className="pt-4 text-xs text-muted-foreground">
          <p>💡 Tip: Emphasize personal growth over job titles and responsibilities</p>
        </div>
      </div>
    </Card>
  );
}

export function EmptyLearningState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5C8B89]/10 to-[#7A9278]/10 flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-[#5C8B89]/60" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Add Your Learning</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Share your educational background. Include skills gained and meaningful projects
            that shaped your path.
          </p>
        </div>
        <Button
          className="rounded-full bg-[#5C8B89] hover:bg-[#5C8B89]/90"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
        <div className="pt-4 text-xs text-muted-foreground">
          <p>💡 Tip: Include both formal degrees and significant informal learning experiences</p>
        </div>
      </div>
    </Card>
  );
}

export function EmptyServiceState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-12 border-2 border-dashed border-muted-foreground/20">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C67B5C]/10 to-[#7A9278]/10 flex items-center justify-center">
            <HandHeart className="w-16 h-16 text-[#C67B5C]/60" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Share Your Service</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Highlight your volunteer work and community involvement. Explain why these causes
            matter to you and what impact you've created.
          </p>
        </div>
        <Button
          className="rounded-full bg-[#C67B5C] hover:bg-[#C67B5C]/90"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Volunteer Work
        </Button>
        <div className="pt-4 text-xs text-muted-foreground">
          <p>💡 Tip: Connect your service to your values and explain your personal motivation</p>
        </div>
      </div>
    </Card>
  );
}
```

---

## 14. Network Tab Component

```tsx
// components/profile/NetworkTab.tsx

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, User, Briefcase, GraduationCap } from 'lucide-react';

interface NetworkStats {
  people: number;
  organizations: number;
  institutions: number;
}

interface NetworkTabProps {
  stats?: NetworkStats;
}

export function NetworkTab({ stats = { people: 0, organizations: 0, institutions: 0 } }: NetworkTabProps) {
  return (
    <Card className="p-8 border-2">
      <div className="text-center mb-8">
        <Network className="w-16 h-16 mx-auto mb-4 text-[#7A9278]" />
        <h3 className="text-2xl font-display font-semibold mb-2">Living Network</h3>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Your network is fluid and dynamic. Connections that no longer hold mutual value
          naturally dissolve, ensuring your network always reflects authentic, active
          relationships.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="text-center p-4 bg-muted/20 rounded-xl">
          <User className="w-6 h-6 mx-auto mb-2 text-[#7A9278]" />
          <p className="text-sm text-muted-foreground mb-1">People</p>
          <p className="text-2xl font-semibold">{stats.people}</p>
          <p className="text-xs text-muted-foreground mt-1">Active connections</p>
        </div>
        <div className="text-center p-4 bg-muted/20 rounded-xl">
          <Briefcase className="w-6 h-6 mx-auto mb-2 text-[#C67B5C]" />
          <p className="text-sm text-muted-foreground mb-1">Organizations</p>
          <p className="text-2xl font-semibold">{stats.organizations}</p>
          <p className="text-xs text-muted-foreground mt-1">Active connections</p>
        </div>
        <div className="text-center p-4 bg-muted/20 rounded-xl">
          <GraduationCap className="w-6 h-6 mx-auto mb-2 text-[#5C8B89]" />
          <p className="text-sm text-muted-foreground mb-1">Institutions</p>
          <p className="text-2xl font-semibold">{stats.institutions}</p>
          <p className="text-xs text-muted-foreground mt-1">Active connections</p>
        </div>
      </div>

      <div className="text-center">
        <Button
          className="rounded-full"
          style={{ backgroundColor: 'rgb(122, 146, 120)' }}
        >
          <Network className="w-4 h-4 mr-2" />
          Visualize Network Graph
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          See how your connections relate to each other and discover new collaboration
          opportunities
        </p>
      </div>
    </Card>
  );
}
```

---

## 15. Tab Navigation Component

```tsx
// components/profile/ProfileTabs.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Briefcase, GraduationCap, HandHeart, Network } from 'lucide-react';

interface ProfileTabsProps {
  children: React.ReactNode;
  defaultTab?: string;
}

export function ProfileTabs({ children, defaultTab = 'impact' }: ProfileTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="grid grid-cols-5 w-full rounded-full bg-muted/30 p-1">
        <TabsTrigger value="impact" className="rounded-full text-xs sm:text-sm">
          <Target className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Impact</span>
        </TabsTrigger>
        <TabsTrigger value="journey" className="rounded-full text-xs sm:text-sm">
          <Briefcase className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Journey</span>
        </TabsTrigger>
        <TabsTrigger value="learning" className="rounded-full text-xs sm:text-sm">
          <GraduationCap className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Learning</span>
        </TabsTrigger>
        <TabsTrigger value="service" className="rounded-full text-xs sm:text-sm">
          <HandHeart className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Service</span>
        </TabsTrigger>
        <TabsTrigger value="network" className="rounded-full text-xs sm:text-sm">
          <Network className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Network</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
```

---

## 16. Complete Profile Layout Example

```tsx
// components/profile/ProfileLayout.tsx

import { ProfileHeader } from './ProfileHeader';
import { CompletionBanner } from './CompletionBanner';
import { MissionCard } from './MissionCard';
import { ValuesCard } from './ValuesCard';
import { CausesCard } from './CausesCard';
import { SkillsCard } from './SkillsCard';
import { ProfileTabs } from './ProfileTabs';
import { TabsContent } from '@/components/ui/tabs';
import { ProfileData } from '@/types/profile';

interface ProfileLayoutProps {
  profile: ProfileData;
  completion: number;
  editable?: boolean;
}

export function ProfileLayout({ profile, completion, editable = false }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Completion Banner */}
      <CompletionBanner completion={completion} show={editable} />

      {/* Hero Section */}
      <div className="relative">
        <ProfileHeader
          basicInfo={profile.basicInfo}
          editable={editable}
        />

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Sidebar */}
            <div className="space-y-6">
              <MissionCard mission={profile.mission} />
              <ValuesCard values={profile.values} />
              <CausesCard causes={profile.causes} />
              <SkillsCard skills={profile.skills} />
            </div>

            {/* Main Content - Tabs */}
            <div className="lg:col-span-2">
              <ProfileTabs>
                <TabsContent value="impact">
                  {/* Impact Stories Content */}
                </TabsContent>
                <TabsContent value="journey">
                  {/* Journey/Experience Content */}
                </TabsContent>
                <TabsContent value="learning">
                  {/* Education Content */}
                </TabsContent>
                <TabsContent value="service">
                  {/* Volunteering Content */}
                </TabsContent>
                <TabsContent value="network">
                  {/* Network Content */}
                </TabsContent>
              </ProfileTabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 17. Dependencies Required

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.263.1",
    "framer-motion": "^10.0.0",
    "@radix-ui/react-avatar": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-progress": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@types/react": "^18.0.0"
  }
}
```

---

## 18. Tailwind Configuration

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-sage': '#7A9278',
        'brand-terracotta': '#C67B5C',
        'brand-teal': '#5C8B89',
        'brand-ochre': '#D4A574',
        'bg-base': '#F5F3EE',
        'card-bg': '#FDFCFA',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 19. Usage Example

```tsx
// app/profile/page.tsx

import { ProfileLayout } from '@/components/profile/ProfileLayout';

export default function ProfilePage() {
  const mockProfile = {
    basicInfo: {
      name: 'Jane Doe',
      tagline: 'Social entrepreneur focused on education equity',
      location: 'San Francisco, CA',
      joinedDate: 'January 2024',
      avatar: null,
      coverImage: null,
    },
    mission: 'Empowering underserved communities through education and technology',
    values: [
      { id: '1', icon: 'Heart', label: 'Compassion', verified: true },
      { id: '2', icon: 'Sparkles', label: 'Innovation', verified: false },
    ],
    causes: ['Education', 'Climate Action', 'Social Justice'],
    skills: [
      { id: '1', name: 'Project Management', verified: true },
      { id: '2', name: 'Strategic Planning', verified: false },
    ],
    impactStories: [],
    experiences: [],
    education: [],
    volunteering: [],
  };

  return <ProfileLayout profile={mockProfile} completion={45} editable={true} />;
}
```

---

## 20. Platform Adaptation Notes

### For Vue.js
- Replace React hooks with Vue Composition API
- Use `ref`, `reactive`, and `computed` instead of `useState`
- Replace JSX with Vue templates

### For Angular
- Convert functional components to Angular components
- Use Angular services for state management
- Replace props with `@Input()` decorators

### For Plain HTML/CSS
- Remove framework-specific code
- Use vanilla JavaScript for interactions
- Maintain the same CSS classes and styling

### For Other Frameworks
- The TypeScript interfaces remain the same
- The color palette and design tokens are framework-agnostic
- The component structure can be adapted to any component-based framework

---

## Summary

This code package provides:

1. **Type-safe data structures** for all profile content
2. **Reusable components** for every section of the profile
3. **Consistent styling** using the Proofound color palette
4. **Responsive design** that works on mobile, tablet, and desktop
5. **Accessibility features** built into all components
6. **Empty states** with engaging illustrations
7. **Complete layout** ready to customize

Copy any component and adapt it to your platform's framework and styling system. The color values and design specifications remain consistent across all implementations.
