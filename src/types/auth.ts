export interface Token {
  access_token: string;
  token_type: 'bearer';
}

export interface UserPublic {
  email: string;
  is_active?: boolean; // Made optional as per schema example
  is_superuser?: boolean; // Added is_superuser
  full_name?: string | null;
  id: string; // UUID
  // Add other potential fields if needed based on full backend schema or future needs
  // e.g., createdAt?: string;
}


// Response structure for paginated user lists (matches UsersPublic schema)
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}


// Add other auth related types if needed, e.g., PasswordRecovery, ResetPassword, etc.
// Matches NewPassword schema
export interface ResetPasswordPayload {
    token: string;
    new_password: string; // min 8 chars
}

// Matches UpdatePassword schema
export interface UpdatePasswordPayload {
    current_password: string; // min 8 chars
    new_password: string; // min 8 chars
}

// Matches UserRegister schema
export interface UserRegisterPayload {
    email: string; // max 255
    password: string; // min 8
    full_name?: string | null;
}

// Matches UserUpdateMe schema
export interface UserUpdateMePayload {
    full_name?: string | null;
    email?: string | null; // Optional, check if backend allows changing email here
}

// Matches UserCreate schema (Admin)
export interface UserCreateAdminPayload {
    email: string;
    password: string; // min 8
    is_active?: boolean;
    is_superuser?: boolean;
    full_name?: string | null;
}

// Matches UserUpdate schema (Admin)
export interface UserUpdateAdminPayload {
    email?: string | null;
    password?: string | null; // min 8
    is_active?: boolean;
    is_superuser?: boolean;
    full_name?: string | null;
}
