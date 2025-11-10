import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'premium';
  created_at: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password';
const DEMO_TOKEN = 'demo_local_token';

// In production and development, always use same-origin '/api' to avoid misconfigured absolute URLs
const API_BASE_URL = '/api';
const apiUrl = (p: string) => {
  const path = p.startsWith('/') ? p : `/${p}`;
  return `${API_BASE_URL}${path}`;
};

const makeDemoUser = (): User => ({
  id: 'demo_user_id',
  email: DEMO_EMAIL,
  name: '演示用户',
  subscription: 'free',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const isDemoToken = (token: string | null) => token === DEMO_TOKEN;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');

        // Demo token: bypass backend validation
        if (isDemoToken(token)) {
          const cachedUser = localStorage.getItem('user_data');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            const demoUser = makeDemoUser();
            setUser(demoUser);
            localStorage.setItem('user_data', JSON.stringify(demoUser));
          }
          return;
        }

        if (token) {
          // Validate token with backend
          const meUrl = apiUrl('/auth/me');
      const response = await fetch(meUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user) {
              setUser(data.data.user);
            } else {
              throw new Error('Invalid user data');
            }
          } else {
            throw new Error('Token validation failed');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const loginUrl = apiUrl('/auth/login');
      console.log('Login request URL (expected same-origin):', loginUrl);
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const text = await response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // 保持 parsed 为 null，以便后续统一处理
      }

      const ok = response.ok;
      const success = !!(parsed && parsed.success);
      const userData = parsed?.data?.user ?? null;
      const tokenData = parsed?.data?.token ?? null;

      if (ok && success && userData && tokenData) {
        setUser(userData);
        localStorage.setItem('auth_token', tokenData);
        localStorage.setItem('user_data', JSON.stringify(userData));
        return { success: true };
      } else {
        // Allow demo login even when backend returns 4xx/5xx
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          const demoUser = makeDemoUser();
          setUser(demoUser);
          localStorage.setItem('auth_token', DEMO_TOKEN);
          localStorage.setItem('user_data', JSON.stringify(demoUser));
          return { success: true };
        }
        const errMsg = (parsed && parsed.error) ? parsed.error : (text || '登录失败');
        return { success: false, error: errMsg };
      }
    } catch (error) {
      console.error('Login error:', error);

      // Offline demo fallback: allow experience when backend is unavailable
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const demoUser = makeDemoUser();
        setUser(demoUser);
        localStorage.setItem('auth_token', DEMO_TOKEN);
        localStorage.setItem('user_data', JSON.stringify(demoUser));
        return { success: true };
      }

      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      console.log('API_BASE_URL:', API_BASE_URL);
      const registerUrl = apiUrl('/auth/register');
      console.log('Register request URL (expected same-origin):', registerUrl);
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      const text = await response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // 保持 parsed 为 null
      }

      const ok = response.ok;
      const success = !!(parsed && parsed.success);
      const userData = parsed?.data?.user ?? null;
      const tokenData = parsed?.data?.token ?? null;

      if (ok && success && userData && tokenData) {
        setUser(userData);
        localStorage.setItem('auth_token', tokenData);
        localStorage.setItem('user_data', JSON.stringify(userData));
        return { success: true };
      }

      const errMsg = (parsed && parsed.error) ? parsed.error : (text || '注册失败');
      return { success: false, error: errMsg };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: '网络错误，请稍后重试' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token && !isDemoToken(token)) {
        // Call logout API when not in demo mode
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      navigate('/login');
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: '用户未登录' };
      }
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: '认证令牌无效' };
      }

      // Demo mode: update locally without backend
      if (isDemoToken(token)) {
        const updatedUser = { ...user, ...data } as User;
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        return { success: true };
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        const updatedUser = { ...user, ...responseData.data.user };
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        return { success: true };
      } else {
        return { success: false, error: responseData.error || '更新失败' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: '网络错误，请稍后重试' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;