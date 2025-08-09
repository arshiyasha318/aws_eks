import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1';

// Create the axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Use type assertion to set the authorization header
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden - User doesn't have permission
        console.error('Access denied: You do not have permission to perform this action');
      } else if (status === 404) {
        // Not found
        console.error('The requested resource was not found');
      } else if (status >= 500) {
        // Server error
        console.error('A server error occurred. Please try again later.');
      }
      
      console.error('Response error:', error.response.data);
      console.error('Status:', status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up the request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string): Promise<AxiosResponse> => 
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, role: string): Promise<AxiosResponse> => 
    api.post('/auth/register', { name, email, password, role }),
};

// Appointments API
export const appointmentsApi = {
  // Patient appointment endpoints
  getPatientAppointments: () => api.get('/patients/appointments'),
  bookAppointment: (data: any) => api.post('/patients/appointments', data),
  cancelAppointment: (id: string) => api.put(`/patients/appointments/${id}/cancel`),
  
  // Doctor appointment endpoints
  getDoctorAppointments: () => api.get('/doctors/appointments'),
  updateAppointmentStatus: (id: string, status: string) => 
    api.put(`/doctors/appointments/${id}/status`, { status }),
};

// Doctors API
export const doctorsApi = {
  // Public endpoints (no auth required)
  getDoctors: () => api.get('/doctors'),
  getDoctor: (id: string) => api.get(`/doctors/${id}`),
  
  // Patient endpoints
  getAvailableSlots: (doctorId: string, date: string) => 
    api.get(`/patients/doctors/${doctorId}/availability`, { params: { date } }),
  
  // Doctor endpoints (protected)
  getDoctorDashboard: () => api.get('/doctors/dashboard'),
  createSchedule: (data: any) => api.post('/doctors/schedules', data),
};

// Users API
export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

// Admin API
export const adminApi = {
  // User management
  listAllUsers: () => api.get('/admin/users'),
  updateUserStatus: (id: string, status: string) => 
    api.put(`/admin/users/${id}/status`, { status }),
  
  // Appointments
  listAllAppointments: () => api.get('/admin/appointments'),
};

export default api;
