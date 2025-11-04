'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface StakeholderInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

const AVAILABLE_SECTIONS = [
  { id: 'projects', label: 'Projects', description: 'Key projects and their outcomes' },
  { id: 'partnerships', label: 'Partnerships', description: 'Strategic partnerships and collaborations' },
  { id: 'impact', label: 'Impact Stories', description: 'Real-world impact and success stories' },
  { id: 'culture', label: 'Culture & Values', description: 'Organizational culture and work environment' },
];

export function StakeholderInviteDialog({ open, onOpenChange, orgId }: StakeholderInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState(14);
  const [sending, setSending] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSections.length === 0) {
      toast.error('Please select at least one section');
      return;
    }

    try {
      setSending(true);

      const response = await fetch('/api/assignments/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          stakeholderEmail: email,
          stakeholderName: name || null,
          assignedSections: selectedSections,
          message: message || null,
          expiryDays,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      const data = await response.json();
      setInvitationUrl(data.invitationUrl);
      toast.success('Invitation sent successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCopyUrl = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      toast.success('Link copied to clipboard');
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setMessage('');
    setSelectedSections([]);
    setExpiryDays(14);
    setInvitationUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-['Crimson_Pro']">
            Invite Stakeholder
          </DialogTitle>
        </DialogHeader>

        {invitationUrl ? (
          // Success state
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">
                Invitation created successfully! Share this link with the stakeholder:
              </p>
              <div className="flex items-center gap-2">
                <Input value={invitationUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="bg-proofound-forest hover:bg-proofound-forest/90">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Stakeholder Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stakeholder@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="name">Stakeholder Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label>Assign Sections *</Label>
              <div className="space-y-2 mt-2">
                {AVAILABLE_SECTIONS.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <Checkbox
                      id={section.id}
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => handleSectionToggle(section.id)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={section.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {section.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal note for the stakeholder..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="expiryDays">Link Expiry (Days)</Label>
              <Input
                id="expiryDays"
                type="number"
                min="1"
                max="30"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link will expire in {expiryDays} days
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={sending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sending}
                className="bg-proofound-forest hover:bg-proofound-forest/90"
              >
                {sending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
