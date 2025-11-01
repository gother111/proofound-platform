'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ImportResult {
  profile: number;
  skills: number;
  experiences: number;
  volunteering: number;
}

export function DataImportButton() {
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast.error('Invalid file type', {
        description: 'Please upload a .json file exported from Proofound',
      });
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Import files must be less than 5MB',
      });
      e.target.value = '';
      return;
    }

    setPendingFile(file);
    setShowConfirm(true);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;

    try {
      setIsImporting(true);
      setShowConfirm(false);

      // Read file
      const text = await pendingFile.text();
      const data = JSON.parse(text);

      // Send to API
      const response = await fetch('/api/user/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Import failed');
      }

      // Show success with details
      const imported = result.imported as ImportResult;
      const total = imported.profile + imported.skills + imported.experiences + imported.volunteering;

      toast.success('Data imported successfully', {
        description: `Restored ${imported.skills} skills, ${imported.experiences} experiences, ${imported.volunteering} volunteering entries`,
        icon: <CheckCircle className="h-4 w-4" />,
      });

      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Import error:', error);

      let errorMessage = 'An unexpected error occurred';

      if (error instanceof SyntaxError) {
        errorMessage = 'Invalid JSON format. Please ensure the file is not corrupted.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error('Import failed', {
        description: errorMessage,
        icon: <XCircle className="h-4 w-4" />,
      });
    } finally {
      setIsImporting(false);
      setPendingFile(null);
    }
  };

  const handleCancelImport = () => {
    setShowConfirm(false);
    setPendingFile(null);
  };

  return (
    <>
      <div className="space-y-2">
        <input
          type="file"
          accept=".json"
          id="data-import"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isImporting}
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('data-import')?.click()}
          disabled={isImporting}
          className="w-full sm:w-auto"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isImporting ? 'Importing...' : 'Import Data'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Restore your profile from a previous export (JSON file)
        </p>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Confirm Data Import
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                This will <strong>replace</strong> your current profile data with the imported data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Profile information (mission, vision, values, causes)</li>
                <li>All skills and their levels</li>
                <li>Work experiences</li>
                <li>Volunteering entries</li>
              </ul>
              <p className="text-orange-600 font-medium">
                ⚠️ This action cannot be undone. Consider exporting your current data first.
              </p>
              {pendingFile && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium">File: {pendingFile.name}</p>
                  <p className="text-muted-foreground">
                    Size: {(pendingFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelImport}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Confirm Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
