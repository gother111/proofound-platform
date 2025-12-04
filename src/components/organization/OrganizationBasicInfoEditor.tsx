'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateOrganization } from '@/actions/org';
import { useToast } from '@/hooks/use-toast';

interface OrganizationBasicInfoEditorProps {
    org: any;
    canEdit: boolean;
}

export function OrganizationBasicInfoEditor({ org, canEdit }: OrganizationBasicInfoEditorProps) {
    const { toast } = useToast();
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsPending(true);
        try {
            await updateOrganization(org.id, formData);
            toast({
                title: 'Organization updated',
                description: 'Basic information has been saved successfully.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update organization.',
                variant: 'destructive',
            });
        } finally {
            setIsPending(false);
        }
    }

    if (!canEdit) return null;

    return (
        <Card className="border-proofound-stone dark:border-border rounded-2xl">
            <CardHeader>
                <CardTitle className="font-display text-proofound-charcoal dark:text-foreground">
                    Edit Basic Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="displayName" className="text-proofound-charcoal dark:text-foreground">
                            Organization Name
                        </Label>
                        <Input
                            id="displayName"
                            name="displayName"
                            defaultValue={org.displayName}
                            placeholder="Organization Name"
                            className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
                        />
                    </div>

                    <div>
                        <Label htmlFor="legalName" className="text-proofound-charcoal dark:text-foreground">
                            Legal Name (Optional)
                        </Label>
                        <Input
                            id="legalName"
                            name="legalName"
                            defaultValue={org.legalName || ''}
                            placeholder="Legal company name"
                            className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
                        />
                    </div>

                    <div>
                        <Label htmlFor="mission" className="text-proofound-charcoal dark:text-foreground">
                            Mission Statement
                        </Label>
                        <textarea
                            id="mission"
                            name="mission"
                            defaultValue={org.mission || ''}
                            placeholder="Describe your organization's mission and goals"
                            className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
                            maxLength={2000}
                        />
                    </div>

                    <div>
                        <Label htmlFor="vision" className="text-proofound-charcoal dark:text-foreground">
                            Vision Statement
                        </Label>
                        <textarea
                            id="vision"
                            name="vision"
                            defaultValue={org.vision || ''}
                            placeholder="Describe your organization's long-term vision and aspirations"
                            className="flex min-h-[120px] w-full rounded-lg border border-proofound-stone dark:border-border bg-white dark:bg-background px-4 py-2 text-base transition-colors placeholder:text-proofound-charcoal/40 dark:placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:border-proofound-forest disabled:cursor-not-allowed disabled:opacity-50 text-proofound-charcoal dark:text-foreground"
                            maxLength={2000}
                        />
                        <p className="text-xs text-proofound-charcoal/60 dark:text-muted-foreground/60 mt-1">
                            Max 300 characters recommended
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="website" className="text-proofound-charcoal dark:text-foreground">
                            Website
                        </Label>
                        <Input
                            id="website"
                            name="website"
                            type="url"
                            defaultValue={org.website || ''}
                            placeholder="https://your-organization.com"
                            className="border-proofound-stone dark:border-border focus-visible:ring-proofound-forest"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="bg-proofound-forest hover:bg-proofound-forest/90 text-white"
                        disabled={isPending}
                    >
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
