// User object returned from the backend, matches (GET /users/me) and login responses
export type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: "user" | "admin";
  isEmailVerified: boolean;
  emailVerifyExpiry: string | null;
  savedPosts: { postId: string }[];
  hasPassword: boolean;
};

// Shape of Response from (POST /auth/login) and (POST /auth/signup)
export type AuthResponse = {
  user: Pick<User, "id" | "name" | "email" | "role">;
  accessToken: string;
  refreshToken: string;
};