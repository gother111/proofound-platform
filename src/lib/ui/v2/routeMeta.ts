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
  if (path.includes('/communications'))
    return {
      title: 'Communications',
      description: 'Process messages, reveals, interviews, decisions, and feedback',
      icon: MessageSquare,
    };
  if (path.includes('/matching'))
    return {
      title: 'Assignment Review',
      description: 'Review proof-aligned assignment introductions',
      icon: Users,
    };
  if (path.includes('/interviews'))
    return { title: 'Interviews', description: 'Interview and feedback status', icon: Calendar };
  if (path.includes('/messages'))
    return { title: 'Messages', description: 'Your conversations', icon: MessageSquare };
  if (path.includes('/notifications'))
    return { title: 'Notifications', description: 'Recent alerts and updates', icon: Bell };
  if (path.includes('/opportunities'))
    return {
      title: 'Launch note',
      description: 'Assignment discovery stays inside the assignment-review flow for the MVP',
      icon: Briefcase,
    };
  if (path.includes('/app/o/') && path.includes('/profile'))
    return {
      title: 'Organization Trust Page',
      description: 'Launch-safe organization context and trust basics',
      icon: User,
    };
  if (path.includes('/profile'))
    return { title: 'Profile', description: 'Public-safe proof context', icon: User };
  if (path.includes('/settings'))
    return {
      title: 'Settings',
      description: 'Account, privacy, and workflow preferences',
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
      description: 'Project libraries remain outside the MVP flow',
      icon: Briefcase,
    };
  if (path.includes('/app/o/') && path.includes('/portfolio'))
    return {
      title: 'Public Preview',
      description: 'Preview the public organization trust page',
      icon: Briefcase,
    };
  if (path.includes('/portfolio'))
    return { title: 'Portfolio', description: 'Proof-backed work context', icon: Briefcase };
  if (path.includes('/assignments'))
    return {
      title: 'Assignments',
      description: 'Manage proof-review assignments',
      icon: Briefcase,
    };
  if (path.includes('/shortlist'))
    return {
      title: 'Shortlist',
      description: 'Saved proof submissions for review',
      icon: Users,
    };
  if (path.includes('/candidates'))
    return { title: 'Submissions', description: 'Assignment review tracking', icon: Users };
  if (path.includes('/members'))
    return { title: 'Members', description: 'Organization members', icon: Users };
  if (path.includes('/team')) return { title: 'Team', description: 'Team management', icon: Users };
  // Fallback
  return { title: 'Overview', description: 'Proof-first launch overview', icon: Home };
};
