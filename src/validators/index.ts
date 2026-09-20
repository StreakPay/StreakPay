import { z } from "zod";

export const withdrawalRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(500, "Minimum withdrawal is ₦500"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z
    .string()
    .length(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must be digits only"),
  accountName: z.string().min(2, "Account name is required"),
});

export const tradeOrderSchema = z.object({
  side: z.enum(["buy", "sell"]),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive").optional(),
});

export const supportTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const quizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.string().min(1, "Answer is required"),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
export type TradeOrderInput = z.infer<typeof tradeOrderSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type QuizAnswerInput = z.infer<typeof quizAnswerSchema>;
