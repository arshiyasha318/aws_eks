import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  doctorProfile?: {
    specialty?: string;
    education?: string;
    experience?: number;
    bio?: string;
    consultationFee?: number;
    availableDays?: string[];
    availableHours?: {
      start: string;
      end: string;
    };
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'patient' | 'doctor') => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User> & { doctorProfile?: any }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage if available
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/users/profile');
          // Handle the nested user object in the response
          const userData = response.data.user || response.data;
          setUser({
            id: String(userData.ID || userData.id),
            name: userData.name,
            email: userData.email,
            role: userData.role || 'patient',
            // Add other fields as needed
          });
          // Update localStorage with the formatted user data
          localStorage.setItem('user', JSON.stringify({
            id: String(userData.ID || userData.id),
            name: userData.name,
            email: userData.email,
            role: userData.role || 'patient',
          }));
        }
      } catch (error) {
        console.error('Failed to load user', error);
        // Clear invalid token and user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    const formattedUser = {
      id: String(userData.ID || userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role || 'patient',
    };
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(formattedUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(formattedUser);
    
    // Redirect based on role
    if (formattedUser.role === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/');
    }
  };

  const register = async (name: string, email: string, password: string, role: 'patient' | 'doctor') => {
    const response = await api.post('/auth/register', { name, email, password, role });
    const { token, user: userData } = response.data;
    
    const formattedUser = {
      id: String(userData.ID || userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role || role,
    };
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(formattedUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(formattedUser);
    
    // Redirect based on role
    if (formattedUser.role === 'doctor') {
      navigate('/doctor/profile/setup');
    } else {
      navigate('/');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  const updateUser = async (updates: Partial<User> & { doctorProfile?: any }) => {
    const updatedUser = { ...user, ...updates } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    try {
      const response = await api.put('/users/profile', updates);
      setUser(prevUser => ({
        ...prevUser!,
        ...updates,
        doctorProfile: {
          ...prevUser?.doctorProfile,
          ...updates.doctorProfile
        }
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to update user', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
