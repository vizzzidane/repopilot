import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6">
      <SignIn routing="path" path="/sign-in" afterSignInUrl="/" />
    </main>
  );
}