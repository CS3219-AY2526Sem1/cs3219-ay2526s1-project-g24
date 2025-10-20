
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
