import { useQuery } from "@tanstack/react-query";
import { Link, useCanGoBack, useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { api } from "../api/client";
import { useAuthStore } from "../store/auth";

export function PostViewPage() {
  const { postId } = useParams({ from: "/posts/$postId" });
  const user = useAuthStore((s) => s.user);

  // "< Back" returns the reader to whichever list they came from ( feed,
  // my posts, page 2 of either ); a direct link has no history to go
  // back to, so it falls back to my posts
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = useNavigate();
  const goBack = () => {
    if (canGoBack) {
      router.history.back();
    } else {
      navigate({ to: "/my-posts", search: { page: 0 } });
    }
  };

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
      <button
        type="button"
        onClick={goBack}
        className="mb-4 text-sm text-slate-500 hover:underline"
      >
        &lt; Back
      </button>
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
