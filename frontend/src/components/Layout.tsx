import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  async function handleLogout() {
    if (refreshToken) {
      await api.logout(refreshToken).catch(() => undefined);
    }
    clearAuth();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-bold">Blog</span>
          {user ? (
            <>
              <Link to="/my-posts" search={{ page: 0 }} className="text-sm hover:underline">
                My posts
              </Link>
              <Link to="/posts/new" className="text-sm hover:underline">
                New post
              </Link>
              <span className="ml-auto text-sm text-slate-500">
                {user.firstName} {user.lastName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="ml-auto text-sm hover:underline">
                Log in
              </Link>
              <Link to="/register" className="text-sm hover:underline">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
