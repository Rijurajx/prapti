export default function ConfigRequiredPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold text-foreground">
        Supabase is not configured
      </h1>
      <p className="text-muted-foreground">
        PRAPTI needs a Supabase project to handle sign-in and store your data.
        Until it is configured, no session is available and the app area is
        unavailable.
      </p>
      <p className="text-muted-foreground">
        Set the following variables in a <code>.env.local</code> file at the
        project root (copy <code>.env.example</code> as a starting point), then
        restart the development server:
      </p>
      <ul className="list-disc space-y-1 pl-6 font-mono text-sm">
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
      </ul>
    </main>
  );
}
