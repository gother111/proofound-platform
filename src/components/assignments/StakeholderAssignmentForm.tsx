'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { AddProjectDialog } from '@/components/organization/AddProjectDialog';
import { AddPartnershipDialog } from '@/components/organization/AddPartnershipDialog';

interface Assignment {
  invitation: {
    id: string;
    stakeholderName: string | null;
    assignedSections: string[];
    message: string | null;
    status: string;
    expiresAt: string;
  };
  submissions: any[];
}

interface StakeholderAssignmentFormProps {
  token: string;
}

export function StakeholderAssignmentForm({ token }: StakeholderAssignmentFormProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchAssignment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments/invite/${token}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch assignment');
      }

      const data = await response.json();
      setAssignment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleSectionSubmit = async (sectionName: string, sectionData: any) => {
    try {
      const response = await fetch(`/api/assignments/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionName, sectionData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }

      toast.success('Section submitted successfully!');
      setDialogOpen(false);
      setActiveSection(null);
      await fetchAssignment(); // Refresh to show updated status
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit');
      throw err;
    }
  };

  const handleStartSection = (sectionName: string) => {
    setActiveSection(sectionName);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-proofound-forest" />
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

  if (!assignment) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Assignment not found</AlertDescription>
      </Alert>
    );
  }

  const { invitation, submissions } = assignment;
  const completedSections = new Set(submissions.map((s) => s.sectionName));
  const allCompleted = invitation.assignedSections.every((s) => completedSections.has(s));

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardContent className="pt-6">
          {invitation.stakeholderName && (
            <p className="text-lg mb-2">
              Hello, <strong>{invitation.stakeholderName}</strong>!
            </p>
          )}
          {invitation.message && (
            <p className="text-sm text-proofound-charcoal/70 mb-4">{invitation.message}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {allCompleted ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Thank you! All assigned sections have been completed.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">
                  {completedSections.size} of {invitation.assignedSections.length} sections
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-proofound-forest h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (completedSections.size / invitation.assignedSections.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Sections */}
      <div className="space-y-4">
        <h2 className="text-xl font-['Crimson_Pro'] font-semibold">Assigned Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invitation.assignedSections.map((section) => {
            const isCompleted = completedSections.has(section);
            return (
              <Card key={section} className={isCompleted ? 'border-green-300' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{section}</CardTitle>
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                </CardHeader>
                <CardContent>
                  {isCompleted ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 text-sm">
                        Submitted successfully
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button
                      onClick={() => handleStartSection(section)}
                      className="w-full bg-proofound-forest hover:bg-proofound-forest/90"
                    >
                      Start {section}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dynamic Dialog based on section type */}
      {activeSection === 'projects' && (
        <AddProjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={(data) => handleSectionSubmit('projects', data)}
          existingProject={null}
        />
      )}

      {activeSection === 'partnerships' && (
        <AddPartnershipDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={(data) => handleSectionSubmit('partnerships', data)}
          existingPartnership={null}
        />
      )}
    </div>
  );
}
