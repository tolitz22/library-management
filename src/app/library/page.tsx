import { LibraryClient } from "@/components/library-client";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  const { shelf } = await searchParams;
  return <LibraryClient initialBooks={[]} initialShelf={shelf ?? "All shelves"} />;
}
