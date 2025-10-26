const API_URL = "http://localhost:8001/v1";

export enum ProficiencyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum ProgrammingLanguage {
  CPP = "cpp",
  JAVA = "java",
  PYTHON = "python",
  JAVASCRIPT = "javascript",
}

export interface User {
  id: string;
  username?: string;
  display_name?: string;
  email: string;
  avatar_url?: string;
  google_id?: string;
  description?: string;
  programming_proficiency?: ProficiencyLevel;
  preferred_language?: ProgrammingLanguage;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  user: User;
  isAdmin: boolean;
}

// Auth Service

export const getGoogleSignInUrl = async (): Promise<string> => {
  const response = await fetch(`${API_URL}/auth/google/url`);
  if (!response.ok) {
    throw new Error("Failed to get Google Sign-In URL");
  }
  const { url } = await response.json();
  return url;
};

export const logoutUser = async (): Promise<void> => {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
};

export const getSession = async (): Promise<Session | null> => {
  const response = await fetch(`${API_URL}/auth/session`, {
    // Include credentials to send cookies
    credentials: "include",
  });
  if (!response.ok) {
    return null;
  }
  let res = await response.json();
  return { user: res.user, isAdmin: res.isAdmin };
};

// User Service

export const getUser = async (): Promise<User> => {
  const response = await fetch(`${API_URL}/users/me`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return response.json();
};

export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}/admin/users`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
};

export const updateUser = async (user: Partial<User>): Promise<User> => {
  const response = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error("Failed to update user");
  }
  return response.json();
};

export const assignRoleToUser = async (
  userId: string,
  roleId: number
): Promise<void> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}/roles`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roleId }),
  });
  if (!response.ok) {
    throw new Error("Failed to assign role to user");
  }
};

export const removeRoleFromUser = async (
  userId: string,
  roleId: number
): Promise<void> => {
  const response = await fetch(`${API_URL}/admin/users/${userId}/roles/${roleId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to remove role from user");
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete user");
  }
};
