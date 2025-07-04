import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function generateRandomPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function truncateString(str, maxLength = 20) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength - 3) + '...';
}

export function getFileIcon(fileType) {
  if (!fileType) return 'file';
  
  if (fileType.includes('image')) return 'image';
  if (fileType.includes('video')) return 'video';
  if (fileType.includes('audio')) return 'audio';
  if (fileType.includes('pdf')) return 'file-text';
  if (fileType.includes('word') || fileType.includes('document')) return 'file-text';
  if (fileType.includes('excel') || fileType.includes('sheet')) return 'file-spreadsheet';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'file-presentation';
  if (fileType.includes('zip') || fileType.includes('compressed')) return 'archive';
  
  return 'file';
}

