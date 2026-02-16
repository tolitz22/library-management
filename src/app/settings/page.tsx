export default function SettingsPage() {
  return (
    <main className="space-y-4">
      <section className="brutal-card space-y-3">
        <h3 className="text-xl font-bold">Profile</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <input className="brutal-input" defaultValue="Angelito" />
          <input className="brutal-input" defaultValue="angelito@example.com" />
        </div>
      </section>
      <section className="brutal-card space-y-3">
        <h3 className="text-xl font-bold">Workspace (single-user for now)</h3>
        <input className="brutal-input" defaultValue="Angelito's Library" />
      </section>
    </main>
  );
}
