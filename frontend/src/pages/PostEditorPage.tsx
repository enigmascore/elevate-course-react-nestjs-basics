import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMatch, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { api, ApiError } from "../api/client";
import { FieldError } from "../components/FieldError";
import { postSchema, type PostInput } from "../schemas/post";

/** One form, two routes: /posts/new creates, /posts/$postId/edit updates. */
export function PostEditorPage() {
  const editMatch = useMatch({ from: "/posts/$postId/edit", shouldThrow: false });
  const postId = editMatch?.params.postId;
  const isEdit = postId !== undefined;

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const existing = useQuery({
    queryKey: ["post", postId],
    queryFn: () => api.post(postId!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    values: isEdit && existing.data
      ? { title: existing.data.title, body: existing.data.body }
      : undefined,
  });

  const save = useMutation({
    mutationFn: (input: PostInput) =>
      isEdit ? api.updatePost(postId!, input) : api.createPost(input),
    onSuccess: (post) => {
      // the my-posts list is now stale - invalidate so it refetches
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      reset();
      navigate({ to: "/posts/$postId", params: { postId: post.id } });
    },
  });

  if (isEdit && existing.isPending) {
    return <p className="text-slate-500">Loading post...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{isEdit ? "Edit post" : "New post"}</h1>
      <form onSubmit={handleSubmit((input) => save.mutate(input))} noValidate className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            {...register("title")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          <FieldError message={errors.title?.message} />
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-medium">
            Body
          </label>
          <textarea
            id="body"
            rows={10}
            {...register("body")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
          <FieldError message={errors.body?.message} />
        </div>
        {save.isError && (
          <p role="alert" className="text-sm text-red-600">
            {save.error instanceof ApiError ? save.error.message : "Saving failed"}
          </p>
        )}
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isEdit ? "Save changes" : "Publish"}
        </button>
      </form>
    </div>
  );
}
