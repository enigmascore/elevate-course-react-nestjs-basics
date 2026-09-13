# The graded task: make the blog social

The app lets you WRITE, but there is no way to FIND anyone or READ
anyone else's posts. Your task closes that gap: **find people, follow
them, and build the feed**. One issue, one branch, stepwise commits,
one pull request - its URL is what you submit on the course.

## What you build

1. **The `Follow` domain** - a new TypeORM entity ( follower <->
   followed, one row per pair, following yourself makes no sense ) and
   its MIGRATION ( `pnpm migration:generate`, like the InitialSchema
   one ).
2. **Find people** - search users by shared interest, paged:
   `GET /api/users?interest=<id>&page=0&size=10`. The interests were
   captured at registration and stored - your feature is the first to
   USE them.
3. **Follow / unfollow** -
   `POST /api/users/:id/follow`, `DELETE /api/users/:id/follow`, and
   `GET /api/users/me/following?page=0&size=10`. Following twice, or
   following yourself, is a conflict. NO emails - the email code stays
   exactly as it is.
4. **The feed** - `GET /api/users/me/feed?page=0&size=10`: recent posts
   by everyone YOU follow, newest first, paged ( the join from your
   follows to their posts is the interesting query ). The feed is a
   READING surface: each card renders the post's author, title, FULL
   BODY and date inline - never a bare list of titles you must click
   to read.
5. **The screens** - a find-people screen ( search + follow/unfollow ),
   a "who I follow" list, and the FEED page - each a routed screen
   using the same stack as the rest of the app ( TanStack Router,
   TanStack Query, react-hook-form + zod where a form appears,
   Tailwind ). The feed renders its paging controls, exactly like
   "My posts".

## The tests you write ( following and feed only )

- **unit**: your new screens, MSW-backed - copy the shape of
  `MyPostsPage.test.tsx` - including that the feed renders the post
  BODIES inline;
- **integration**: the feed contains followed users' posts and NOBODY
  else's; paging is respected; following twice conflicts - copy the
  shape of `backend/test/integration/api.integration.spec.ts`;
- **Playwright**: log in as `pw-one@example.com`, follow another seeded
  user, post as THAT user ( `pw-two@example.com` ), see the post appear
  in pw-one's feed - copy the shape of `e2e/posts.spec.ts`.

You do NOT write email tests of any kind, and the provided tests must
still pass, UNCHANGED ( your marker diffs them against the template ).

## How you are marked ( 10 points )

- **4** - the feature works end to end and `make test` + `make e2e`
  are green with your new tests in them;
- **2** - your tests exist at all three tiers and genuinely assert the
  behaviour;
- **1** - the provided tests are untouched and still green;
- **2** - code quality: your entity, migration, DTOs, guards, queries,
  routes and components IMITATE the patterns this app already uses;
- **1** - the git loop: issue, branch, stepwise commits, main merged
  before the PR, `Closes #N`, a clean merge.
