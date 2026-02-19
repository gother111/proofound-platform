/**
 * Enhanced Data Import Dialog
 *
 * Implements PRD requirements:
 * - JSON schema validation
 * - Data preview before import
 * - Conflict resolution (merge vs replace)
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileJson,
  Eye,
  RefreshCw,
  Merge,
} from 'lucide-react';
import { toast } from 'sonner';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: any;
  summary?: {
    profile: number;
    skills: number;
    experiences: number;
    volunteering: number;
    projects: number;
  };
}

interface EnhancedDataImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnhancedDataImportDialog({ open, onOpenChange }: EnhancedDataImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast.error('Invalid file type. Please upload a .json file.');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Import files must be less than 10MB.');
      e.target.value = '';
      return;
    }

    try {
      setIsProcessing(true);

      // Read and parse file
      const text = await file.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (parseError) {
        toast.error('Invalid JSON file', {
          description: 'The file contains invalid JSON syntax.',
        });
        e.target.value = '';
        return;
      }

      // Validate schema
      const validation = validateImportData(data);

      if (!validation.valid) {
        setValidationResult(validation);
        toast.error('Validation failed', {
          description: `Found ${validation.errors.length} error(s) in the import file.`,
        });
        setStep('preview'); // Show preview with errors
        return;
      }

      setValidationResult(validation);
      setStep('preview');
      toast.success('File validated successfully');
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const validateImportData = (data: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required top-level fields
    if (!data.exportVersion) {
      warnings.push('Missing export version. This may be an old format.');
    }

    if (!data.exportedAt) {
      warnings.push('Missing export timestamp.');
    }

    // Validate profile data
    if (!data.profile) {
      errors.push('Missing profile data');
    } else {
      if (data.profile.displayName && typeof data.profile.displayName !== 'string') {
        errors.push('Invalid displayName type');
      }
      if (data.profile.mission && data.profile.mission.length > 300) {
        warnings.push('Mission statement exceeds recommended 300 character limit');
      }
      if (data.profile.vision && data.profile.vision.length > 300) {
        warnings.push('Vision statement exceeds recommended 300 character limit');
      }
    }

    // Validate skills array
    if (data.skills && !Array.isArray(data.skills)) {
      errors.push('Skills must be an array');
    } else if (data.skills) {
      data.skills.forEach((skill: any, index: number) => {
        if (!skill.name || typeof skill.name !== 'string') {
          errors.push(`Skill at index ${index} has invalid or missing name`);
        }
      });
    }

    // Validate experiences array
    if (data.experiences && !Array.isArray(data.experiences)) {
      errors.push('Experiences must be an array');
    }

    // Validate volunteering array
    if (data.volunteering && !Array.isArray(data.volunteering)) {
      errors.push('Volunteering must be an array');
    }

    // Calculate summary
    const summary = {
      profile: data.profile ? 1 : 0,
      skills: data.skills?.length || 0,
      experiences: data.experiences?.length || 0,
      volunteering: data.volunteering?.length || 0,
      projects: data.projects?.length || 0,
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      data,
      summary,
    };
  };

  const handleImport = async () => {
    if (!validationResult?.data) return;

    try {
      setIsProcessing(true);
      setStep('importing');

      const response = await fetch('/api/user/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: validationResult.data,
          mode: importMode,
          consentAcknowledged: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const result = await response.json();

      toast.success('Data imported successfully', {
        description: `Imported ${result.imported.skills} skills, ${result.imported.experiences} experiences`,
      });

      // Reload page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setValidationResult(null);
    setImportMode('merge');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {step === 'upload' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-['Crimson_Pro']">
                Import Profile Data
              </DialogTitle>
              <DialogDescription>
                Upload a JSON export file to restore your profile data
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Upload Area */}
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-[#F7F6F1] dark:bg-background/50 hover:bg-[#E8E6DD] dark:hover:bg-background border-[#D8D2C8] dark:border-border"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-4 text-[#6B6760]" />
                  <p className="mb-2 text-sm text-[#2D3330] dark:text-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                    JSON files only (MAX. 10MB)
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
              </label>

              <Alert className="border-blue-300 bg-blue-50">
                <FileJson className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  <strong>What can be imported:</strong> Profile information, skills, work
                  experiences, volunteering, projects, and education history. Exports must be from
                  Proofound.
                </AlertDescription>
              </Alert>
            </div>
          </>
        )}

        {step === 'preview' && validationResult && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-['Crimson_Pro']">Preview Import</DialogTitle>
              <DialogDescription>Review the data before importing</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Validation Status */}
              {validationResult.valid ? (
                <Alert className="border-green-300 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Validation passed!</strong> The file is ready to import.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-300 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <strong>{validationResult.errors.length} error(s) found:</strong>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {validationResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <Alert className="border-yellow-300 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>Warnings:</strong>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {validationResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Data Summary */}
              {validationResult.summary && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Import Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(validationResult.summary).map(([key, count]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-[#6B6760] dark:text-muted-foreground capitalize">
                            {key}
                          </span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Mode Selection */}
              {validationResult.valid && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Merge className="w-4 h-4" />
                      Import Mode
                    </h3>
                    <RadioGroup
                      value={importMode}
                      onValueChange={(val) => setImportMode(val as 'replace' | 'merge')}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-[#F7F6F1] dark:hover:bg-background/50">
                          <RadioGroupItem value="merge" id="merge" />
                          <Label htmlFor="merge" className="flex-1 cursor-pointer">
                            <div className="font-medium">Merge (Recommended)</div>
                            <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                              Keep existing data and add new items. Existing items with the same ID
                              will be updated.
                            </p>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-[#F7F6F1] dark:hover:bg-background/50">
                          <RadioGroupItem value="replace" id="replace" />
                          <Label htmlFor="replace" className="flex-1 cursor-pointer">
                            <div className="font-medium text-red-600 dark:text-red-400">
                              Replace All
                            </div>
                            <p className="text-xs text-[#6B6760] dark:text-muted-foreground">
                              Delete all existing data and replace with imported data. This cannot
                              be undone.
                            </p>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validationResult.valid || isProcessing}
                className="bg-[#1C4D3A] text-white"
              >
                {isProcessing ? 'Importing...' : `Import Data (${importMode})`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'importing' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-['Crimson_Pro']">Importing...</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin text-[#1C4D3A] mb-4" />
              <p className="text-[#6B6760] dark:text-muted-foreground">
                Please wait while we import your data...
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
