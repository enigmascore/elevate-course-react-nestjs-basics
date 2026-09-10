import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { AuthenticatedUser } from "../auth/jwt.strategy";
import { PageQuery, Paged, toPaged } from "../common/pagination";
import { User, UserRole } from "../users/user.entity";
import { CreatePostDto } from "./dto/create-post.dto";
import { Post } from "./post.entity";
import { PostView, toPostView } from "./post.view";

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(author: AuthenticatedUser, dto: CreatePostDto): Promise<PostView> {
    const user = await this.users.findOneByOrFail({ id: author.userId });
    const post = await this.posts.save(
      this.posts.create({ title: dto.title, body: dto.body, author: user }),
    );
    return toPostView(post);
  }

  /**
   * OWNERSHIP: only the post's author may edit it - except an ADMIN,
   * who may edit anything. This is the permission pattern the whole
   * API follows: the role gets past the guard, the ownership check
   * happens here, where the row is loaded.
   */
  async update(current: AuthenticatedUser, postId: string, dto: CreatePostDto): Promise<PostView> {
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    if (post.author.id !== current.userId && current.role !== UserRole.ADMIN) {
      throw new ForbiddenException("You can only edit your own posts");
    }
    post.title = dto.title;
    post.body = dto.body;
    const saved = await this.posts.save(post);
    return toPostView(saved);
  }

  async findOne(postId: string): Promise<PostView> {
    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    return toPostView(post);
  }

  /**
   * The paged finder: newest first, ?page & ?size in, items + total
   * out. Every paged list in the API follows exactly this shape.
   */
  async findByAuthor(authorId: string, query: PageQuery): Promise<Paged<PostView>> {
    const [items, total] = await this.posts.findAndCount({
      where: { author: { id: authorId } },
      order: { createdAt: "DESC" },
      skip: query.page * query.size,
      take: query.size,
    });
    return toPaged(items.map(toPostView), total, query);
  }
}
