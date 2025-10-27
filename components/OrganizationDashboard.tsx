"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Users, 
  Briefcase, 
  TrendingUp,
  Mail,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';

interface OrganizationDashboardProps {
  organization: any;
  assignments: any[];
  teamMembers: any[];
  matches: any[];
}

export function OrganizationDashboard({ 
  organization, 
  assignments, 
  teamMembers,
  matches 
}: OrganizationDashboardProps) {
  const router = useRouter();
  const [view, setView] = useState<'overview' | 'assignments' | 'team'>('overview');

  const activeAssignments = assignments.filter(a => a.status === 'published');
  const totalMatches = matches.length;
  const acceptedMatches = matches.filter(m => m.status === 'accepted').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <div className="border-b px-6 py-6" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-semibold" style={{ color: '#2D3330' }}>
                {organization.name}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#6B6760' }}>
                Organization Dashboard
              </p>
            </div>
            <Button
              onClick={() => router.push('/assignments/new')}
              style={{ backgroundColor: '#1C4D3A', color: 'white' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Assignment
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                  Active Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                  <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                    {activeAssignments.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                  Total Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" style={{ color: '#C76B4A' }} />
                  <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                    {totalMatches}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                  Accepted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: '#7A9278' }} />
                  <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                    {acceptedMatches}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: '#5C8B89' }} />
                  <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                    {teamMembers.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Active Assignments */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-display">Active Assignments</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/assignments/new')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {activeAssignments.length > 0 ? (
              <div className="space-y-4">
                {activeAssignments.slice(0, 5).map((assignment) => {
                  const assignmentMatches = matches.filter(m => m.assignment_id === assignment.id);
                  const newMatches = assignmentMatches.filter(m => m.status === 'suggested').length;
                  
                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                      style={{ borderColor: '#E8E6DD' }}
                      onClick={() => router.push(`/matches?assignment=${assignment.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" style={{ color: '#2D3330' }}>
                            {assignment.title}
                          </h3>
                          <p className="text-sm mb-3" style={{ color: '#6B6760' }}>
                            {assignment.description?.substring(0, 120)}...
                          </p>
                          <div className="flex items-center gap-4 text-xs" style={{ color: '#6B6760' }}>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {assignmentMatches.length} matches
                            </span>
                            {newMatches > 0 && (
                              <Badge style={{ backgroundColor: '#C76B4A', color: 'white' }}>
                                {newMatches} new
                              </Badge>
                            )}
                            <span>{assignment.location_type}</span>
                            <span>{assignment.compensation_type}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
                  No active assignments
                </h3>
                <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
                  Create your first assignment to start matching with qualified candidates
                </p>
                <Button
                  onClick={() => router.push('/assignments/new')}
                  style={{ backgroundColor: '#1C4D3A', color: 'white' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Assignment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-display">Recent Matches</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/matches')}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.slice(0, 5).map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: '#E8E6DD' }}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback style={{ backgroundColor: '#7A9278', color: 'white' }}>
                          {match.profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold" style={{ color: '#2D3330' }}>
                          {match.profile?.full_name || 'Candidate'}
                        </h4>
                        <p className="text-sm" style={{ color: '#6B6760' }}>
                          {match.assignment?.title || 'Assignment'} • {Math.round(match.overall_score * 100)}% match
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.status === 'accepted' && (
                        <Badge style={{ backgroundColor: '#7A927820', color: '#7A9278' }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Accepted
                        </Badge>
                      )}
                      {match.status === 'suggested' && (
                        <Badge style={{ backgroundColor: '#C76B4A20', color: '#C76B4A' }}>
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {match.status === 'declined' && (
                        <Badge variant="outline">
                          <XCircle className="w-3 h-3 mr-1" />
                          Declined
                        </Badge>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/matches/${match.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  No matches yet. Post an assignment to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-display">Team Members</CardTitle>
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </CardHeader>
          <CardContent>
            {teamMembers.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#F7F6F1' }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback style={{ backgroundColor: '#5C8B89', color: 'white' }}>
                          {member.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium" style={{ color: '#2D3330' }}>
                          {member.full_name}
                        </h4>
                        <p className="text-xs" style={{ color: '#6B6760' }}>
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {member.role || 'Member'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                <p className="text-sm" style={{ color: '#6B6760' }}>
                  No team members yet. Invite your team to collaborate.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

