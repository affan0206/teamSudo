export type UserRole = 'FACULTY' | 'STUDENT';

export interface AuthenticatedUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId: string | null;
  department: string;
  assignedTitle?: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthenticatedUserProfile | null;
  token?: string;
  error?: string;
}
