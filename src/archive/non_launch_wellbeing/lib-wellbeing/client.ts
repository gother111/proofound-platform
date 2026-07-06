import { apiFetch } from '@/lib/api/fetch';

export interface WellbeingOptInPayload {
  optedIn: boolean;
  privacyBannerAcknowledged?: boolean;
}

export function setWellbeingOptIn(payload: WellbeingOptInPayload): Promise<Response> {
  return apiFetch('/api/wellbeing/opt-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function exportZenData(format: 'json' | 'checkins_csv' = 'json'): Promise<Response> {
  return apiFetch(`/api/wellbeing/export?format=${format}`, {
    method: 'GET',
  });
}

export function deleteZenData(): Promise<Response> {
  return apiFetch('/api/wellbeing/data', {
    method: 'DELETE',
  });
}

export interface SelfAssessmentPayload {
  assessmentType: 'phq2' | 'gad2';
  score: number;
  severity: string;
  responses: Record<string, number>;
}

export function saveSelfAssessment(payload: SelfAssessmentPayload): Promise<Response> {
  return apiFetch('/api/wellbeing/self-assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export interface WorkSchedulePayload {
  schedule: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
}

export function saveWorkSchedule(payload: WorkSchedulePayload): Promise<Response> {
  return apiFetch('/api/wellbeing/work-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
