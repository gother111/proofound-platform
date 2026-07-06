'use client';

import { Building2, Users as UsersIcon, Target, UserCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Department {
  id: string;
  entityType: 'executive_team' | 'department' | 'team' | 'working_group';
  name: string;
  description?: string;
  teamSize?: number;
  focusArea?: string;
  parentId?: string;
}

interface OrgChartViewerProps {
  departments: Department[];
  onNodeClick?: (department: Department) => void;
}

const ENTITY_TYPE_ICONS = {
  executive_team: Building2,
  department: Building2,
  team: UsersIcon,
  working_group: Target,
};

const ENTITY_TYPE_COLORS = {
  executive_team: 'bg-purple-50 border-purple-300 hover:bg-purple-100',
  department: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
  team: 'bg-green-50 border-green-300 hover:bg-green-100',
  working_group: 'bg-orange-50 border-orange-300 hover:bg-orange-100',
};

const ENTITY_TYPE_LABELS = {
  executive_team: 'Executive',
  department: 'Department',
  team: 'Team',
  working_group: 'Working Group',
};

function OrgChartNode({
  department,
  children,
  level,
  onNodeClick,
}: {
  department: Department;
  children: Department[];
  level: number;
  onNodeClick?: (dept: Department) => void;
}) {
  const Icon = ENTITY_TYPE_ICONS[department.entityType];
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <Card
        className={`w-56 border-2 transition-all cursor-pointer ${
          ENTITY_TYPE_COLORS[department.entityType]
        }`}
        onClick={() => onNodeClick?.(department)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{department.name}</h4>
              <p className="text-xs text-muted-foreground">
                {ENTITY_TYPE_LABELS[department.entityType]}
              </p>
              {department.teamSize && (
                <div className="flex items-center gap-1 mt-2">
                  <UserCircle className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {department.teamSize} {department.teamSize === 1 ? 'person' : 'people'}
                  </span>
                </div>
              )}
              {department.focusArea && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {department.focusArea}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connector Line */}
      {hasChildren && (
        <>
          <div className="w-0.5 h-8 bg-border" />
          <div className="flex gap-8 relative">
            {/* Horizontal Line */}
            {children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-border"
                style={{
                  left: '50%',
                  right: '50%',
                  transform: 'translateX(-50%)',
                  width: `${(children.length - 1) * 15}rem`,
                }}
              />
            )}

            {/* Child Nodes */}
            {children.map((child, index) => (
              <div key={child.id} className="relative">
                <div className="w-0.5 h-8 bg-border mx-auto" />
                <OrgChartNodeWrapper
                  department={child}
                  allDepartments={[]}
                  level={level + 1}
                  onNodeClick={onNodeClick}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgChartNodeWrapper({
  department,
  allDepartments,
  level,
  onNodeClick,
}: {
  department: Department;
  allDepartments: Department[];
  level: number;
  onNodeClick?: (dept: Department) => void;
}) {
  const children = allDepartments.filter((d) => d.parentId === department.id);

  return (
    <OrgChartNode
      department={department}
      children={children}
      level={level}
      onNodeClick={onNodeClick}
    />
  );
}

export function OrgChartViewer({ departments, onNodeClick }: OrgChartViewerProps) {
  // Find root nodes (no parent)
  const rootDepartments = departments.filter((d) => !d.parentId);

  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No organizational structure to display.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-8">
      <div className="flex flex-col items-center gap-8 min-w-max px-8">
        {rootDepartments.map((dept) => (
          <OrgChartNodeWrapper
            key={dept.id}
            department={dept}
            allDepartments={departments}
            level={0}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-12 flex justify-center gap-4 flex-wrap">
        {Object.entries(ENTITY_TYPE_LABELS).map(([type, label]) => {
          const Icon = ENTITY_TYPE_ICONS[type as keyof typeof ENTITY_TYPE_ICONS];
          return (
            <div
              key={type}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 text-xs"
            >
              <Icon className="h-3 w-3" />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
