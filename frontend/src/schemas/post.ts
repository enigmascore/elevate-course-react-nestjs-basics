import { z } from "zod";

/** Mirrors the backend's CreatePostDto. */
export const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is at most 200 characters"),
  body: z.string().min(1, "Body is required").max(20000, "Body is at most 20000 characters"),
});

export type PostInput = z.infer<typeof postSchema>;
