/**
 * Work Schedule Editor Component
 *
 * Allows users to track their work hours and receive burnout alerts
 * Implements PRD requirement for work-life balance monitoring
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, Clock, Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface WorkSchedule {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

interface WorkScheduleEditorProps {
  userId: string;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const BURNOUT_THRESHOLDS = {
  safe: 40,
  warning: 50,
  danger: 60,
};

export function WorkScheduleEditor({ userId }: WorkScheduleEditorProps) {
  const [schedule, setSchedule] = useState<WorkSchedule>({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/wellbeing/work-schedule');
      if (response.ok) {
        const data = await response.json();
        if (data.schedule) {
          setSchedule(data.schedule);
        }
      }
    } catch (error) {
      console.error('Failed to fetch work schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHoursChange = (day: keyof WorkSchedule, value: string) => {
    const hours = parseFloat(value) || 0;
    if (hours < 0 || hours > 24) return;

    setSchedule((prev) => ({
      ...prev,
      [day]: hours,
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/wellbeing/work-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      toast.success('Work schedule saved successfully');
      setHasUnsavedChanges(false);

      // Log analytics event if burnout threshold exceeded
      const totalHours = calculateTotalHours();
      if (totalHours > BURNOUT_THRESHOLDS.warning) {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'burnout_risk_detected',
            event_data: { totalHours, threshold: BURNOUT_THRESHOLDS.warning },
          }),
        });
      }
    } catch (error) {
      console.error('Failed to save work schedule:', error);
      toast.error('Failed to save work schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalHours = () => {
    return Object.values(schedule).reduce((sum, hours) => sum + hours, 0);
  };

  const getBurnoutLevel = (totalHours: number): { level: string; color: string; icon: any } => {
    if (totalHours <= BURNOUT_THRESHOLDS.safe) {
      return {
        level: 'Healthy',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
      };
    }
    if (totalHours <= BURNOUT_THRESHOLDS.warning) {
      return {
        level: 'Warning',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: AlertTriangle,
      };
    }
    return {
      level: 'High Risk',
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: AlertTriangle,
    };
  };

  const getAverageHoursPerDay = () => {
    const totalHours = calculateTotalHours();
    return (totalHours / 7).toFixed(1);
  };

  const totalHours = calculateTotalHours();
  const burnoutLevel = getBurnoutLevel(totalHours);
  const BurnoutIcon = burnoutLevel.icon;
  const progressPercentage = Math.min((totalHours / BURNOUT_THRESHOLDS.danger) * 100, 100);

  if (isLoading) {
    return (
      <Card className="border-proofound-stone dark:border-border rounded-2xl">
        <CardContent className="py-8">
          <p className="text-center text-[#6B6760] dark:text-muted-foreground">
            Loading work schedule...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-proofound-stone dark:border-border rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
              Weekly Work Schedule
            </CardTitle>
            <CardDescription className="text-proofound-charcoal/70 dark:text-muted-foreground">
              Track your work hours and monitor burnout risk
            </CardDescription>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="bg-[#1C4D3A] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total Hours Summary */}
        <Card className={`border-2 ${burnoutLevel.color}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium mb-1">Total Weekly Hours</p>
                <p className="text-4xl font-bold">{totalHours.toFixed(1)}</p>
                <p className="text-sm text-[#6B6760] dark:text-muted-foreground mt-1">
                  Average: {getAverageHoursPerDay()} hours/day
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={`mb-2 ${burnoutLevel.color}`}>
                  {burnoutLevel.level}
                </Badge>
                <div className="flex items-center gap-2 justify-end">
                  <BurnoutIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Burnout Risk</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#6B6760] dark:text-muted-foreground">
                <span>0h</span>
                <span>{BURNOUT_THRESHOLDS.safe}h (Safe)</span>
                <span>{BURNOUT_THRESHOLDS.warning}h (Warning)</span>
                <span>{BURNOUT_THRESHOLDS.danger}h+ (High Risk)</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Burnout Alerts */}
        {totalHours > BURNOUT_THRESHOLDS.safe && (
          <Alert
            className={
              totalHours > BURNOUT_THRESHOLDS.warning
                ? 'border-red-300 bg-red-50'
                : 'border-yellow-300 bg-yellow-50'
            }
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                totalHours > BURNOUT_THRESHOLDS.warning ? 'text-red-600' : 'text-yellow-600'
              }`}
            />
            <AlertDescription>
              {totalHours > BURNOUT_THRESHOLDS.warning ? (
                <>
                  <strong>High burnout risk detected!</strong> You're working {totalHours.toFixed(1)}{' '}
                  hours per week. Research shows working over {BURNOUT_THRESHOLDS.warning} hours
                  significantly increases stress and decreases productivity. Consider:
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li>Delegating or rescheduling non-urgent tasks</li>
                    <li>Setting clear work-life boundaries</li>
                    <li>Taking regular breaks throughout the day</li>
                    <li>Speaking with your manager about workload</li>
                  </ul>
                </>
              ) : (
                <>
                  <strong>Elevated work hours detected.</strong> You're working{' '}
                  {totalHours.toFixed(1)} hours per week. While this is manageable short-term,
                  sustained periods over {BURNOUT_THRESHOLDS.safe} hours can lead to burnout.
                  Monitor your stress levels and ensure adequate rest.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {totalHours <= BURNOUT_THRESHOLDS.safe && totalHours > 0 && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Healthy work-life balance!</strong> Your current schedule of{' '}
              {totalHours.toFixed(1)} hours per week is within healthy limits. Keep up the good
              work and continue monitoring your well-being.
            </AlertDescription>
          </Alert>
        )}

        {/* Daily Hours Input */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[#2D3330] dark:text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Daily Work Hours
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAYS_OF_WEEK.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Label
                  htmlFor={key}
                  className="w-28 text-sm font-medium text-[#2D3330] dark:text-foreground"
                >
                  {label}
                </Label>
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    id={key}
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={schedule[key] || ''}
                    onChange={(e) => handleHoursChange(key, e.target.value)}
                    className="w-24"
                    placeholder="0"
                  />
                  <span className="text-sm text-[#6B6760] dark:text-muted-foreground">hours</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Templates */}
        <div className="space-y-3">
          <h3 className="font-semibold text-[#2D3330] dark:text-foreground">Quick Templates</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSchedule({
                  monday: 8,
                  tuesday: 8,
                  wednesday: 8,
                  thursday: 8,
                  friday: 8,
                  saturday: 0,
                  sunday: 0,
                });
                setHasUnsavedChanges(true);
              }}
            >
              Standard 40h (Mon-Fri)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSchedule({
                  monday: 6,
                  tuesday: 6,
                  wednesday: 6,
                  thursday: 6,
                  friday: 6,
                  saturday: 0,
                  sunday: 0,
                });
                setHasUnsavedChanges(true);
              }}
            >
              Part-Time 30h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSchedule({
                  monday: 0,
                  tuesday: 0,
                  wednesday: 0,
                  thursday: 0,
                  friday: 0,
                  saturday: 0,
                  sunday: 0,
                });
                setHasUnsavedChanges(true);
              }}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Research Citation */}
        <div className="text-xs text-[#6B6760] dark:text-muted-foreground p-3 bg-[#F7F6F1] dark:bg-background/50 rounded-lg border border-[#E8E6DD] dark:border-border">
          <p>
            <strong>Evidence-based thresholds:</strong> Research shows working more than 50 hours
            per week increases risk of cardiovascular disease by 33% and stroke by 13% (Kivimäki et
            al., 2015). The 40-hour threshold aligns with APA recommendations for sustainable
            work-life balance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

