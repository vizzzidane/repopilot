export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-semibold">Sign in temporarily unavailable</h1>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Authentication is currently being configured. Please check back later.
        </p>

        <a
          href="/"
          className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-semibold text-black"
        >
          Back to RepoPilot
        </a>
      </div>
    </main>
  );
}