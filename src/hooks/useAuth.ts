import { useAuth as useAuthContext } from '@/contexts/AuthContext';

// Map the function names to match what the components expect
export const useAuth = () => {
  const auth = useAuthContext();
  return {
    ...auth,
    logout: auth.signOut, // Map signOut to logout
  };
};
