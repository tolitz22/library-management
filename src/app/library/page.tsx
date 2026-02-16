import { books } from "@/lib/mock-data";
import { LibraryClient } from "@/components/library-client";

export default function LibraryPage() {
  return <LibraryClient initialBooks={books} />;
}
