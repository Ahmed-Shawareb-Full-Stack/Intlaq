export interface User {
  user_id: string;
  name: string;
  type: 'EMPLOYER' | 'EMPLOYEE';
  created_at: Date;
  updated_at: Date;
  email: string;
  hashed_password: string;
}
