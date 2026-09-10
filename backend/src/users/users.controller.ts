import { Controller, Get, NotFoundException, Query, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/jwt.strategy";
import { PageQuery, Paged } from "../common/pagination";
import { PostView } from "../posts/post.view";
import { PostsService } from "../posts/posts.service";
import { User } from "./user.entity";
import { toUserView, UserView } from "./user.view";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly posts: PostsService,
  ) {}

  /** GET /api/users/me - the logged-in user */
  @Get("me")
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserView> {
    const user = await this.users.findOne({ where: { id: current.userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return toUserView(user);
  }

  /** GET /api/users/me/posts?page=0&size=10 - my posts, newest first, paged */
  @Get("me/posts")
  myPosts(
    @CurrentUser() current: AuthenticatedUser,
    @Query() query: PageQuery,
  ): Promise<Paged<PostView>> {
    return this.posts.findByAuthor(current.userId, query);
  }
}
