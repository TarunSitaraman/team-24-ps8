import { z } from "zod";

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .describe("Date in YYYY-MM-DD format");

export const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(4000),
});

export const agentRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const transferRequestSchema = z.object({
  from_account: z.string().min(1, "Source account is required"),
  to_account: z.string().min(1, "Destination account is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
});

export const budgetRequestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  monthly_limit: z.number().positive("Monthly limit must be greater than 0"),
  alert_at_pct: z.number().min(10).max(100).default(80),
});
