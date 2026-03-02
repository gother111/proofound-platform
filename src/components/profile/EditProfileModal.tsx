import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BasicInfo } from '@/types/profile';
import { FormErrorBoundary } from '@/components/ErrorBoundary';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basicInfo: BasicInfo;
  onSave: (updates: Partial<BasicInfo>) => Promise<void> | void;
}

export function EditProfileModal({ open, onOpenChange, basicInfo, onSave }: EditProfileModalProps) {
  const isDesktop = useResponsiveModalMode(open);
  const [name, setName] = useState(basicInfo.name);
  const [tagline, setTagline] = useState(basicInfo.tagline || '');
  const [location, setLocation] = useState(basicInfo.location || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const wasOpenRef = useRef(open);

  // Reset form only on the open edge so parent rerenders don't clobber in-progress input.
  useEffect(() => {
    const openedNow = open && !wasOpenRef.current;

    if (openedNow) {
      setName(basicInfo.name);
      setTagline(basicInfo.tagline || '');
      setLocation(basicInfo.location || '');
      setErrors({});
    }

    wasOpenRef.current = open;
  }, [open, basicInfo.name, basicInfo.tagline, basicInfo.location]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (tagline.length > 200) {
      newErrors.tagline = 'Tagline must be 200 characters or less';
    }

    if (location.length > 100) {
      newErrors.location = 'Location must be 100 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!validate()) return;

    await Promise.resolve(
      onSave({
        name: name.trim(),
        tagline: tagline.trim() || null,
        location: location.trim() || null,
      })
    );
    onOpenChange(false);
  };

  const taglineCharsLeft = 200 - tagline.length;

  const formContent = (
    <FormErrorBoundary>
      <div className="space-y-4 py-4 px-4 md:px-0">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="Your full name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tagline">Tagline</Label>
            <span
              className={`text-xs ${
                taglineCharsLeft < 0
                  ? 'text-red-500'
                  : taglineCharsLeft < 20
                    ? 'text-yellow-600'
                    : 'text-muted-foreground'
              }`}
            >
              {taglineCharsLeft} characters left
            </span>
          </div>
          <textarea
            id="tagline"
            value={tagline}
            onChange={(e) => {
              setTagline(e.target.value);
              setErrors((prev) => ({ ...prev, tagline: '' }));
            }}
            placeholder="A brief statement that captures who you are and what you care about"
            className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.tagline ? 'border-red-500' : ''
            }`}
            maxLength={200}
          />
          {errors.tagline && <p className="text-xs text-red-500">{errors.tagline}</p>}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setErrors((prev) => ({ ...prev, location: '' }));
            }}
            placeholder="City, Country"
            className={errors.location ? 'border-red-500' : ''}
          />
          {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
        </div>
      </div>
    </FormErrorBoundary>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your basic information</DialogDescription>
            </DialogHeader>

            {formContent}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSave}>
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit Profile</DrawerTitle>
            <DrawerDescription>Update your basic information</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto">{formContent}</div>
          <DrawerFooter className="pt-2">
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
