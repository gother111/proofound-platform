'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Mail, Loader2, AlertCircle } from 'lucide-react';

interface WorkEmailVerificationFormProps {
  onSuccess: () => void;
}

interface Organization {
  id: string;
  displayName: string;
  slug: string;
}

export function WorkEmailVerificationForm({ onSuccess }: WorkEmailVerificationFormProps) {
  const [workEmail, setWorkEmail] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('none');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const response = await fetch('/api/organizations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      // Don't show error, just allow optional org selection
    } finally {
      setLoadingOrgs(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      setEmailError('Work email is required');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    // Check for common free email providers
    const freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'protonmail.com', 'icloud.com', 'aol.com', 'mail.com'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    if (freeEmailDomains.includes(domain)) {
      setEmailError('Please use your company/organization email, not a personal email');
      return false;
    }
    
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWorkEmail(value);
    if (emailError) {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(workEmail)) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verification/work-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workEmail: workEmail.trim().toLowerCase(),
          orgId: selectedOrgId && selectedOrgId !== 'none' ? selectedOrgId : null,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }
      
      setSuccess(true);
      
      // Call onSuccess after showing success message briefly
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          <strong>Verification email sent!</strong>
          <br />
          Please check your inbox at <strong>{workEmail}</strong> and click the verification link.
          The link will expire in 24 hours.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="work-email" className="text-sm font-medium">
          Work Email Address *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="work-email"
            type="email"
            placeholder="you@company.com"
            value={workEmail}
            onChange={handleEmailChange}
            onBlur={() => validateEmail(workEmail)}
            className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
            disabled={submitting}
            required
          />
        </div>
        {emailError && (
          <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Use your company or organization email address, not a personal email.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization" className="text-sm font-medium">
          Organization (Optional)
        </Label>
        <Select
          value={selectedOrgId}
          onValueChange={setSelectedOrgId}
          disabled={submitting || loadingOrgs}
        >
          <SelectTrigger id="organization">
            <SelectValue placeholder={loadingOrgs ? "Loading..." : "Select your organization"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None - I&apos;ll link later</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Link your profile to an organization. You can change this later.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-proofound-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-proofound-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending verification email...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Send Verification Email
            </>
          )}
        </button>
      </div>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>How it works:</strong>
          <br />
          1. We&apos;ll send a verification link to your work email
          <br />
          2. Click the link to verify you own this email
          <br />
          3. Your profile will be marked as verified
        </p>
      </div>
    </form>
  );
}

