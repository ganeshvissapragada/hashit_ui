import { File } from "@shared/schema";

export interface StorageData {
  files: File[];
  recentUploads: File[];
  networkStatus: {
    online: boolean;
    gasPrice: string;
    blockHeight: string;
  };
  storageUsed: number;
  storageTotal: number;
}

const STORAGE_KEY = "blockchain-vault-data";

export function getStorageData(): StorageData {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Error parsing storage data:", error);
    }
  }
  
  return {
    files: [],
    recentUploads: [],
    networkStatus: {
      online: true,
      gasPrice: "12 Gwei",
      blockHeight: "18,234,567",
    },
    storageUsed: 0,
    storageTotal: 10 * 1024 * 1024 * 1024, // 10GB
  };
}

export function setStorageData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateStorageUsed(size: number): void {
  const data = getStorageData();
  data.storageUsed += size;
  setStorageData(data);
}

export function addRecentUpload(file: File): void {
  const data = getStorageData();
  data.recentUploads.unshift(file);
  data.recentUploads = data.recentUploads.slice(0, 5); // Keep only last 5
  setStorageData(data);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}
