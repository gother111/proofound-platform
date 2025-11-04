'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2, Calendar, CheckCircle2, Handshake } from 'lucide-react';

interface OrganizationPartnership {
  id: string;
  partnerName: string;
  partnerType: 'company' | 'ngo' | 'government' | 'academic' | 'network' | 'other';
  partnershipScope: string;
  impactCreated: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'suspended';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PartnershipCardProps {
  partnership: OrganizationPartnership;
  canEdit: boolean;
  onEdit: (partnership: OrganizationPartnership) => void;
  onDelete: (id: string) => void;
}

const PARTNER_TYPE_COLORS = {
  company: 'bg-blue-100 text-blue-700 border-blue-300',
  ngo: 'bg-green-100 text-green-700 border-green-300',
  government: 'bg-purple-100 text-purple-700 border-purple-300',
  academic: 'bg-orange-100 text-orange-700 border-orange-300',
  network: 'bg-pink-100 text-pink-700 border-pink-300',
  other: 'bg-gray-100 text-gray-700 border-gray-300',
};

const PARTNER_TYPE_LABELS = {
  company: 'Company',
  ngo: 'NGO',
  government: 'Government',
  academic: 'Academic',
  network: 'Network',
  other: 'Other',
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700 border-green-300',
  completed: 'bg-purple-100 text-purple-700 border-purple-300',
  suspended: 'bg-gray-100 text-gray-700 border-gray-300',
};

const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  suspended: 'Suspended',
};

export function PartnershipCard({ partnership, canEdit, onEdit, onDelete }: PartnershipCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="border-proofound-stone dark:border-border hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-lg bg-proofound-sage/10">
                <Handshake className="h-5 w-5 text-proofound-sage" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{partnership.partnerName}</CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className={PARTNER_TYPE_COLORS[partnership.partnerType]}>
                    {PARTNER_TYPE_LABELS[partnership.partnerType]}
                  </Badge>
                  <Badge variant="outline" className={STATUS_COLORS[partnership.status]}>
                    {STATUS_LABELS[partnership.status]}
                  </Badge>
                  {partnership.isVerified && (
                    <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(partnership)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(partnership.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(partnership.startDate)}
            {partnership.endDate && ` - ${formatDate(partnership.endDate)}`}
            {!partnership.endDate && partnership.status === 'active' && ' - Present'}
          </span>
        </div>

        {partnership.partnershipScope && (
          <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Scope</p>
            <p className="text-sm">{partnership.partnershipScope}</p>
          </div>
        )}

        {partnership.impactCreated && (
          <div className="p-3 rounded-lg bg-proofound-forest/5 border border-proofound-forest/20">
            <p className="text-xs font-medium text-proofound-forest mb-1 flex items-center gap-1">
              <Handshake className="h-3 w-3" />
              Impact Created
            </p>
            <p className="text-sm">{partnership.impactCreated}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

