import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";

export function PostViewPage() {
  const { postId } = useParams({ from: "/posts/$postId" });
  const user = useAuthStore((s) => s.user);

  const post = useQuery({ queryKey: ["post", postId], queryFn: () => api.post(postId) });

  if (post.isPending) {
    return <p className="text-slate-500">Loading post...</p>;
  }
  if (post.isError) {
    return (
      <p role="alert" className="text-red-600">
        Could not load this post.
      </p>
    );
  }

  const { title, body, author, createdAt } = post.data;
  const canEdit = user && (user.id === author.id || user.role === "ADMIN");

  return (
    <article>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        by {author.firstName} {author.lastName} on {new Date(createdAt).toLocaleDateString()}
      </p>
      <div className="mt-6 whitespace-pre-wrap text-slate-800">{body}</div>
      {canEdit && (
        <p className="mt-8">
          <Link
            to="/posts/$postId/edit"
            params={{ postId }}
            className="text-sm underline hover:text-slate-600"
          >
            Edit this post
          </Link>
        </p>
      )}
    </article>
  );
}
