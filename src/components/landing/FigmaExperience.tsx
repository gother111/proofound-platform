'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as jsxRuntime from 'react/jsx-runtime';

import type { ComponentType } from 'react';

type FigmaLoader = () => Promise<{ default: ComponentType<any> }>;

function createGlobals() {
  const existing = (globalThis as any).__GLOBALS__ ?? {};
  return {
    ...existing,
    React,
    ReactDOM,
    ReactJSXRuntime: jsxRuntime,
  };
}

function getLoader(): Promise<{ default: ComponentType<any> }> {
  return import('@/figma/figma-app.mjs').then(async (mod) => {
    const loader: FigmaLoader = mod.Code0_8;
    const resolved = await loader();
    return resolved;
  });
}

export function FigmaExperience() {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        (globalThis as any).__GLOBALS__ = createGlobals();
        const resolved = await getLoader();
        if (!cancelled) {
          setComponent(() => resolved.default);
        }
      } catch (err) {
        console.error('Failed to load the Figma experience', err);
        if (!cancelled) {
          setError('Unable to load the latest Figma experience right now.');
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <p className="text-lg font-medium">{error}</p>
        <p className="mt-2 text-sm opacity-80">Please refresh the page to try again.</p>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4A5943]/30 border-t-[#4A5943]" />
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Syncing latest Figma view…
        </p>
      </div>
    );
  }

  return <Component />;
}

export default FigmaExperience;
