export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-8">
      <section className="brutal-card w-full text-center">
        <h1 className="text-2xl font-bold">You’re offline</h1>
        <p className="mt-2 text-sm text-zinc-600">No worries — reconnect to continue syncing your library.</p>
      </section>
    </main>
  );
}
