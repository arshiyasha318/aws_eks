import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../services/api';
import { formatDate, formatTime, isPastDate } from '../utils/dateUtils';

interface User {
  ID: number;
  name: string;
  email: string;
  // Add other user fields as needed
}

interface Doctor {
  ID: number;
  user: User;
  specialization: string;
  // Add other doctor fields as needed
}

interface Patient {
  ID: number;
  User: User;
  // Add other patient fields as needed
}

interface Appointment {
  ID: number;
  doctor_id: number;
  doctor?: Doctor;  // Make it optional since it might come as 'doctor' or 'Doctor'
  Doctor?: Doctor; // Keep for backward compatibility
  patient_id: number;
  Patient: Patient;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason: string;
  notes: string;
  is_follow_up: boolean;
  is_paid: boolean;
  payment_amount: number;
  created_at: string;
  updated_at: string;
}

// Helper function to get the doctor from an appointment, handling both 'doctor' and 'Doctor' properties
const getDoctor = (appointment: Appointment): Doctor | undefined => {
  return appointment.doctor || appointment.Doctor;
};

// Helper function to get the doctor's name
const getDoctorName = (appointment: Appointment): string => {
  const doctor = getDoctor(appointment);
  return doctor?.user?.name || 'Unknown Doctor';
};

// Helper function to get the doctor's specialization
const getDoctorSpecialization = (appointment: Appointment): string => {
  const doctor = getDoctor(appointment);
  return doctor?.specialization || 'General Practice';
};

const Appointments = () => {
  const { user: _ } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        // Get appointments for the current user
        const response = await appointmentsApi.getPatientAppointments();
        console.log('Full response:', JSON.stringify(response, null, 2));
        
        if (response.data && response.data.length > 0) {
          console.log('First appointment:', response.data[0]);
          // Log all keys in the first appointment
          console.log('First appointment keys:', Object.keys(response.data[0]));
          // Log the doctor data directly from the response
          console.log('Doctor data from response:', response.data[0].doctor);
        }
        
        // Map the response to match our interface
        const formattedAppointments = response.data.map((appt: any) => ({
          ...appt,
          // If the backend returns 'doctor' instead of 'Doctor', map it
          Doctor: appt.doctor || appt.Doctor
        }));
        
        setAppointments(formattedAppointments);
      } catch (err) {
        console.error('Failed to fetch appointments', err);
        setError('Failed to load appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [activeTab]);



  const filteredAppointments = appointments.filter(appointment => {
    if (!appointment.start_time) return false;
    
    const isPast = isPastDate(appointment.start_time);
    return activeTab === 'upcoming' ? !isPast : isPast;
  });

  const cancelAppointment = async (appointmentId: number) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsApi.cancelAppointment(appointmentId.toString());
        setAppointments(prevAppointments => 
          prevAppointments.map(appt => 
            appt.ID === appointmentId ? { ...appt, status: 'cancelled' } : appt
          )
        );
      } catch (err) {
        console.error('Failed to cancel appointment', err);
        setError('Failed to cancel appointment. Please try again.');
      }
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="mt-2 text-sm text-gray-600">
              {activeTab === 'upcoming' 
                ? 'View and manage your upcoming appointments.'
                : 'View your past appointment history.'}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/doctors"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Book New Appointment
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`${activeTab === 'upcoming' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Upcoming Appointments
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`${activeTab === 'past' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Past Appointments
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'upcoming' 
                  ? "You don't have any upcoming appointments."
                  : "You don't have any past appointments."}
              </p>
              <div className="mt-6">
                <Link
                  to="/doctors"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Book New Appointment
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md mt-6">
              <ul className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <li key={appointment.ID}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600 truncate">
                            Doctor: {getDoctorName(appointment) || 'Unknown Doctor'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getDoctorSpecialization(appointment) || 'General Practice'}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'scheduled' || appointment.status === 'pending'
                              ? 'bg-green-100 text-green-800' 
                              : appointment.status === 'completed' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {formatDate(appointment.appointment_date)}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051c.92.52 1.63 1.18 2.09 1.92a6.5 6.5 0 011.66 4.33h1.98a6.5 6.5 0 011.66-4.33c.46-.74 1.17-1.4 2.09-1.92l1.644-.82a1 1 0 00-.87-1.8l-7 3z" />
                            <path d="M5.25 12.75a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75z" />
                            <path d="M14.25 12.75a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75z" />
                          </svg>
                          {appointment.Doctor?.specialization || 'General Practice'}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">Reason:</span> {appointment.reason || 'General checkup'}
                        </p>
                      </div>
                      {activeTab === 'upcoming' && appointment.status === 'scheduled' && (
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => cancelAppointment(appointment.ID)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel Appointment
                          </button>
                          <Link
                            to={`/book-appointment?doctor_id=${appointment.doctor_id}&appointment_id=${appointment.ID}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Reschedule
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
