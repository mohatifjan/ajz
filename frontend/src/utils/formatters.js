// Utility functions for formatting and calculations

export const formatCurrency = (amount) => {
  return 'Rs. ' + Number(amount || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const calculateProfitMargin = (costPrice, sellingPrice) => {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
};

export const calculateMarkup = (costPrice, sellingPrice) => {
  if (costPrice === 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
};

export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (originalPrice === 0) return 0;
  return ((originalPrice - discountedPrice) / originalPrice) * 100;
};

export const isLowStock = (currentStock, reorderLevel) => {
  return currentStock <= reorderLevel;
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getDaysOverdue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhoneNumber = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.length >= 10;
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0)}${lastName?.charAt(0)}`.toUpperCase();
};
