// API request/response interceptor and error handler

export const handleApiError = (error) => {
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      status: 'error'
    };
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return {
        message: data.message || 'Invalid request',
        status: 'validation_error',
        errors: data.errors
      };
    case 401:
      return {
        message: 'Session expired. Please login again.',
        status: 'auth_error'
      };
    case 403:
      return {
        message: 'You do not have permission to access this resource.',
        status: 'forbidden'
      };
    case 404:
      return {
        message: 'Resource not found.',
        status: 'not_found'
      };
    case 409:
      return {
        message: data.message || 'Conflict with existing data.',
        status: 'conflict'
      };
    case 500:
      return {
        message: 'Server error. Please try again later.',
        status: 'server_error'
      };
    default:
      return {
        message: data.message || 'An error occurred',
        status: 'error'
      };
  }
};

export const handleSuccess = (response) => {
  return {
    message: response.data?.message || 'Success',
    data: response.data?.data,
    status: 'success'
  };
};

export const validateFormData = (data, schema) => {
  const errors = {};

  Object.keys(schema).forEach(key => {
    const rule = schema[key];
    const value = data[key];

    if (rule.required && (!value || value === '')) {
      errors[key] = `${rule.label || key} is required`;
    }

    if (rule.type === 'email' && value && !value.includes('@')) {
      errors[key] = 'Invalid email address';
    }

    if (rule.type === 'number' && value && isNaN(value)) {
      errors[key] = 'Must be a number';
    }

    if (rule.minLength && value && value.length < rule.minLength) {
      errors[key] = `Minimum ${rule.minLength} characters required`;
    }

    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[key] = `Maximum ${rule.maxLength} characters allowed`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
