import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  hash: text("hash").notNull().unique(),
  encrypted: boolean("encrypted").notNull().default(false),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  userId: text("user_id").notNull(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadDate: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
