import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert 24h time string (HH:mm) to 12h format (h:mm AM/PM)
 */
export function formatTime12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Open WhatsApp chat with a phone number
 */
export function openWhatsApp(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}`, '_blank');
}
