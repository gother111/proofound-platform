import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile, updateIndividualProfile } from '@/actions/profile';

export const runtime = 'nodejs';

export default async function IndividualProfilePage() {
  const user = await requireAuth();

  // Fetch individual profile
  const [profile] = await db
    .select()
    .from(individualProfiles)
    .where(eq(individualProfiles.userId, user.id))
    .limit(1);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
          Edit Your Profile
        </h1>
        <p className="text-neutral-dark-600">
          Update your information to help others connect with you
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile as any} className="space-y-6">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={user.displayName || ''}
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                name="handle"
                defaultValue={user.handle || ''}
                placeholder="your-username"
              />
              <p className="text-xs text-neutral-dark-500 mt-1">
                Your unique identifier (letters, numbers, hyphens, underscores)
              </p>
            </div>

            <Button type="submit">Save Basic Info</Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateIndividualProfile as any} className="space-y-6">
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                name="headline"
                defaultValue={profile?.headline || ''}
                placeholder="Your professional headline"
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={profile?.bio || ''}
                placeholder="Tell us about yourself"
                className="flex min-h-[120px] w-full rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base transition-colors placeholder:text-neutral-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={2000}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={profile?.location || ''}
                placeholder="City, Country"
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                name="skills"
                defaultValue={profile?.skills?.join(', ') || ''}
                placeholder="JavaScript, Design, Project Management"
              />
            </div>

            <div>
              <Label htmlFor="visibility">Profile Visibility</Label>
              <select
                id="visibility"
                name="visibility"
                defaultValue={profile?.visibility || 'network'}
                className="flex h-11 w-full rounded-lg border border-neutral-light-300 bg-white px-4 py-2 text-base"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="network">Network - Only connections can view</option>
                <option value="private">Private - Only you can view</option>
              </select>
            </div>

            <Button type="submit">Save Profile Details</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
