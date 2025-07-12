import { files, type File, type InsertFile } from "@shared/schema";

export interface IStorage {
  getFiles(userId: string): Promise<File[]>;
  getFileByHash(hash: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private files: Map<number, File>;
  private currentId: number;

  constructor() {
    this.files = new Map();
    this.currentId = 1;
  }

  async getFiles(userId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.userId === userId);
  }

  async getFileByHash(hash: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(file => file.hash === hash);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentId++;
    const file: File = {
      ...insertFile,
      id,
      encrypted: insertFile.encrypted ?? false,
      uploadDate: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: number, userId: string): Promise<boolean> {
    const file = this.files.get(id);
    if (file && file.userId === userId) {
      this.files.delete(id);
      return true;
    }
    return false;
  }
}

export const storage = new MemStorage();
