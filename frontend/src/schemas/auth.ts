import { z } from "zod";

/**
 * The zod schemas MIRROR the backend DTO rules ( RegisterDto / LoginDto )
 * so the user sees per-field errors instantly - the backend still
 * validates everything again, the frontend never relies on that
 * round-trip.
 */
export const registerSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  interestIds: z.array(z.string()).min(1, "Pick at least one interest"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
