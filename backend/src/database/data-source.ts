import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { appConfig } from "../config/app.config";
import { User } from "../users/user.entity";
import { Interest } from "../interests/interest.entity";
import { Post } from "../posts/post.entity";
import { RefreshToken } from "../auth/refresh-token.entity";

const config = appConfig();

/**
 * One set of DataSource options shared by the running app, the TypeORM
 * CLI ( pnpm migration:run / migration:generate ) and the seed script.
 * The schema is managed by MIGRATIONS, never by synchronize.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  entities: [User, Interest, Post, RefreshToken],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  synchronize: false,
};

export const appDataSource = new DataSource(dataSourceOptions);

export default appDataSource;
