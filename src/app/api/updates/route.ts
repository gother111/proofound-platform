export async function GET() {
  // TODO: Fetch real updates from database when ready
  // For now, return empty array (While Away card won't render)
  return Response.json({ updates: [] });
}
