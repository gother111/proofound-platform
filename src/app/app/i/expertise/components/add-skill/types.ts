export interface L1Domain {
  catId: number;
  slug: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
}

export interface L2Category {
  subcatId: number;
  catId: number;
  slug: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
  l4Count?: number;
}

export interface L3Subcategory {
  l3Id: number;
  subcatId: number;
  catId: number;
  slug: string;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
  l4Count?: number;
}

export interface L4Skill {
  code: string;
  slug?: string;
  catId?: number;
  subcatId?: number;
  l3Id?: number;
  nameI18n: { en: string };
  descriptionI18n?: { en: string };
  l1?: {
    catId: number;
    slug: string;
    nameI18n: { en: string };
  };
  l2?: {
    subcatId: number;
    catId: number;
    slug: string;
    nameI18n: { en: string };
  };
  l3?: {
    l3Id: number;
    subcatId: number;
    catId: number;
    slug: string;
    nameI18n: { en: string };
  };
}

export type SkillProofSource = 'url' | 'document';
export type SkillVerificationSource = 'peer' | 'manager' | 'external';

export type AddSkillDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: L1Domain[];
  taxonomyReady?: boolean;
  onSkillAdded: (skill?: any) => void;
};
