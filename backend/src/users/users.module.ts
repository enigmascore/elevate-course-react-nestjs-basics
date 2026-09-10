import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostsModule } from "../posts/posts.module";
import { User } from "./user.entity";
import { UsersController } from "./users.controller";

@Module({
  imports: [TypeOrmModule.forFeature([User]), PostsModule],
  controllers: [UsersController],
})
export class UsersModule {}
