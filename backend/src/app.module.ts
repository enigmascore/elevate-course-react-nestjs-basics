import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOptions } from "./database/data-source";
import { appConfig } from "./config/app.config";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { InterestsModule } from "./interests/interests.module";
import { PostsModule } from "./posts/posts.module";
import { MailModule } from "./mail/mail.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    TypeOrmModule.forRoot(dataSourceOptions),
    MailModule,
    AuthModule,
    UsersModule,
    InterestsModule,
    PostsModule,
  ],
})
export class AppModule {}
