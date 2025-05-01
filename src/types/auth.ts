export interface Token {
  access_token: string;
  token_type: 'bearer';
}

export interface UserPublic {
  email: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string | null;
  id: string; // UUID
}

// Add other auth related types if needed, e.g., PasswordRecovery, ResetPassword, etc.
