import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/jwt.strategy";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostView } from "./post.view";
import { PostsService } from "./posts.service";

@Controller("posts")
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  /** POST /api/posts - create a post ( any logged-in user ) */
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto): Promise<PostView> {
    return this.posts.create(user, dto);
  }

  /** PUT /api/posts/:id - the OWNING user, or ADMIN */
  @Put(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreatePostDto,
  ): Promise<PostView> {
    return this.posts.update(user, id, dto);
  }

  /** GET /api/posts/:id - any logged-in user */
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string): Promise<PostView> {
    return this.posts.findOne(id);
  }
}
