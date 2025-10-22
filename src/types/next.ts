export type ParamsPromise<T> = Promise<T>;

export type PageProps<
  TParams extends Record<string, string> = {},
  TSearchParams extends Record<string, string | string[] | undefined> = {},
> = {
  params: TParams;
  searchParams?: TSearchParams;
};
