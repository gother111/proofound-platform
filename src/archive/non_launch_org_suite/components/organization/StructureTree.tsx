'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Users as UsersIcon,
  UserCircle,
  Target,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Department {
  id: string;
  entityType: 'executive_team' | 'department' | 'team' | 'working_group';
  name: string;
  description?: string;
  teamSize?: number;
  focusArea?: string;
  parentId?: string;
}

interface StructureTreeProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (departmentId: string) => void;
  onAddChild: (parentId: string) => void;
}

const ENTITY_TYPE_ICONS = {
  executive_team: Building2,
  department: Building2,
  team: UsersIcon,
  working_group: Target,
};

const ENTITY_TYPE_COLORS = {
  executive_team: 'bg-purple-100 text-purple-700 border-purple-300',
  department: 'bg-blue-100 text-blue-700 border-blue-300',
  team: 'bg-green-100 text-green-700 border-green-300',
  working_group: 'bg-orange-100 text-orange-700 border-orange-300',
};

function TreeNode({
  department,
  children,
  level,
  onEdit,
  onDelete,
  onAddChild,
}: {
  department: Department;
  children: Department[];
  level: number;
  onEdit: (dept: Department) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = children.length > 0;
  const Icon = ENTITY_TYPE_ICONS[department.entityType];

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group ${
          level > 0 ? 'ml-6 border-l-2 border-muted-foreground/20' : ''
        }`}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        {/* Icon */}
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${ENTITY_TYPE_COLORS[department.entityType]}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{department.name}</h4>
            {department.teamSize && (
              <Badge variant="outline" className="text-xs">
                <UserCircle className="h-3 w-3 mr-1" />
                {department.teamSize}
              </Badge>
            )}
          </div>
          {department.description && (
            <p className="text-xs text-muted-foreground truncate">{department.description}</p>
          )}
          {department.focusArea && (
            <p className="text-xs text-muted-foreground mt-0.5">Focus: {department.focusArea}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(department)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(department.id)}>
                <UsersIcon className="h-4 w-4 mr-2" />
                Add Child Entity
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(department.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-3">
          {children.map((child) => (
            <TreeNodeWrapper
              key={child.id}
              department={child}
              allDepartments={[]}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNodeWrapper({
  department,
  allDepartments,
  level,
  onEdit,
  onDelete,
  onAddChild,
}: {
  department: Department;
  allDepartments: Department[];
  level: number;
  onEdit: (dept: Department) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const children = allDepartments.filter((d) => d.parentId === department.id);

  return (
    <TreeNode
      department={department}
      children={children}
      level={level}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddChild={onAddChild}
    />
  );
}

export function StructureTree({ departments, onEdit, onDelete, onAddChild }: StructureTreeProps) {
  // Build hierarchy - find root nodes (no parent)
  const rootDepartments = departments.filter((d) => !d.parentId);

  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No organizational structure defined yet.</p>
        <p className="text-xs mt-1">Start by adding your first department or team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootDepartments.map((dept) => (
        <TreeNodeWrapper
          key={dept.id}
          department={dept}
          allDepartments={departments}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}
