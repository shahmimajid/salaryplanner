import { SignInForm } from "@/app/signin/signin-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <SignInForm />
    </main>
  );
}
