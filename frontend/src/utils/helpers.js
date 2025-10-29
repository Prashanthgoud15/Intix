// Utility helper functions

/**
 * Convert canvas to base64 image
 */
export const canvasToBase64 = (canvas) => {
  return canvas.toDataURL('image/jpeg', 0.8);
};

/**
 * Convert video frame to base64
 */
export const captureVideoFrame = (videoElement) => {
  try {
    if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      console.warn('Video element not ready for capture');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return null;
    }
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Error capturing video frame:', error);
    return null;
  }
};

/**
 * Convert audio blob to base64
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Format duration in seconds to MM:SS
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format timestamp to readable date
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get confidence color based on score
 */
export const getConfidenceColor = (score) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get confidence background color
 */
export const getConfidenceBgColor = (score) => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
};

/**
 * Get confidence gradient position
 */
export const getConfidenceGradientPosition = (score) => {
  return `${score}%`;
};

/**
 * Generate unique session ID
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Download data as JSON file
 */
export const downloadJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Check if browser supports required features
 */
export const checkBrowserSupport = () => {
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasMediaRecorder = !!window.MediaRecorder;
  
  return {
    supported: hasMediaDevices && hasMediaRecorder,
    mediaDevices: hasMediaDevices,
    mediaRecorder: hasMediaRecorder,
  };
};

/**
 * Request camera and microphone permissions
 */
export const requestMediaPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return { success: true, stream };
  } catch (error) {
    console.error('Error requesting media permissions:', error);
    return { success: false, error: error.message };
  }
};
