"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-6" style={{ color: "rgb(var(--text))" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl flex items-center justify-center border" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-2xl">Privacy Policy</h1>
        </div>

        <div className="card p-5 space-y-4">
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="font-bold text-lg mt-4">1. Your Private Space</h2>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))", lineHeight: "1.6" }}>
            PokeUs is designed as a private space strictly between you and your connected partner. The memories, chats, and data you share are intended solely for this 1-on-1 connection.
          </p>

          <h2 className="font-bold text-lg mt-4">2. Data We Collect</h2>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))", lineHeight: "1.6" }}>
            We only collect the data you provide to us, including your profile information (name, email) and the content you upload (memories, chats, moods) to ensure the platform functions for your relationship.
          </p>

          <h2 className="font-bold text-lg mt-4">3. Security</h2>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))", lineHeight: "1.6" }}>
            We take security seriously. Your authentication tokens are securely encrypted, and your data is stored in isolated database tables strictly linked to your unique couple ID. No other users can access your shared space.
          </p>

          <h2 className="font-bold text-lg mt-4">4. Deleting Your Data</h2>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))", lineHeight: "1.6" }}>
            You have the right to request the deletion of your account and all associated data at any time through the Settings page. Once deleted, memories and chats cannot be recovered.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
