import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Interest } from "../interests/interest.entity";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column({ name: "first_name" })
  firstName: string;

  @Column({ name: "last_name" })
  lastName: string;

  @Column({ type: "enum", enum: UserRole, enumName: "user_role", default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  activated: boolean;

  @Column({ name: "activation_token", type: "uuid", nullable: true, unique: true })
  activationToken: string | null;

  @ManyToMany(() => Interest, { eager: true })
  @JoinTable({
    name: "user_interests",
    joinColumn: { name: "user_id" },
    inverseJoinColumn: { name: "interest_id" },
  })
  interests: Interest[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
