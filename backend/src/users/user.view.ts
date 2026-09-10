import { User } from "./user.entity";

/** What the API says about a user - never the password hash. */
export interface UserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  interests: { id: string; name: string }[];
}

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    interests: (user.interests ?? []).map(({ id, name }) => ({ id, name })),
  };
}
