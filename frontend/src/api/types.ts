/** Shapes the backend API speaks - mirrors the backend's view types. */

export interface Interest {
  id: string;
  name: string;
}

export interface UserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "ADMIN";
  interests: Interest[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserView;
}

export interface PostView {
  id: string;
  title: string;
  body: string;
  author: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

/** The house paging shape: every list endpoint answers with this. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
