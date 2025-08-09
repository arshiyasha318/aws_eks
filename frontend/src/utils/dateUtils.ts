// Format date for display
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  };
  
  try {
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Format time for display
export const formatTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

// Format date and time together
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

// Check if a date is in the past
export const isPastDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  } catch (error) {
    console.error('Error checking date:', error);
    return false;
  }
};
