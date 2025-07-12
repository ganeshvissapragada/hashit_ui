import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import crypto from "crypto";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user files
  app.get("/api/files", async (req, res) => {
    try {
      const userId = "default-user"; // In a real app, this would come from authentication
      const files = await storage.getFiles(userId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to get files" });
    }
  });

  // Upload file
  app.post("/api/files", upload.single("file"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { encrypted } = req.body;
      const userId = "default-user"; // In a real app, this would come from authentication
      
      // Generate SHA-256 hash
      const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      
      // Check if file already exists
      const existingFile = await storage.getFileByHash(hash);
      if (existingFile) {
        return res.status(409).json({ error: "File already exists" });
      }

      const fileData = {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        hash,
        encrypted: encrypted === 'true',
        userId,
      };

      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Verify file
  app.post("/api/files/verify", upload.single("file"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Generate SHA-256 hash
      const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      
      // Check if file exists in storage
      const existingFile = await storage.getFileByHash(hash);
      
      res.json({
        verified: !!existingFile,
        file: existingFile,
        hash,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify file" });
    }
  });

  // Delete file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = "default-user"; // In a real app, this would come from authentication
      
      const deleted = await storage.deleteFile(fileId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
