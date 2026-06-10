import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireAuth } from "@/backend/lib/requireAuth";
import { apiSuccess } from "@/backend/lib/utils";

// GET /api/debug/db-health — quick table existence check for production debugging
// Only accessible to authenticated users
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const tables = ["Message", "Poke", "Memory", "MoodEntry", "CalendarEvent", "Note", "TodoItem"];
  const results: Record<string, string> = {};

  for (const table of tables) {
    try {
      // Run a minimal count query against each table
      const key = table.charAt(0).toLowerCase() + table.slice(1) as keyof typeof prisma;
      const model = prisma[key] as any;
      if (model?.count) {
        await model.count({ take: 1 });
        results[table] = "✅ OK";
      } else {
        results[table] = "⚠️ model not found";
      }
    } catch (err: any) {
      results[table] = `❌ ${err?.message ?? "unknown error"}`;
    }
  }

  return apiSuccess({ tables: results, timestamp: new Date().toISOString() });
}
