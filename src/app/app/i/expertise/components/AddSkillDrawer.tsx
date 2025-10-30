'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// L1 Domain colors (matching L1Grid)
const DOMAIN_COLORS: Record<number, { bg: string; border: string; text: string; icon: string }> = {
  1: { bg: 'bg-[#EEF1EA]', border: 'border-[#7A9278]', text: 'text-[#4A5943]', icon: '🌍' }, // U - Universal
  2: { bg: 'bg-[#FFF4E6]', border: 'border-[#D4A574]', text: 'text-[#8B6F47]', icon: '⚙️' }, // F - Functional
  3: { bg: 'bg-[#E8F3F8]', border: 'border-[#6B9AB8]', text: 'text-[#3E5C73]', icon: '🔧' }, // T - Tools
  4: { bg: 'bg-[#F5EEF8]', border: 'border-[#9B7BA8]', text: 'text-[#6B4C7A]', icon: '🗣️' }, // L - Languages
  5: { bg: 'bg-[#FFF0F0]', border: 'border-[#C76B4A]', text: 'text-[#8B4A36]', icon: '📋' }, // M - Methods
  6: { bg: 'bg-[#F0F8F0]', border: 'border-[#6B9B6B]', text: 'text-[#3E5C3E]', icon: '🎯' }, // D - Domain
};

const LEVEL_LABELS = [
  { value: 1, label: 'Novice', description: 'Learning the basics' },
  { value: 2, label: 'Competent', description: 'Can work independently' },
  { value: 3, label: 'Proficient', description: 'Experienced practitioner' },
  { value: 4, label: 'Advanced', description: 'Deep expertise' },
  { value: 5, label: 'Expert', description: 'Recognized authority' },
];

interface L1Domain {
  catId: number;
  slug: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
}

interface L2Category {
  subcatId: number;
  catId: number;
  slug: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
}

interface L3Subcategory {
  l3Id: number;
  subcatId: number;
  slug: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
}

interface L4Skill {
  code: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
}

interface AddSkillDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: L1Domain[];
  onSkillAdded: () => void;
}

