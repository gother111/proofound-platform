/**
 * Team Coverage Matrix Component
 *
 * Displays skill coverage across team members with color-coded visualization.
 * PRD Reference: Part 5 O6 - Team Coverage Analytics
 *
 * Color coding:
 * - Red: No coverage (0 people)
 * - Yellow: Single point of failure (1 person)
 * - Green: Good coverage (2+ people)
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Download, Filter, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/fetch';

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  skills: string[];
}

interface SkillCoverage {
  l4_id: string;
  l4_name: string;
  l2_name: string;
  coverage: number;
  members: string[];
}

interface TeamCoverageMatrixProps {
  organizationId: string;
}

export function TeamCoverageMatrix({ organizationId }: TeamCoverageMatrixProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [skillCoverage, setSkillCoverage] = useState<SkillCoverage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'gaps' | 'single'>('all');

  useEffect(() => {
    fetchCoverage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const fetchCoverage = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`/api/org/${organizationId}/coverage`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
        setSkillCoverage(data.skillCoverage || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch coverage:', error);
      toast.error('Failed to load team coverage');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Skill (L4)', 'Category (L2)', 'Coverage', ...members.map((m) => m.name)];
    const rows = skillCoverage.map((skill) => [
      skill.l4_name,
      skill.l2_name,
      skill.coverage.toString(),
      ...members.map((m) => (skill.members.includes(m.id) ? '✓' : '')),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `team-coverage-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Coverage matrix exported');
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage === 0) return 'bg-[#FEE]'; // Red
    if (coverage === 1) return 'bg-[#FFF4E6]'; // Yellow
    return 'bg-[#E8F5E1]'; // Green
  };

  const getCoverageIcon = (coverage: number) => {
    if (coverage === 0) return <AlertTriangle className="w-3.5 h-3.5 text-[#D93F3F]" />;
    if (coverage === 1) return <AlertCircle className="w-3.5 h-3.5 text-[#C76B4A]" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-[#1C4D3A]" />;
  };

  // Filter skills based on selected filter
  const filteredSkills = skillCoverage.filter((skill) => {
    if (filter === 'gaps') return skill.coverage === 0;
    if (filter === 'single') return skill.coverage === 1;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-[#1C4D3A]" />
              <h2 className="text-2xl font-bold text-[#2D3330]">Team Coverage Matrix</h2>
            </div>
            <p className="text-sm text-[#6B6760]">
              Visualize skill coverage across your team to identify gaps and single points of
              failure
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#F7F6F1] rounded-lg">
              <p className="text-2xl font-bold text-[#2D3330]">{stats.totalMembers}</p>
              <p className="text-xs text-[#6B6760]">Team Members</p>
            </div>
            <div className="text-center p-4 bg-[#FEE] rounded-lg">
              <p className="text-2xl font-bold text-[#D93F3F]">{stats.noCoverage}</p>
              <p className="text-xs text-[#6B6760]">No Coverage</p>
            </div>
            <div className="text-center p-4 bg-[#FFF4E6] rounded-lg">
              <p className="text-2xl font-bold text-[#C76B4A]">{stats.singleCoverage}</p>
              <p className="text-xs text-[#6B6760]">Single Point</p>
            </div>
            <div className="text-center p-4 bg-[#E8F5E1] rounded-lg">
              <p className="text-2xl font-bold text-[#1C4D3A]">{stats.multipleCoverage}</p>
              <p className="text-xs text-[#6B6760]">Good Coverage</p>
            </div>
          </div>
        )}

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mt-6">
          <Filter className="w-4 h-4 text-[#6B6760]" />
          <span className="text-sm text-[#6B6760]">Show:</span>
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#1C4D3A] text-white' : ''}
          >
            All Skills
          </Button>
          <Button
            size="sm"
            variant={filter === 'gaps' ? 'default' : 'outline'}
            onClick={() => setFilter('gaps')}
            className={filter === 'gaps' ? 'bg-[#D93F3F] text-white' : ''}
          >
            Gaps Only
          </Button>
          <Button
            size="sm"
            variant={filter === 'single' ? 'default' : 'outline'}
            onClick={() => setFilter('single')}
            className={filter === 'single' ? 'bg-[#C76B4A] text-white' : ''}
          >
            Single Points
          </Button>
        </div>
      </Card>

      {/* Matrix */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center text-sm text-[#6B6760]">
          Loading team coverage...
        </div>
      ) : filteredSkills.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-[#1C4D3A] mx-auto mb-3" />
          <p className="text-[#2D3330] font-medium">
            {filter === 'gaps'
              ? 'No coverage gaps!'
              : filter === 'single'
                ? 'No single points of failure!'
                : 'No skills tracked yet'}
          </p>
          <p className="text-sm text-[#6B6760] mt-1">
            {filter === 'all'
              ? 'Add team members with skills to see coverage'
              : 'Your team has good skill redundancy'}
          </p>
        </Card>
      ) : (
        <Card className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E6DD]">
                <th className="text-left p-3 font-semibold text-[#2D3330]">Skill (L4)</th>
                <th className="text-left p-3 font-semibold text-[#2D3330]">Category (L2)</th>
                <th className="text-center p-3 font-semibold text-[#2D3330]">Coverage</th>
                {members.map((member) => (
                  <th key={member.id} className="text-center p-3 min-w-[80px]">
                    <div className="font-semibold text-[#2D3330] truncate">{member.name}</div>
                    {member.role && (
                      <div className="text-xs text-[#6B6760] font-normal truncate">
                        {member.role}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSkills.map((skill) => (
                <tr key={skill.l4_id} className="border-b border-[#E8E6DD] hover:bg-[#F7F6F1]">
                  <td className="p-3">
                    <span className="font-medium text-[#2D3330]">{skill.l4_name}</span>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-xs">
                      {skill.l2_name}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div
                      className={`flex items-center justify-center gap-2 py-1 px-3 rounded-full ${getCoverageColor(skill.coverage)}`}
                    >
                      {getCoverageIcon(skill.coverage)}
                      <span className="font-semibold text-[#2D3330]">{skill.coverage}</span>
                    </div>
                  </td>
                  {members.map((member) => (
                    <td key={member.id} className="p-3 text-center">
                      {skill.members.includes(member.id) && (
                        <CheckCircle2 className="w-5 h-5 text-[#1C4D3A] mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
