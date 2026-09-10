import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { api, ApiError } from "../api/client";
import { FieldError } from "../components/FieldError";
import { loginSchema, type LoginInput } from "../schemas/auth";
import { useAuthStore } from "../store/auth";

export function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const login = useMutation({
    mutationFn: (input: LoginInput) => api.login(input.email, input.password),
    onSuccess: (tokens) => {
      setAuth(tokens);
      navigate({ to: "/my-posts", search: { page: 0 } });
    },
  });

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
      <form onSubmit={handleSubmit((input) => login.mutate(input))} noValidate className="space-y-4">
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
        {login.isError && (
          <p role="alert" className="text-sm text-red-600">
            {login.error instanceof ApiError ? login.error.message : "Login failed"}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
        >
          Log in
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        No account?{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </p>
    </div>
  );
}
