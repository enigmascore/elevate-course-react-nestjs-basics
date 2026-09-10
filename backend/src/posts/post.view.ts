import { Post } from "./post.entity";

export interface PostView {
  id: string;
  title: string;
  body: string;
  author: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export function toPostView(post: Post): PostView {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    author: {
      id: post.author.id,
      firstName: post.author.firstName,
      lastName: post.author.lastName,
    },
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
