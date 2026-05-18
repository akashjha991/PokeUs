// ============================================================
// SHARED TYPE DEFINITIONS — Used by both Frontend & Backend
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  xpPoints: number;
  streakDays: number;
  lastActiveAt: string;
  createdAt: string;
}

export interface Couple {
  id: string;
  user1: User;
  user2: User;
  theme: string;
  anniversaryDate?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  coupleId: string;
  senderId: string;
  sender: User;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "STICKER";
  mediaUrl?: string;
  reaction?: string;
  replyToId?: string;
  replyTo?: Message;
  seenAt?: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  coupleId: string;
  createdById: string;
  createdBy: User;
  title: string;
  caption?: string;
  date: string;
  photos: MemoryPhoto[];
  createdAt: string;
}

export interface MemoryPhoto {
  id: string;
  url: string;
  publicId: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  user: User;
  mood: string;
  emoji: string;
  note?: string;
  date: string;
}

export interface Note {
  id: string;
  coupleId: string;
  createdBy: User;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  coupleId: string;
  title: string;
  isDone: boolean;
  category: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  coupleId: string;
  paidBy: User;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  note?: string;
  date: string;
}

export type ExpenseCategory = "FOOD" | "TRAVEL" | "ENTERTAINMENT" | "SHOPPING" | "HEALTH" | "UTILITIES" | "OTHER";
export type SplitType = "EQUAL" | "FULL_ME" | "FULL_PARTNER";

export interface CalendarEvent {
  id: string;
  coupleId: string;
  createdBy: User;
  title: string;
  description?: string;
  date: string;
  isRecurring: boolean;
  eventType: EventType;
}

export type EventType = "ANNIVERSARY" | "BIRTHDAY" | "DATE" | "TRIP" | "MILESTONE" | "OTHER";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  xpReward: number;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  earnedAt: string;
}

export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
