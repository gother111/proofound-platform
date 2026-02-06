import { apiFetch } from '@/lib/api/fetch';
import { L1_CODE_MAP } from './constants';
import type { L1Domain, L2Category, L3Subcategory, L4Skill } from './types';

export async function fetchL1Domains(): Promise<L1Domain[]> {
  const response = await fetch('/api/expertise/taxonomy');
  if (!response.ok) return [];
  const data = (await response.json()) as { l1_domains?: L1Domain[] };
  return data.l1_domains ?? [];
}

export async function fetchL2Categories(l1CatId: number): Promise<L2Category[]> {
  const l1Code = L1_CODE_MAP[l1CatId];
  if (!l1Code) return [];
  const response = await fetch(`/api/expertise/taxonomy?l1=${l1Code}`);
  if (!response.ok) return [];
  const data = (await response.json()) as { l2_categories?: L2Category[] };
  return data.l2_categories ?? [];
}

export async function fetchL3Subcategories(l2Slug: string): Promise<L3Subcategory[]> {
  const response = await fetch(`/api/expertise/taxonomy?l2=${encodeURIComponent(l2Slug)}`);
  if (!response.ok) return [];
  const data = (await response.json()) as { l3_subcategories?: L3Subcategory[] };
  return data.l3_subcategories ?? [];
}

export async function fetchL4Skills(input: {
  catId: number;
  subcatId: number;
  l3Id: number;
}): Promise<L4Skill[]> {
  const response = await fetch(
    `/api/expertise/taxonomy?l3_id=${input.catId}.${input.subcatId}.${input.l3Id}`
  );
  if (!response.ok) return [];
  const data = (await response.json()) as { l4_skills?: L4Skill[] };
  return data.l4_skills ?? [];
}

export async function searchL4Skills(query: string, signal?: AbortSignal): Promise<L4Skill[]> {
  const response = await fetch(`/api/expertise/taxonomy?search=${encodeURIComponent(query)}`, {
    signal,
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { l4_skills?: L4Skill[] };
  return data.l4_skills ?? [];
}

export async function addUserSkill(payload: Record<string, any>): Promise<Response> {
  return apiFetch('/api/expertise/user-skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteUserSkill(skillId: string): Promise<Response> {
  return apiFetch(`/api/expertise/user-skills/${skillId}`, {
    method: 'DELETE',
  });
}

export async function attachSkillProof(
  skillId: string,
  payload: Record<string, any>
): Promise<Response> {
  return apiFetch(`/api/expertise/user-skills/${skillId}/proofs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
