import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  individualProfiles,
  impactStories,
  experiences,
  education,
  volunteering,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileView } from '@/components/profile/ProfileView';

// Sample data for now - will be replaced with real data from DB
const sampleData = {
  profile: {
    displayName: 'Sarah Chen',
    location: 'San Francisco, CA',
    joinedDate: 'March 2024',
    avatarUrl: null,
    tagline: 'Building bridges between technology, sustainability, and community empowerment',
    verified: true,
    mission:
      'To create accessible pathways for underrepresented communities to participate in the green economy, ensuring climate solutions are equitable and inclusive.',
    values: [
      { icon: 'Heart', label: 'Equity & Justice', verified: true },
      { icon: 'Sparkles', label: 'Innovation for Good', verified: true },
      { icon: 'Users', label: 'Community-First', verified: true },
    ],
    causes: ['Climate Justice', 'Economic Equity', 'Education Access'],
    skills: ['Strategic Planning', 'Community Engagement', 'Impact Measurement'],
  },
  impactStories: [
    {
      id: '1',
      title: 'Green Skills Training Program',
      orgDescription: 'Mid-size nonprofit, Climate & Energy sector, Bay Area',
      impact:
        'Led development and delivery of renewable energy career training for 200+ individuals from underserved communities, creating pathways to living-wage jobs in the green economy.',
      businessValue:
        'Addressed critical workforce gap in clean energy sector while creating economic opportunity for marginalized communities. Program model now adopted by 3 other regions.',
      outcomes:
        '85% job placement rate, 12 communities served, $4.5M in cumulative wages earned by graduates',
      timeline: '2023 - Present',
      verified: true,
    },
  ],
  experiences: [
    {
      id: '1',
      title: 'Leading systemic change initiatives',
      orgDescription: 'National nonprofit, Climate Justice, 50-200 employees',
      duration: '2023 - Present',
      learning:
        'Deepening my understanding of policy advocacy and coalition building. Learning how to navigate complex stakeholder landscapes and build consensus across diverse groups.',
      growth:
        'Transitioned from program execution to strategic leadership. Now shaping organizational direction and building high-performing teams.',
      verified: true,
    },
  ],
  education: [
    {
      id: '1',
      institution: 'University',
      degree: "Master's in Public Policy",
      duration: '2017 - 2019',
      skills: 'Policy analysis, stakeholder mapping, impact evaluation, systems thinking',
      projects:
        'Thesis: "Equitable Pathways to Clean Energy Access" - Research adopted by state energy commission. Led student coalition for campus sustainability.',
      verified: true,
    },
  ],
  volunteering: [
    {
      id: '1',
      title: 'Board governance and strategic direction',
      orgDescription: 'Youth-led climate organization, National reach',
      duration: '2022 - Present',
      cause: 'Climate Justice - Amplifying youth voices in climate policy',
      impact:
        'Helped secure $500K in funding, expanded to 12 new cities, mentored 30+ young organizers',
      skillsDeployed: 'Strategic planning, fundraising, mentorship, governance',
      personalWhy:
        'Climate action must center the voices of those who will inherit our decisions. Supporting youth leadership is essential.',
      verified: true,
    },
  ],
};

export default async function IndividualProfilePage() {
  const user = await requireAuth();

  // TODO: Fetch real data from database once migration is applied
  // const [profile] = await db
  //   .select()
  //   .from(individualProfiles)
  //   .where(eq(individualProfiles.userId, user.id))
  //   .limit(1);

  // For now, use sample data
  return <ProfileView data={sampleData} />;
}
