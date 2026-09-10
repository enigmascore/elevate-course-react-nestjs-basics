import { useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { api, ApiError } from "../api/client";

/** Landing page of the emailed link: /activate?token=... */
export function ActivatePage() {
  const { token } = useSearch({ from: "/activate" });
  const activation = useMutation({ mutationFn: api.activate });
  const { mutate } = activation;

  // under StrictMode ( dev ) effects run twice - but an activation
  // token only works ONCE, so the ref makes sure we send it once
  const fired = useRef(false);
  useEffect(() => {
    if (token && !fired.current) {
      fired.current = true;
      mutate(token);
    }
  }, [token, mutate]);

  if (!token) {
    return <p className="text-slate-600">Missing activation token - use the link from your email.</p>;
  }
  if (activation.isPending || activation.isIdle) {
    return <p className="text-slate-600">Activating your account...</p>;
  }
  if (activation.isError) {
    return (
      <p role="alert" className="text-red-600">
        {activation.error instanceof ApiError ? activation.error.message : "Activation failed"}
      </p>
    );
  }
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Account activated</h1>
      <p className="text-slate-600">
        You can{" "}
        <Link to="/login" className="underline">
          log in
        </Link>{" "}
        now.
      </p>
    </div>
  );
}
