import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signup = async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return { success: false, error: data.error };
      }

      if (data.success) {
        router.push('/dashboard');
        return { success: true, user: data.user };
      }

      setError(data.error || 'Signup failed');
      return { success: false, error: data.error };

    } catch (err) {
      const errorMessage = 'Signup failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }

      if (data.success) {
        router.push('/dashboard');
        return { success: true, user: data.user };
      }

      setError(data.error || 'Login failed');
      return { success: false, error: data.error };

    } catch (err) {
      const errorMessage = 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Logout failed');
        return false;
      }

      if (data.success) {
        router.push('/sign-in');
        return true;
      }

      setError(data.error || 'Logout failed');
      return false;

    } catch (err) {
      const errorMessage = 'Logout failed. Please try again.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    signup,
    login,
    logout,
    loading,
    error,
    clearError: () => setError(null),
  };
}
