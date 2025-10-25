'use client';

import React, { useState } from 'react';
import { Shield, Download, Trash2, Eye, Lock } from 'lucide-react';
import { ToggleControl } from './ToggleControl';
import { Button } from '../../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';

type ToggleLabel = 'Screening questionnaires' | 'Encrypted journaling' | 'Anonymous analytics';

type TooltipCopy = Record<ToggleLabel, string>;

const tooltipCopy: TooltipCopy = {
  'Screening questionnaires':
    'Used to surface appropriate practices and detect elevated risk states',
  'Encrypted journaling': 'Your journal entries are encrypted before leaving your device',
  'Anonymous analytics':
    'Helps us understand what practices are helpful; no personal data collected',
};

export function PrivacyConsole() {
  const [screeningEnabled, setScreeningEnabled] = useState(true);
  const [journalingEnabled, setJournalingEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExport = () => {
    alert('Your data would be exported');
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    alert('All data would be deleted');
    setShowDeleteDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-[var(--color-primary)] bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <div>
          <h2 className="mb-2 text-[var(--color-text-primary)]">Privacy Console</h2>
          <p className="text-[var(--color-text-secondary)]">
            Control what data you share and how Zen Hub works for you.
          </p>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
        <div className="flex gap-4">
          <Lock className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h3 className="mb-2 text-green-900 dark:text-green-100">Is my employer seeing this?</h3>
            <p className="text-lg text-green-800 dark:text-green-200 mb-2">No. Never.</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your Zen Hub activity is completely private. Proofound does not share any wellness
              data with your employer or organization.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[var(--color-text-primary)]">What we collect</h3>

        <ToggleControl
          label="Screening questionnaires"
          description="WHO-5, PHQ-9, GAD-7 for risk detection"
          checked={screeningEnabled}
          onChange={setScreeningEnabled}
        />

        <ToggleControl
          label="Encrypted journaling"
          description="End-to-end encrypted, never readable by Proofound"
          checked={journalingEnabled}
          onChange={setJournalingEnabled}
        />

        <ToggleControl
          label="Anonymous analytics"
          description="Events-only (no content): practice started, completed, skipped"
          checked={analyticsEnabled}
          onChange={setAnalyticsEnabled}
        />

        <div className="text-xs text-[var(--color-text-tertiary)] space-y-1">
          {Object.entries(tooltipCopy).map(([label, copy]) => (
            <p key={label}>
              <span className="font-medium text-[var(--color-text-secondary)]">{label}:</span>{' '}
              {copy}
            </p>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-[var(--color-primary)]" />
          <div className="flex-1">
            <span className="text-[var(--color-text-primary)]">Tracker-free</span>
            <p className="text-sm text-[var(--color-text-secondary)]">
              No advertising trackers, no third-party cookies, no surveillance.
            </p>
          </div>
          <div className="px-3 py-1 bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] rounded-full text-xs">
            Verified
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-6 border-t border-[var(--color-border)]">
        <h3 className="text-[var(--color-text-primary)]">Your data</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={handleExport} variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Export all data
          </Button>

          <Button
            onClick={handleDelete}
            variant="outline"
            className="w-full justify-start text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete all data
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all Zen Hub data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your screening responses, safety plan, pinned practices,
              and journal entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
