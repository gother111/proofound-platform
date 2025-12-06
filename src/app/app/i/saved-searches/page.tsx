'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type SavedSearch = {
  id: string;
  name: string;
  causes: string[] | null;
  valuesTags: string[] | null;
  locationMode: string | null;
  country: string | null;
  city: string | null;
  compMin: number | null;
  compMax: number | null;
  hoursMin: number | null;
  hoursMax: number | null;
  industries: string[] | null;
  alertEnabled: boolean;
  alertThreshold: number | string | null;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
};

type FormState = {
  name: string;
  causes: string;
  valuesTags: string;
  industries: string;
  locationMode: string;
  country: string;
  city: string;
  compMin: string;
  compMax: string;
  hoursMin: string;
  hoursMax: string;
  alertEnabled: boolean;
  alertThreshold: number;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
};

const emptyForm: FormState = {
  name: '',
  causes: '',
  valuesTags: '',
  industries: '',
  locationMode: '',
  country: '',
  city: '',
  compMin: '',
  compMax: '',
  hoursMin: '',
  hoursMax: '',
  alertEnabled: true,
  alertThreshold: 0.75,
  alertFrequency: 'immediate',
};

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const filtersPreview = useMemo(() => {
    const parts: string[] = [];
    if (form.locationMode) parts.push(form.locationMode);
    if (form.country) parts.push(form.country);
    if (form.city) parts.push(form.city);
    if (form.causes) parts.push(`Causes: ${form.causes}`);
    if (form.valuesTags) parts.push(`Values: ${form.valuesTags}`);
    if (form.industries) parts.push(`Industries: ${form.industries}`);
    return parts.join(' · ');
  }, [form]);

  async function loadSavedSearches() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/saved-searches');
      if (!response.ok) {
        throw new Error('Failed to fetch saved searches');
      }
      const data = await response.json();
      setSavedSearches(data.savedSearches ?? []);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load saved searches');
    } finally {
      setIsLoading(false);
    }
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toArray(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('Please add a name for the saved search');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      causes: toArray(form.causes),
      valuesTags: toArray(form.valuesTags),
      industries: toArray(form.industries),
      locationMode: form.locationMode || undefined,
      country: form.country || undefined,
      city: form.city || undefined,
      compMin: form.compMin ? Number(form.compMin) : undefined,
      compMax: form.compMax ? Number(form.compMax) : undefined,
      hoursMin: form.hoursMin ? Number(form.hoursMin) : undefined,
      hoursMax: form.hoursMax ? Number(form.hoursMax) : undefined,
      alertEnabled: form.alertEnabled,
      alertThreshold: form.alertThreshold,
      alertFrequency: form.alertFrequency,
    };

    try {
      const response = await fetch(
        editingId ? `/api/saved-searches/${editingId}` : '/api/saved-searches',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save saved search');
      }

      toast.success(editingId ? 'Saved search updated' : 'Saved search created');
      setForm(emptyForm);
      setEditingId(null);
      await loadSavedSearches();
    } catch (error) {
      console.error(error);
      toast.error('Unable to save saved search');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed');
      toast.success('Saved search deleted');
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Unable to delete saved search');
    }
  }

  function startEdit(search: SavedSearch) {
    setEditingId(search.id);
    setForm({
      name: search.name,
      causes: (search.causes ?? []).join(', '),
      valuesTags: (search.valuesTags ?? []).join(', '),
      industries: (search.industries ?? []).join(', '),
      locationMode: search.locationMode ?? '',
      country: search.country ?? '',
      city: search.city ?? '',
      compMin: search.compMin ? String(search.compMin) : '',
      compMax: search.compMax ? String(search.compMax) : '',
      hoursMin: search.hoursMin ? String(search.hoursMin) : '',
      hoursMax: search.hoursMax ? String(search.hoursMax) : '',
      alertEnabled: search.alertEnabled,
      alertThreshold:
        typeof search.alertThreshold === 'string'
          ? Number(search.alertThreshold)
          : Number(search.alertThreshold ?? 0.75),
      alertFrequency: search.alertFrequency ?? 'immediate',
    });
  }

  async function toggleAlert(search: SavedSearch, value: boolean) {
    try {
      const response = await fetch(`/api/saved-searches/${search.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertEnabled: value }),
      });
      if (!response.ok) throw new Error('Failed to toggle');
      setSavedSearches((prev) =>
        prev.map((item) => (item.id === search.id ? { ...item, alertEnabled: value } : item))
      );
    } catch (error) {
      console.error(error);
      toast.error('Unable to update alert toggle');
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F1] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2D3330]">Saved Searches</h1>
            <p className="text-[#6B6760] mt-1">
              Create filters once and get notified automatically when strong matches appear.
            </p>
          </div>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {editingId ? 'Update search' : 'Save search'}
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#2D3330]">
                {editingId ? 'Edit saved search' : 'New saved search'}
              </h2>
              <p className="text-sm text-[#6B6760]">
                Set your filters and alert preferences. We’ll ping you automatically.
              </p>
            </div>
            {editingId && (
              <Button variant="ghost" onClick={() => setForm(emptyForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Start fresh
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g., Climate remote roles"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div>
              <Label>Location mode</Label>
              <Select
                value={form.locationMode}
                onValueChange={(value) => updateField('locationMode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} />
            </div>

            <div>
              <Label>Causes (comma separated)</Label>
              <Input
                placeholder="climate, education"
                value={form.causes}
                onChange={(e) => updateField('causes', e.target.value)}
              />
            </div>
            <div>
              <Label>Values (comma separated)</Label>
              <Input
                placeholder="equity, transparency"
                value={form.valuesTags}
                onChange={(e) => updateField('valuesTags', e.target.value)}
              />
            </div>

            <div>
              <Label>Industries (comma separated)</Label>
              <Input
                placeholder="climate, health"
                value={form.industries}
                onChange={(e) => updateField('industries', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Comp min</Label>
                <Input
                  type="number"
                  value={form.compMin}
                  onChange={(e) => updateField('compMin', e.target.value)}
                />
              </div>
              <div>
                <Label>Comp max</Label>
                <Input
                  type="number"
                  value={form.compMax}
                  onChange={(e) => updateField('compMax', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Hours min / week</Label>
                <Input
                  type="number"
                  value={form.hoursMin}
                  onChange={(e) => updateField('hoursMin', e.target.value)}
                />
              </div>
              <div>
                <Label>Hours max / week</Label>
                <Input
                  type="number"
                  value={form.hoursMax}
                  onChange={(e) => updateField('hoursMax', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.alertEnabled}
                onCheckedChange={(value) => updateField('alertEnabled', value)}
              />
              <div>
                <Label>Alerts enabled</Label>
                <p className="text-xs text-[#6B6760]">Immediate in-app + email by default</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Match threshold</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.alertThreshold}
                  onChange={(e) => updateField('alertThreshold', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Alert frequency</Label>
                <Select
                  value={form.alertFrequency}
                  onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                    updateField('alertFrequency', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#F7F6F1] px-4 py-3">
            <div>
              <p className="font-medium text-[#2D3330]">Preview</p>
              <p className="text-sm text-[#6B6760]">{filtersPreview || 'No filters set yet'}</p>
            </div>
            <div className="text-sm text-[#6B6760] flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts {form.alertEnabled ? 'on' : 'off'} · Threshold {form.alertThreshold}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#2D3330]">Saved searches</h2>
            <Button variant="outline" onClick={loadSavedSearches} disabled={isLoading}>
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-[#6B6760]">Loading saved searches...</p>
          ) : savedSearches.length === 0 ? (
            <div className="text-sm text-[#6B6760] space-y-2">
              <p>No saved searches yet.</p>
              <p>Create one above to get proactive alerts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border rounded-lg bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#2D3330]">{search.name}</p>
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                        {search.alertFrequency}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6760]">
                      {(search.causes ?? []).join(', ') || 'Any causes'} ·{' '}
                      {(search.valuesTags ?? []).join(', ') || 'Any values'}
                    </p>
                    <p className="text-xs text-[#8B857C]">
                      Threshold{' '}
                      {(typeof search.alertThreshold === 'string'
                        ? Number(search.alertThreshold)
                        : (search.alertThreshold ?? 0.75)
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={search.alertEnabled}
                        onCheckedChange={(value) => toggleAlert(search, value)}
                      />
                      <span className="text-sm text-[#2D3330]">
                        {search.alertEnabled ? 'Alerts on' : 'Alerts off'}
                      </span>
                    </div>
                    <Button variant="outline" onClick={() => startEdit(search)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(search.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
