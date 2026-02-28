'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type VisibilityFlags = {
  header: boolean;
  proofBar: boolean;
  workEmail: boolean;
  linkedin: boolean;
  identity: boolean;
  counts: boolean;
  skills: boolean;
  bio: boolean;
  contact: boolean;
};

const defaults: VisibilityFlags = {
  header: true,
  proofBar: true,
  workEmail: false,
  linkedin: true,
  identity: true,
  counts: true,
  skills: true,
  bio: true,
  contact: false,
};

export function PortfolioVisibilityCard() {
  const [flags, setFlags] = useState<VisibilityFlags>(defaults);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/portfolio/visibility');
        if (res.ok) {
          const data = await res.json();
          if (data.visibility) setFlags(data.visibility);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const toggle = (key: keyof VisibilityFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch (e) {
      console.error(e);
      alert('Could not save visibility. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="bento">
      <CardHeader>
        <CardTitle>Public Portfolio Visibility</CardTitle>
        <CardDescription>Controls what is shown on your public portfolio page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <VisibilityRow
              label="Header (name, handle, headline)"
              checked={flags.header}
              onCheckedChange={() => toggle('header')}
            />
            <VisibilityRow
              label="Proof bar block"
              checked={flags.proofBar}
              onCheckedChange={() => toggle('proofBar')}
            />
            <VisibilityRow
              label="Identity badge"
              checked={flags.identity}
              onCheckedChange={() => toggle('identity')}
            />
            <VisibilityRow
              label="Work email"
              checked={flags.workEmail}
              onCheckedChange={() => toggle('workEmail')}
            />
            <VisibilityRow
              label="LinkedIn confidence"
              checked={flags.linkedin}
              onCheckedChange={() => toggle('linkedin')}
            />
            <VisibilityRow
              label="Counts (proofs, verifications, attestations)"
              checked={flags.counts}
              onCheckedChange={() => toggle('counts')}
            />
            <VisibilityRow
              label="Skills snapshot"
              checked={flags.skills}
              onCheckedChange={() => toggle('skills')}
            />
            <VisibilityRow
              label="Bio/About"
              checked={flags.bio}
              onCheckedChange={() => toggle('bio')}
            />
            <VisibilityRow
              label="Contact section"
              checked={flags.contact}
              onCheckedChange={() => toggle('contact')}
            />

            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save visibility'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function VisibilityRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
      <Label className="text-sm text-slate-800">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
