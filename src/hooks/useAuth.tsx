// Re-export from contexts for backward compatibility
// The actual implementation is now split across AuthContext, ProfileContext, and PermissionsContext
export { useAuth, useAuthContext, useProfileContext, usePermissionsContext } from '@/contexts';
