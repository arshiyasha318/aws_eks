import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorsApi, appointmentsApi } from '../services/api';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  experience: number;
  consultationFee: number;
  imageUrl?: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const BookAppointment = () => {
  const { id: doctorId } = useParams<{ id: string }>();
  const { user: _ } = useAuth();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Debug log for state changes
  useEffect(() => {
    console.log('selectedSlot changed:', selectedSlot);
    console.log('isSubmitting:', isSubmitting);
  }, [selectedSlot, isSubmitting]);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true);
        const response = await doctorsApi.getDoctor(doctorId!);
        setDoctor(response.data);
      } catch (err) {
        console.error('Failed to fetch doctor details', err);
        setError('Failed to load doctor information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!date) return;
      
      try {
        setLoading(true);
        const response = await doctorsApi.getAvailableSlots(doctorId!, date);
        
        // Log the response for debugging
        console.log('Available slots response:', response.data);
        
        // Check if we have available_slots in the response
        const slots = response.data?.available_slots || [];
        
        // Convert time strings to TimeSlot objects
        const formattedSlots = slots.map((timeString: string, index: number) => {
          // Parse the time string (e.g., "09:00") to a Date object
          const time = new Date(`2000-01-01T${timeString}`);
          
          // Calculate end time by adding 30 minutes
          const endTime = new Date(time);
          endTime.setMinutes(endTime.getMinutes() + 30);
          
          // Format times as HH:MM
          const formatTime = (date: Date) => {
            return date.toTimeString().slice(0, 5);
          };
          
          return {
            id: `slot-${index}`,
            startTime: formatTime(time),
            endTime: formatTime(endTime),
            isAvailable: true
          };
        });
        
        console.log('Formatted time slots:', formattedSlots);
        setTimeSlots(formattedSlots);
      } catch (err) {
        console.error('Failed to fetch available slots', err);
        setError('Failed to load available time slots. Please try again.');
        setTimeSlots([]); // Reset to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [date, doctorId]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setSelectedSlot('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot || !date) {
      setError('Please select both date and time slot');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      if (!doctorId) {
        throw new Error('Doctor ID is missing');
      }
      
      const selectedTimeSlot = timeSlots.find(slot => slot.id === selectedSlot);
      if (!selectedTimeSlot) {
        throw new Error('Selected time slot not found');
      }

      // Parse the date and time to create a proper datetime string
      if (!selectedTimeSlot.startTime) {
        throw new Error('Start time is missing');
      }
      
      const scheduledAt = new Date(`${date}T${selectedTimeSlot.startTime}`);
      const doctorIdNum = parseInt(doctorId, 10);
      
      if (isNaN(doctorIdNum)) {
        throw new Error('Invalid doctor ID');
      }
      
      console.log('Creating appointment with data:', {
        doctor_id: doctorIdNum,
        scheduled_at: scheduledAt.toISOString(),
        notes: reason,
      });

      const response = await appointmentsApi.bookAppointment({
        doctor_id: doctorIdNum,
        scheduled_at: scheduledAt.toISOString(),
        notes: reason,
      });

      console.log('Appointment created successfully:', response.data);
      setSuccess(true);
      
      // Redirect to appointments page after a short delay
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to book appointment', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      const errorMessage = err.response?.data?.message || 'Failed to book appointment. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !doctor) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Doctor not found</h1>
          <p className="mt-2 text-gray-600">The requested doctor could not be found.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">Appointment Booked Successfully!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your appointment with Dr. {doctor.name} has been confirmed.</p>
                <p className="mt-1">You will be redirected to your appointments page shortly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate minimum date (tomorrow) and maximum date (30 days from now)
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 1);
  
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);

  const minDateString = minDate.toISOString().split('T')[0];
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Book an Appointment</h2>
            <p className="mt-1 text-sm text-gray-500">
              Schedule a consultation with Dr. {doctor.name}
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Doctor Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Review the doctor's details before booking.
                </p>
                
                <div className="mt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Dr. {doctor.name}</h4>
                      <p className="text-sm text-gray-500">{doctor.specialty}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900">About</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {doctor.bio || 'Experienced doctor providing quality healthcare services.'}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Experience</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {doctor.experience} years of experience
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Consultation Fee</h4>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      ${doctor.consultationFee}
                      <span className="text-sm font-normal text-gray-500"> / session</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleSubmit}>
                  <div className="shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 bg-white sm:p-6">
                      {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
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
                      
                      <div className="grid grid-cols-6 gap-6">
                        <div className="col-span-6 sm:col-span-3">
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Appointment Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            id="date"
                            min={minDateString}
                            max={maxDateString}
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value={date}
                            onChange={handleDateChange}
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Available Time Slots
                          </label>
                          {!date ? (
                            <p className="text-sm text-gray-500">
                              Please select a date to see available time slots
                            </p>
                          ) : loading ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                          ) : timeSlots.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              No available time slots for the selected date. Please choose another date.
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {timeSlots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  disabled={!slot.isAvailable}
                                  onClick={() => {
                                    console.log('Time slot clicked:', slot.id);
                                    setSelectedSlot(slot.id);
                                  }}
                                  className={`py-2 px-3 border rounded-md text-sm font-medium ${
                                    selectedSlot === slot.id
                                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                                      : slot.isAvailable
                                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  {new Date(`2000-01-01T${slot.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="col-span-6">
                          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                            Reason for Visit (Optional)
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="reason"
                              name="reason"
                              rows={3}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                              placeholder="Briefly describe the reason for your visit"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !selectedSlot}
                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                          isSubmitting || !selectedSlot
                            ? 'bg-blue-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {isSubmitting ? 'Booking...' : 'Book Appointment'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
