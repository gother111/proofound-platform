'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type OrgInviteFormState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
};

const INITIAL_STATE: OrgInviteFormState = {
  status: 'idle',
  message: null,
};

function InviteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Sending invite…' : 'Send collaborator invite'}
    </Button>
  );
}

export function OrgCollaboratorInviteCard({
  action,
}: {
  action: (state: OrgInviteFormState, formData: FormData) => Promise<OrgInviteFormState>;
}) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          Invite one internal collaborator without reopening the broader team surface. Launch roles
          stay limited to manager or reviewer.
        </p>
        <p>
          The invitee receives a single-use acceptance link and joins the org only after accepting
          it.
        </p>
      </div>

      {state.status !== 'idle' && state.message ? (
        <Alert variant={state.status === 'error' ? 'destructive' : 'default'}>
          {state.status === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          <AlertTitle>{state.status === 'success' ? 'Invite sent' : 'Invite blocked'}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="space-y-4">
        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="reviewer@yourorg.com"
          label="Collaborator email"
          isRequired
          helperText="Use a work email for the reviewer or manager you want to add."
        />

        <div className="space-y-2">
          <Label htmlFor="invite-role">Launch role</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              id="invite-role"
              name="role"
              required
              defaultValue="org_reviewer"
              className="flex h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="org_reviewer">Reviewer</option>
              <option value="org_manager">Manager</option>
            </select>
          </div>
        </div>

        <InviteSubmitButton />
      </form>
    </div>
  );
}
