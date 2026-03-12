import {
  Home,
  User,
  Settings,
  Briefcase,
  Users,
  MessageSquare,
  Bell,
  CheckCircle,
  Calendar,
  LucideIcon,
} from 'lucide-react';

export interface RouteMeta {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const getRouteMeta = (pathname: string): RouteMeta => {
  const path = pathname || '';

  if (path.includes('/home'))
    return {
      title: 'Overview',
      description: 'Proof-first launch overview',
      icon: Home,
    };
  if (path.includes('/matching'))
    return { title: 'Matching', description: 'Browse aligned introductions', icon: Users };
  if (path.includes('/interviews'))
    return { title: 'Interviews', description: 'Interview and feedback status', icon: Calendar };
  if (path.includes('/messages'))
    return { title: 'Messages', description: 'Your conversations', icon: MessageSquare };
  if (path.includes('/notifications'))
    return { title: 'Notifications', description: 'Recent alerts and updates', icon: Bell };
  if (path.includes('/opportunities'))
    return {
      title: 'Launch note',
      description: 'Opportunity browsing stays inside matching for the MVP corridor',
      icon: Briefcase,
    };
  if (path.includes('/profile'))
    return { title: 'Profile', description: 'Your core identity', icon: User };
  if (path.includes('/settings'))
    return {
      title: 'Settings',
      description: 'Account and application preferences',
      icon: Settings,
    };
  if (path.includes('/verifications'))
    return {
      title: 'Verifications',
      description: 'Proof and trust status',
      icon: CheckCircle,
    };
  if (path.includes('/projects'))
    return {
      title: 'Launch note',
      description: 'Project libraries remain outside the MVP corridor',
      icon: Briefcase,
    };
  if (path.includes('/portfolio'))
    return { title: 'Portfolio', description: 'Your work showcase', icon: Briefcase };
  if (path.includes('/assignments'))
    return { title: 'Assignments', description: 'Manage tasks and roles', icon: Briefcase };
  if (path.includes('/shortlist'))
    return { title: 'Shortlist', description: 'Saved candidates and matches', icon: Users };
  if (path.includes('/candidates'))
    return { title: 'Candidates', description: 'Applicant tracking', icon: Users };
  if (path.includes('/members'))
    return { title: 'Members', description: 'Organization members', icon: Users };
  if (path.includes('/team')) return { title: 'Team', description: 'Team management', icon: Users };
  // Fallback
  return { title: 'Overview', description: 'Proof-first launch overview', icon: Home };
};
