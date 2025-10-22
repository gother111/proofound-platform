import type React from 'react';

declare global {
  type PageProps<
    TParams extends Record<string, string> = {},
    TSearchParams extends Record<string, string | string[] | undefined> = {},
  > = {
    params: TParams;
    searchParams?: TSearchParams;
  };

  type LayoutProps<TParams extends Record<string, string> = {}> = {
    params: TParams;
    children: React.ReactNode;
  };

  type RouteContext<TParams extends Record<string, string> = {}> = {
    params: TParams;
  };
}

export {};
