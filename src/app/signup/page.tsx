import { SignUpForm } from "@/app/signup/signup-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <SignUpForm />
    </main>
  );
}
