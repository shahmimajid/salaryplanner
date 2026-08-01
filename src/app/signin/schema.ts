import { z } from "zod";

export const signInFormSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;
