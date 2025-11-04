'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkNorms {
  asyncSyncBalance?: number; // 0-100, 0=fully sync, 100=fully async
  meetingLoad?: 'low' | 'medium' | 'high';
  coreHoursStart?: string; // e.g., "09:00"
  coreHoursEnd?: string; // e.g., "17:00"
  coreHoursTimezone?: string;
  workingDays?: string; // e.g., "Monday-Friday"
  flexibilityLevel?: 'strict' | 'moderate' | 'flexible';
  responseTimeExpectation?: string;
  collaborationTools?: string[]; // e.g., ["Slack", "Zoom", "Notion"]
}

interface WorkNormsFormProps {
  workNorms: WorkNorms;
  onChange: (norms: WorkNorms) => void;
  disabled?: boolean;
}

export function WorkNormsForm({ workNorms, onChange, disabled = false }: WorkNormsFormProps) {
  const handleUpdate = (key: keyof WorkNorms, value: any) => {
    onChange({ ...workNorms, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Work Norms</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Define how your team works together and what candidates can expect.
        </p>
      </div>

      {/* Async/Sync Balance */}
      <div className="space-y-3">
        <Label htmlFor="async-sync">
          Async/Sync Balance{' '}
          <span className="text-xs text-muted-foreground ml-2">
            ({workNorms.asyncSyncBalance ?? 50}% Async)
          </span>
        </Label>
        <div className="space-y-2">
          <Slider
            id="async-sync"
            value={[workNorms.asyncSyncBalance ?? 50]}
            onValueChange={([value]) => handleUpdate('asyncSyncBalance', value)}
            max={100}
            step={10}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fully Synchronous</span>
            <span>Fully Asynchronous</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Synchronous work requires real-time availability (meetings, calls).
          Asynchronous work allows flexible schedules (documents, messages).
        </p>
      </div>

      {/* Meeting Load */}
      <div className="space-y-2">
        <Label htmlFor="meeting-load">Meeting Load</Label>
        <Select
          value={workNorms.meetingLoad || ''}
          onValueChange={(value: any) => handleUpdate('meetingLoad', value)}
          disabled={disabled}
        >
          <SelectTrigger id="meeting-load">
            <SelectValue placeholder="Select meeting intensity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low (0-5 hours/week)</SelectItem>
            <SelectItem value="medium">Medium (5-15 hours/week)</SelectItem>
            <SelectItem value="high">High (15+ hours/week)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Core Hours */}
      <div className="space-y-3">
        <Label>Core Hours (Optional)</Label>
        <p className="text-xs text-muted-foreground">
          Time when team members are expected to be available for synchronous collaboration
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="core-start" className="text-xs">
              Start Time
            </Label>
            <Input
              id="core-start"
              type="time"
              value={workNorms.coreHoursStart || ''}
              onChange={(e) => handleUpdate('coreHoursStart', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="core-end" className="text-xs">
              End Time
            </Label>
            <Input
              id="core-end"
              type="time"
              value={workNorms.coreHoursEnd || ''}
              onChange={(e) => handleUpdate('coreHoursEnd', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="core-timezone" className="text-xs">
            Timezone
          </Label>
          <Input
            id="core-timezone"
            placeholder="e.g., UTC, EST, PST"
            value={workNorms.coreHoursTimezone || ''}
            onChange={(e) => handleUpdate('coreHoursTimezone', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Working Days */}
      <div className="space-y-2">
        <Label htmlFor="working-days">Working Days</Label>
        <Input
          id="working-days"
          placeholder="e.g., Monday-Friday, Mon-Thu"
          value={workNorms.workingDays || ''}
          onChange={(e) => handleUpdate('workingDays', e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Flexibility Level */}
      <div className="space-y-2">
        <Label htmlFor="flexibility">Schedule Flexibility</Label>
        <Select
          value={workNorms.flexibilityLevel || ''}
          onValueChange={(value: any) => handleUpdate('flexibilityLevel', value)}
          disabled={disabled}
        >
          <SelectTrigger id="flexibility">
            <SelectValue placeholder="Select flexibility level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strict">Strict (Fixed hours, limited flexibility)</SelectItem>
            <SelectItem value="moderate">Moderate (Some flexibility around core hours)</SelectItem>
            <SelectItem value="flexible">Flexible (Work when it suits you)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Response Time */}
      <div className="space-y-2">
        <Label htmlFor="response-time">Response Time Expectations</Label>
        <Input
          id="response-time"
          placeholder="e.g., Within 24 hours, Same business day"
          value={workNorms.responseTimeExpectation || ''}
          onChange={(e) => handleUpdate('responseTimeExpectation', e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Collaboration Tools */}
      <div className="space-y-2">
        <Label htmlFor="collab-tools">Collaboration Tools (comma-separated)</Label>
        <Input
          id="collab-tools"
          placeholder="e.g., Slack, Zoom, Notion, Figma"
          value={workNorms.collaborationTools?.join(', ') || ''}
          onChange={(e) =>
            handleUpdate(
              'collaborationTools',
              e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
            )
          }
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          List the main tools your team uses for communication and collaboration
        </p>
      </div>
    </div>
  );
}
