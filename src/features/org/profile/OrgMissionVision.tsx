'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { patchOrganization } from '@/features/org/actions';

export function OrgMissionVision({
  orgId,
  mission,
  vision,
  canEdit,
}: {
  orgId: string;
  mission: string | null;
  vision: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState<'mission' | 'vision' | null>(null);
  const [missionValue, setMissionValue] = useState(mission ?? '');
  const [visionValue, setVisionValue] = useState(vision ?? '');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMissionValue(mission ?? '');
  }, [mission]);

  useEffect(() => {
    setVisionValue(vision ?? '');
  }, [vision]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Record<string, unknown> = {};
    if (active === 'mission') {
      payload.mission = missionValue.trim() ? missionValue.trim() : null;
    }
    if (active === 'vision') {
      payload.vision = visionValue.trim() ? visionValue.trim() : null;
    }

    startTransition(async () => {
      await patchOrganization(orgId, payload);
      router.refresh();
      setActive(null);
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Mission</h3>
            <p className="text-sm text-muted-foreground">
              What drives your organization? Share the change you want to create in the world.
            </p>
          </div>
          {canEdit && (
            <Sheet
              open={active === 'mission'}
              onOpenChange={(open) => setActive(open ? 'mission' : null)}
            >
              <SheetTrigger asChild>
                <Button variant="secondary">
                  {mission ? 'Edit mission' : 'Add mission statement'}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Edit mission</SheetTitle>
                </SheetHeader>
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="mission" className="text-sm font-medium">
                      Mission
                    </label>
                    <textarea
                      id="mission"
                      className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={missionValue}
                      onChange={(event) => setMissionValue(event.target.value)}
                      placeholder="Describe the change you exist to create."
                    />
                  </div>
                  <SheetFooter>
                    <Button type="submit" disabled={isPending}>
                      Save
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          )}
        </div>
        <p className="text-base text-foreground">{mission ?? 'Add mission statement'}</p>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Vision</h3>
            <p className="text-sm text-muted-foreground">
              Where do you see the world when your mission succeeds? Paint a picture of your
              long-term vision.
            </p>
          </div>
          {canEdit && (
            <Sheet
              open={active === 'vision'}
              onOpenChange={(open) => setActive(open ? 'vision' : null)}
            >
              <SheetTrigger asChild>
                <Button variant="secondary">
                  {vision ? 'Edit vision' : 'Add vision statement'}
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Edit vision</SheetTitle>
                </SheetHeader>
                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="vision" className="text-sm font-medium">
                      Vision
                    </label>
                    <textarea
                      id="vision"
                      className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visionValue}
                      onChange={(event) => setVisionValue(event.target.value)}
                      placeholder="Imagine the future you are working toward."
                    />
                  </div>
                  <SheetFooter>
                    <Button type="submit" disabled={isPending}>
                      Save
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          )}
        </div>
        <p className="text-base text-foreground">{vision ?? 'Add vision statement'}</p>
      </Card>
    </div>
  );
}
