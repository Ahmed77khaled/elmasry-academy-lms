/**
 * Fetches all pages for a paginated Supabase RPC up to a safety cap so lists,
 * client filters, and exports are not silently truncated at server batch limits.
 */
export async function fetchAllRpcPages<T>(
  fetchPage: (
    limit: number,
    offset: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  { pageSize = 500, maxRows = 10000 }: { pageSize?: number; maxRows?: number } = {},
): Promise<{ data: T[] | null; error: string | null }> {
  const allRows: T[] = [];
  let offset = 0;

  while (allRows.length < maxRows) {
    const { data, error } = await fetchPage(pageSize, offset);
    if (error) return { data: null, error: error.message };
    const batch = Array.isArray(data) ? data : [];
    allRows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return { data: allRows, error: null };
}
