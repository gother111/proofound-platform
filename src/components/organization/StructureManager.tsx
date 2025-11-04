'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Download, List, GitBranch, AlertCircle } from 'lucide-react';
import { StructureTree } from './StructureTree';
import { OrgChartViewer } from './OrgChartViewer';
import { AddDepartmentDialog } from './AddDepartmentDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Department {
  id: string;
  entityType: 'executive_team' | 'department' | 'team' | 'working_group';
  name: string;
  description?: string;
  teamSize?: number;
  focusArea?: string;
  parentId?: string;
}

interface StructureManagerProps {
  orgId: string;
  initialDepartments?: Department[];
}

export function StructureManager({ orgId, initialDepartments = [] }: StructureManagerProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newParentId, setNewParentId] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const handleAdd = () => {
    setEditingDepartment(null);
    setNewParentId(undefined);
    setShowAddDialog(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditingDepartment(null);
    setNewParentId(parentId);
    setShowAddDialog(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setNewParentId(undefined);
    setShowAddDialog(true);
  };

  const handleSave = async (
    department: Omit<Department, 'id'> & { id?: string }
  ): Promise<void> => {
    try {
      const url = department.id
        ? `/api/organizations/${orgId}/structure/${department.id}`
        : `/api/organizations/${orgId}/structure`;

      const method = department.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...department,
          // If creating a new entity with a parent, use the newParentId
          parentId: !department.id && newParentId ? newParentId : department.parentId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }

      const saved = await response.json();

      if (department.id) {
        // Update existing
        setDepartments((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
        toast.success('Updated successfully');
      } else {
        // Add new
        setDepartments((prev) => [...prev, saved]);
        toast.success('Created successfully');
      }

      setShowAddDialog(false);
      setEditingDepartment(null);
      setNewParentId(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Check if department has children
      const hasChildren = departments.some((d) => d.parentId === id);
      if (hasChildren) {
        toast.error('Cannot delete a department with child entities', {
          description: 'Please delete or reassign child entities first.',
        });
        setDeleteConfirm(null);
        return;
      }

      const response = await fetch(`/api/organizations/${orgId}/structure/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete');
      }

      setDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.success('Deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/organizations/${orgId}/structure/export`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `org-structure-${orgId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Structure exported successfully');
    } catch (error) {
      toast.error('Failed to export structure');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                Organizational Structure
              </CardTitle>
              <CardDescription className="mt-1">
                Define your organization&apos;s departments, teams, and their hierarchy
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || departments.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entity
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-proofound-forest/10 to-proofound-sage/10 flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-8 h-8 text-proofound-forest/60" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No structure defined yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your organizational structure by adding departments, teams, or
                working groups. This helps candidates understand your organization better.
              </p>
              <Button
                onClick={handleAdd}
                className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Entity
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="tree" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="tree">
                  <List className="h-4 w-4 mr-2" />
                  Tree View
                </TabsTrigger>
                <TabsTrigger value="chart">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Org Chart
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tree" className="mt-0">
                <StructureTree
                  departments={departments}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onAddChild={handleAddChild}
                />
              </TabsContent>

              <TabsContent value="chart" className="mt-0">
                <OrgChartViewer departments={departments} onNodeClick={handleEdit} />
              </TabsContent>
            </Tabs>
          )}

          {/* Info Banner */}
          {departments.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-medium mb-1">Structure visibility</p>
                <p className="text-blue-700 dark:text-blue-400">
                  Your organizational structure helps candidates understand reporting lines and team
                  organization. You can link teams to specific assignments for better context.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <AddDepartmentDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingDepartment(null);
            setNewParentId(undefined);
          }
        }}
        department={editingDepartment}
        allDepartments={departments}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entity?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Make sure this entity has no child entities before
              deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
