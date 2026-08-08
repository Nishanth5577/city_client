import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

export const formatRelative = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const isOverdue = (date) => {
  if (!date) return false;
  return isBefore(new Date(date), new Date());
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getProgressColor = (percentage) => {
  if (percentage >= 80) return 'from-emerald-500 to-emerald-600';
  if (percentage >= 50) return 'from-blue-500 to-blue-600';
  if (percentage >= 25) return 'from-amber-500 to-amber-600';
  return 'from-red-500 to-red-600';
};

export const truncate = (str, len = 50) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};
