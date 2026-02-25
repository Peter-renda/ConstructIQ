import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export const STAGES = ['bidding', 'pre-construction', 'course-of-construction', 'post-construction', 'warranty'];

export const STAGE_COLORS = {
  'bidding': 'bg-purple-100 text-purple-700',
  'pre-construction': 'bg-blue-100 text-blue-700',
  'course-of-construction': 'bg-yellow-100 text-yellow-700',
  'post-construction': 'bg-green-100 text-green-700',
  'warranty': 'bg-orange-100 text-orange-700',
};

export const STAGE_LABELS = {
  'bidding': 'Bidding',
  'pre-construction': 'Pre-Construction',
  'course-of-construction': 'Course of Construction',
  'post-construction': 'Post-Construction',
  'warranty': 'Warranty',
};
