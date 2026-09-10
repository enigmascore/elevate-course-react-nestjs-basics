import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { api } from "../api/client";
import { PagingControls } from "../components/PagingControls";

const PAGE_SIZE = 10;

/**
 * My posts, newest first, PAGED: the page number lives in the URL
 * ( /my-posts?page=2 ) so reload and back/forward keep their place.
 */
export function MyPostsPage() {
  const { page } = useSearch({ from: "/my-posts" });
  const navigate = useNavigate();

  const posts = useQuery({
    queryKey: ["myPosts", page],
    queryFn: () => api.myPosts(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  if (posts.isPending) {
    return <p className="text-slate-500">Loading your posts...</p>;
  }
  if (posts.isError) {
    return (
      <p role="alert" className="text-red-600">
        Could not load your posts.
      </p>
    );
  }

  const { items, total, size } = posts.data;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My posts</h1>
        <Link
          to="/posts/new"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
        >
          New post
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-slate-500">No posts yet - write your first one.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((post) => (
            <li key={post.id} className="rounded border border-slate-200 bg-white p-4">
              <Link
                to="/posts/$postId"
                params={{ postId: post.id }}
                className="font-semibold hover:underline"
              >
                {post.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <PagingControls
        page={page}
        size={size}
        total={total}
        onPageChange={(next) => navigate({ to: "/my-posts", search: { page: next } })}
      />
    </div>
  );
}
