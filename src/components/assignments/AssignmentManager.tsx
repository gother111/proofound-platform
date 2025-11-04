'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Loader2, AlertCircle, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StakeholderInviteDialog } from './StakeholderInviteDialog';
import { Badge } from '@/components/ui/badge';

interface Assignment {
  id: string;
  stakeholderEmail: string;
  stakeholderName: string | null;
  assignedSections: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
}

interface AssignmentManagerProps {
  orgId: string;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'bg-green-100 text-green-700' },
  expired: { icon: XCircle, label: 'Expired', color: 'bg-red-100 text-red-700' },
};

export function AssignmentManager({ orgId }: AssignmentManagerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations/${orgId}/assignments`);

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [orgId]);

  const handleInvitationSuccess = () => {
    fetchAssignments(); // Refresh list
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-forest">
            Stakeholder Assignments
          </h2>
          <p className="text-sm text-proofound-charcoal/70 mt-1">
            Invite stakeholders to collaboratively complete profile sections
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-proofound-forest hover:bg-proofound-forest/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invitation
        </Button>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Invite stakeholders to help fill out specific sections of your profile
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-proofound-forest hover:bg-proofound-forest/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Send First Invitation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => {
            const StatusIcon = STATUS_CONFIG[assignment.status].icon;
            const isExpired = new Date() > new Date(assignment.expiresAt);
            const actualStatus = isExpired && assignment.status !== 'completed' ? 'expired' : assignment.status;

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {assignment.stakeholderName || assignment.stakeholderEmail}
                      </CardTitle>
                      {assignment.stakeholderName && (
                        <p className="text-sm text-muted-foreground">{assignment.stakeholderEmail}</p>
                      )}
                    </div>
                    <Badge className={STATUS_CONFIG[actualStatus].color} variant="outline">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {STATUS_CONFIG[actualStatus].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-proofound-charcoal/60 mb-1">
                      Assigned Sections
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {assignment.assignedSections.map((section) => (
                        <Badge key={section} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {assignment.completedAt ? (
                      <span>
                        Completed {new Date(assignment.completedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>
                        Expires {new Date(assignment.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {assignment.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // TODO: Open review modal
                        console.log('Review submissions for', assignment.id);
                      }}
                    >
                      Review Submissions
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite Dialog */}
      <StakeholderInviteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orgId={orgId}
      />
    </div>
  );
}
