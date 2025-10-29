import { Session, User } from "@/lib/types";

const API_URL = "http://localhost:8001/v1";

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
  console.log('Updating user with data:', user);
  
  // Remove undefined values and only send defined fields
  const cleanedData: Record<string, any> = {};
  if (user.username !== undefined) cleanedData.username = user.username;
  if (user.display_name !== undefined) cleanedData.display_name = user.display_name;
  if (user.description !== undefined) cleanedData.description = user.description;
  if (user.programming_proficiency !== undefined) cleanedData.programming_proficiency = user.programming_proficiency;
  if (user.preferred_language !== undefined) cleanedData.preferred_language = user.preferred_language;
  if (user.avatar_url !== undefined) cleanedData.avatar_url = user.avatar_url;
  
  console.log('Cleaned data to send:', cleanedData);
  
  const response = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cleanedData),
  });
  console.log('Update response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update failed:', errorText);
    throw new Error("Failed to update user: " + errorText);
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
  const response = await fetch(
    `${API_URL}/admin/users/${userId}/roles/${roleId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
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
