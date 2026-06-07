import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2).max(50),
  bio: z.string().max(200).optional(),
});

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required"),
  color: z.string().optional(),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum(["FOOD","TRAVEL","ENTERTAINMENT","SHOPPING","HEALTH","UTILITIES","OTHER"]),
  splitType: z.enum(["EQUAL", "FULL_ME", "FULL_PARTNER"]),
  note: z.string().max(300).optional(),
});

export const calendarEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  date: z.string().min(1, "Date is required"),
  eventType: z.enum(["ANNIVERSARY","BIRTHDAY","DATE","TRIP","MILESTONE","OTHER"]),
  isRecurring: z.boolean().optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "STICKER", "FILE"]).optional(),
  replyToId: z.string().optional(),
});

export const memorySchema = z.object({
  title: z.string().min(1).max(100),
  caption: z.string().max(500).optional(),
  date: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type MemoryInput = z.infer<typeof memorySchema>;
