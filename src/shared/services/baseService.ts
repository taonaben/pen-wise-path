export function handleSupabaseError(error: unknown): never {
  // eslint-disable-next-line no-console
  console.error("[Supabase]", error);
  throw error;
}

export function requireData<T>(data: T | null | undefined, message = "No data returned"): T {
  if (data === null || data === undefined) throw new Error(message);
  return data;
}
