const API_URL = 'http://localhost:8001/v1';

export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  google_id: string;
  description: string;
  programming_proficiency: 'beginner' | 'intermediate' | 'advanced';
  role: "USER" | "ADMIN";
  created_at: string;
  updated_at: string;
}


// Auth Service

export const getGoogleSignInUrl = async (): Promise<string> => {
  const response = await fetch(`${API_URL}/auth/google/url`);
  if (!response.ok) {
    throw new Error('Failed to get Google Sign-In URL');
  }
  const { url } = await response.json();
  return url;
};

// User Service

export const getUser = async (): Promise<User> => {
  const response = await fetch(`${API_URL}/users/me`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
};

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    return response.json();
};

export const updateUser = async (user: Partial<User>): Promise<User> => {
  const response = await fetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
};

export const updateUserRole = async (userId: string, role: string): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
    });
    if (!response.ok) {
        throw new Error('Failed to update user role');
    }
    return response.json();
};

export const deleteUser = async (userId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete user');
    }
};
