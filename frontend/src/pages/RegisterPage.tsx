import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api, ApiError } from "../api/client";
import { FieldError } from "../components/FieldError";
import { registerSchema, type RegisterInput } from "../schemas/auth";

export function RegisterPage() {
  // the multi-select's options come from the backend
  const interests = useQuery({ queryKey: ["interests"], queryFn: api.interests });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { interestIds: [] },
  });

  const registration = useMutation({ mutationFn: api.register });

  if (registration.isSuccess) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-4 text-2xl font-bold">Check your email</h1>
        <p className="text-slate-600">
          We sent you an activation link. Open it to activate your account, then log in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Register</h1>
      <form
        onSubmit={handleSubmit((input) => registration.mutate(input))}
        noValidate
        className="space-y-4"
      >
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            {...register("firstName")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            {...register("lastName")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          <FieldError message={errors.lastName?.message} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          <FieldError message={errors.password?.message} />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Interests</legend>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {interests.data?.map((interest) => (
              <label key={interest.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={interest.id} {...register("interestIds")} />
                {interest.name}
              </label>
            ))}
          </div>
          <FieldError message={errors.interestIds?.message} />
        </fieldset>
        {registration.isError && (
          <p role="alert" className="text-sm text-red-600">
            {registration.error instanceof ApiError
              ? registration.error.message
              : "Registration failed"}
          </p>
        )}
        <button
          type="submit"
          disabled={registration.isPending}
          className="w-full rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
        >
          Register
        </button>
      </form>
    </div>
  );
}