export function AddSkillDrawer({
  open,
  onOpenChange,
  domains,
  onSkillAdded,
}: AddSkillDrawerProps) {
  const [step, setStep] = useState(1);
  const [selectedL1, setSelectedL1] = useState<L1Domain | null>(null);
  const [selectedL2, setSelectedL2] = useState<L2Category | null>(null);
  const [selectedL3, setSelectedL3] = useState<L3Subcategory | null>(null);
  const [selectedL4, setSelectedL4] = useState<L4Skill | null>(null);
  
  // Step 2 data
  const [l2Categories, setL2Categories] = useState<L2Category[]>([]);
  const [l2Search, setL2Search] = useState('');
  const [l2Loading, setL2Loading] = useState(false);
  
  // Step 3 data
  const [l3Subcategories, setL3Subcategories] = useState<L3Subcategory[]>([]);
  const [l3Search, setL3Search] = useState('');
  const [l3Loading, setL3Loading] = useState(false);
  
  // Step 4: L4 skill details
  const [l4Name, setL4Name] = useState('');
  const [level, setLevel] = useState(2);
  const [lastUsedDate, setLastUsedDate] = useState('');
  const [relevance, setRelevance] = useState<'current' | 'emerging' | 'obsolete'>('current');
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset drawer state when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSelectedL1(null);
        setSelectedL2(null);
        setSelectedL3(null);
        setSelectedL4(null);
        setL2Categories([]);
        setL3Subcategories([]);
        setL4Name('');
        setLevel(2);
        setLastUsedDate('');
        setRelevance('current');
        setProofUrl('');
        setProofNotes('');
        setL2Search('');
        setL3Search('');
      }, 300);
    }
  }, [open]);

  const fetchL2Categories = useCallback(async () => {
    if (!selectedL1) return;
    
    setL2Loading(true);
    try {
      // Map cat_id to L1 code (U/F/T/L/M/D)
      const l1CodeMap: Record<number, string> = {
        1: 'U', // Universal
        2: 'F', // Functional
        3: 'T', // Tools
        4: 'L', // Languages
        5: 'M', // Methods
        6: 'D', // Domain
      };
      const l1Code = l1CodeMap[selectedL1.catId];
      
      const response = await fetch(`/api/expertise/taxonomy?l1=${l1Code}`);
      if (response.ok) {
        const data = await response.json();
        setL2Categories(data.l2_categories || []);
      }
    } catch (error) {
      console.error('Error fetching L2 categories:', error);
    } finally {
      setL2Loading(false);
    }
  }, [selectedL1]);

  const fetchL3Subcategories = useCallback(async () => {
    if (!selectedL2) return;
    
    setL3Loading(true);
    try {
      // Use L2 slug as the API parameter
      const response = await fetch(`/api/expertise/taxonomy?l2=${selectedL2.slug}`);
      if (response.ok) {
        const data = await response.json();
        setL3Subcategories(data.l3_subcategories || []);
      }
    } catch (error) {
      console.error('Error fetching L3 subcategories:', error);
    } finally {
      setL3Loading(false);
    }
  }, [selectedL2]);

  // Fetch L2 categories when L1 is selected
  useEffect(() => {
    if (selectedL1 && step === 2) {
      fetchL2Categories();
    }
  }, [selectedL1, step, fetchL2Categories]);

  // Fetch L3 subcategories when L2 is selected
  useEffect(() => {
    if (selectedL2 && step === 3) {
      fetchL3Subcategories();
    }
  }, [selectedL2, step, fetchL3Subcategories]);

  const handleL1Select = (domain: L1Domain) => {
    setSelectedL1(domain);
    setStep(2);
  };

  const handleL2Select = (category: L2Category) => {
    setSelectedL2(category);
    setStep(3);
  };

  const handleL3Select = (subcategory: L3Subcategory) => {
    setSelectedL3(subcategory);
    setStep(4);
  };

  const handleSave = async (saveAndAddAnother: boolean = false) => {
    if (!selectedL1 || !selectedL2 || !selectedL3 || !l4Name) {
      return;
    }

    setSaving(true);
    try {
      // Create payload for custom user skill
      const payload = {
        cat_id: selectedL1.catId,
        subcat_id: selectedL2.subcatId,
        l3_id: selectedL3.l3Id,
        custom_skill_name: l4Name,
        level,
        months_experience: 0,
        last_used_at: lastUsedDate || new Date().toISOString(),
        relevance,
      };

      const response = await fetch('/api/expertise/user-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // TODO: If proof URL is provided, attach it as a separate step
        // For now, we'll handle proofs in the Edit Skill window
        
        onSkillAdded();
        
        if (saveAndAddAnother) {
          // Reset to step 1 but keep drawer open
          setStep(1);
          setSelectedL1(null);
          setSelectedL2(null);
          setSelectedL3(null);
          setSelectedL4(null);
          setL4Name('');
          setLevel(2);
          setLastUsedDate('');
          setRelevance('current');
          setProofUrl('');
          setProofNotes('');
        } else {
          // Close drawer
          onOpenChange(false);
        }
      } else {
        const error = await response.json();
        console.error('Error saving skill:', error);
        alert(error.error || 'Failed to save skill. Please try again.');
      }
    } catch (error) {
      console.error('Error saving skill:', error);
      alert('Failed to save skill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Filter L2 categories by search
  const filteredL2 = l2Categories.filter((cat) =>
    cat.nameI18n.en.toLowerCase().includes(l2Search.toLowerCase())
  );

  // Filter L3 subcategories by search
  const filteredL3 = l3Subcategories.filter((sub) =>
    sub.nameI18n.en.toLowerCase().includes(l3Search.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-[#2D3330]">
            Add Skill to Atlas
          </SheetTitle>
          <SheetDescription className="text-[#6B6760]">
            Follow the 4 steps to add a new skill to your expertise atlas.
          </SheetDescription>
        </SheetHeader>

        {/* Progress Indicator */}
        <div className="mt-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s === step
                      ? 'bg-[#4A5943] text-white'
                      : s < step
                      ? 'bg-[#7A9278] text-white'
                      : 'bg-[#E5E3DA] text-[#6B6760]'
                  }`}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-0.5 w-16 mx-2 ${
                      s < step ? 'bg-[#7A9278]' : 'bg-[#E5E3DA]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-[#6B6760] mt-2">
            <span>Domain</span>
            <span>Category</span>
            <span>Subcategory</span>
            <span>Details</span>
          </div>
        </div>

        {/* Step 1: Pick L1 Domain */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-[#2D3330] mb-2">
                Step 1: Choose Domain
              </h3>
              <p className="text-sm text-[#6B6760] mb-4">
                Select the top-level domain that best fits your skill.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {domains.map((domain) => {
                const colors = DOMAIN_COLORS[domain.catId] || DOMAIN_COLORS[1];
                return (
                  <Card
                    key={domain.catId}
                    className={`${colors.bg} ${colors.border} border-2 hover:shadow-md transition-all cursor-pointer p-4`}
                    onClick={() => handleL1Select(domain)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{colors.icon}</div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${colors.text}`}>
                          {domain.nameI18n.en}
                        </h4>
                        {domain.descriptionI18n?.en && (
                          <p className="text-sm text-[#6B6760] mt-1">
                            {domain.descriptionI18n.en}
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Pick L2 Category */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2 text-[#4A5943]"
              >
                ← Back to Domains
              </Button>
              <h3 className="text-lg font-medium text-[#2D3330] mb-2">
                Step 2: Choose Category
              </h3>
              <p className="text-sm text-[#6B6760] mb-4">
                Select a category within <strong>{selectedL1?.nameI18n.en}</strong>.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6760]" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={l2Search}
                onChange={(e) => setL2Search(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* L2 List */}
            {l2Loading ? (
              <div className="text-center py-8 text-[#6B6760]">Loading categories...</div>
            ) : filteredL2.length === 0 ? (
              <div className="text-center py-8 text-[#6B6760]">No categories found.</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredL2.map((category) => (
                  <Card
                    key={category.subcatId}
                    className="p-4 hover:bg-[#F7F6F1] transition-colors cursor-pointer border border-[#E5E3DA]"
                    onClick={() => handleL2Select(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#2D3330]">
                          {category.nameI18n.en}
                        </h4>
                        {category.descriptionI18n?.en && (
                          <p className="text-sm text-[#6B6760] mt-1">
                            {category.descriptionI18n.en}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#6B6760]" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pick L3 Subcategory */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2 text-[#4A5943]"
              >
                ← Back to Categories
              </Button>
              <h3 className="text-lg font-medium text-[#2D3330] mb-2">
                Step 3: Choose Subcategory
              </h3>
              <p className="text-sm text-[#6B6760] mb-4">
                Select a subcategory within <strong>{selectedL2?.nameI18n.en}</strong>.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6760]" />
              <Input
                type="text"
                placeholder="Search subcategories..."
                value={l3Search}
                onChange={(e) => setL3Search(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* L3 List */}
            {l3Loading ? (
              <div className="text-center py-8 text-[#6B6760]">Loading subcategories...</div>
            ) : filteredL3.length === 0 ? (
              <div className="text-center py-8 text-[#6B6760]">No subcategories found.</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredL3.map((subcategory) => (
                  <Card
                    key={subcategory.l3Id}
                    className="p-4 hover:bg-[#F7F6F1] transition-colors cursor-pointer border border-[#E5E3DA]"
                    onClick={() => handleL3Select(subcategory)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#2D3330]">
                          {subcategory.nameI18n.en}
                        </h4>
                        {subcategory.descriptionI18n?.en && (
                          <p className="text-sm text-[#6B6760] mt-1">
                            {subcategory.descriptionI18n.en}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#6B6760]" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Enter L4 Skill Details */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2 text-[#4A5943]"
              >
                ← Back to Subcategories
              </Button>
              <h3 className="text-lg font-medium text-[#2D3330] mb-2">
                Step 4: Skill Details
              </h3>
              <p className="text-sm text-[#6B6760] mb-4">
                Fill in the details for your skill.
              </p>
            </div>

            {/* Skill Name */}
            <div>
              <Label htmlFor="skill-name" className="text-[#2D3330]">
                Skill Name *
              </Label>
              <Input
                id="skill-name"
                type="text"
                placeholder="e.g., React.js, Project Management, Spanish"
                value={l4Name}
                onChange={(e) => setL4Name(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Proficiency Level */}
            <div>
              <Label className="text-[#2D3330] mb-3 block">
                Proficiency Level *
              </Label>
              <RadioGroup
                value={level.toString()}
                onValueChange={(val: string) => setLevel(parseInt(val))}
              >
                {LEVEL_LABELS.map((lvl) => (
                  <div
                    key={lvl.value}
                    className="flex items-center space-x-3 mb-2 p-3 rounded-lg border border-[#E5E3DA] hover:bg-[#F7F6F1] transition-colors"
                  >
                    <RadioGroupItem value={lvl.value.toString()} id={`level-${lvl.value}`} />
                    <Label htmlFor={`level-${lvl.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-[#2D3330]">{lvl.label}</div>
                      <div className="text-sm text-[#6B6760]">{lvl.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Last Used */}
            <div>
              <Label htmlFor="last-used" className="text-[#2D3330]">
                Last Used (Optional)
              </Label>
              <Input
                id="last-used"
                type="date"
                value={lastUsedDate}
                onChange={(e) => setLastUsedDate(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-[#6B6760] mt-1">
                When did you last use this skill?
              </p>
            </div>

            {/* Relevance */}
            <div>
              <Label className="text-[#2D3330] mb-3 block">Relevance</Label>
              <RadioGroup
                value={relevance}
                onValueChange={(val: 'current' | 'emerging' | 'obsolete') => setRelevance(val)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="current" id="relevance-current" />
                  <Label htmlFor="relevance-current" className="cursor-pointer">
                    <Badge variant="outline" className="bg-[#EEF1EA] text-[#4A5943] border-[#7A9278]">
                      Current
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">
                      Widely used today
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 mb-2">
                  <RadioGroupItem value="emerging" id="relevance-emerging" />
                  <Label htmlFor="relevance-emerging" className="cursor-pointer">
                    <Badge variant="outline" className="bg-[#E8F3F8] text-[#3E5C73] border-[#6B9AB8]">
                      Emerging
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">
                      Growing in demand
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="obsolete" id="relevance-obsolete" />
                  <Label htmlFor="relevance-obsolete" className="cursor-pointer">
                    <Badge variant="outline" className="bg-[#FFF0F0] text-[#8B4A36] border-[#C76B4A]">
                      Obsolete
                    </Badge>
                    <span className="ml-2 text-sm text-[#6B6760]">
                      Declining use
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Optional Proof */}
            <div className="border-t border-[#E5E3DA] pt-6">
              <h4 className="font-medium text-[#2D3330] mb-3">
                Add Proof (Optional)
              </h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="proof-url" className="text-[#2D3330]">
                    Proof URL
                  </Label>
                  <Input
                    id="proof-url"
                    type="url"
                    placeholder="https://..."
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="proof-notes" className="text-[#2D3330]">
                    Notes
                  </Label>
                  <Textarea
                    id="proof-notes"
                    placeholder="Describe this proof..."
                    value={proofNotes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProofNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#E5E3DA]">
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={!l4Name || saving}
                className="flex-1 border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
              >
                Save & Add Another
              </Button>
              <Button
                onClick={() => handleSave(false)}
                disabled={!l4Name || saving}
                className="flex-1 bg-[#4A5943] text-white hover:bg-[#3C4936]"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

