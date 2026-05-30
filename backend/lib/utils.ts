import { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ");
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function formatChatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const crypto = require("crypto");
  return Array.from({ length: 8 }, () => {
    const index = crypto.randomInt(0, chars.length);
    return chars[index];
  }).join("");
}


export function getXPLevel(xp: number): {
  level: number;
  title: string;
  nextLevelXP: number;
  progress: number;
} {
  const levels = [
    { min: 0, title: "New Couple" },
    { min: 100, title: "Sweethearts" },
    { min: 300, title: "Lovebirds" },
    { min: 600, title: "Soulmates" },
    { min: 1000, title: "Eternal Partners" },
    { min: 1500, title: "Legendary Lovers" },
  ];

  let level = 1;
  let title = levels[0].title;
  let nextLevelXP = levels[1].min;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].min) {
      level = i + 1;
      title = levels[i].title;
      nextLevelXP = levels[i + 1]?.min || levels[i].min * 2;
      break;
    }
  }

  const currentMin = levels[level - 1].min;
  const progress = Math.min(
    ((xp - currentMin) / (nextLevelXP - currentMin)) * 100,
    100
  );

  return { level, title, nextLevelXP, progress };
}

export function getMoodLabel(emoji: string): string {
  const moods: Record<string, string> = {
    "😍": "In Love",
    "😊": "Happy",
    "🥰": "Adoring",
    "😌": "Content",
    "😴": "Tired",
    "😢": "Sad",
    "😤": "Frustrated",
    "😰": "Anxious",
    "🤒": "Sick",
    "🤩": "Excited",
  };
  return moods[emoji] || "Unknown";
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}
