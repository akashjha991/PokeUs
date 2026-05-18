"use client";

import { AppShell } from "@/frontend/components/layouts/AppShell";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell, Globe, Palette, Shield, Trash2, LogOut, ChevronRight, HeartOff } from "lucide-react";
import Link from "next/link";
import { useAuthStore, useUIStore } from "@/frontend/store";
import { toast } from "sonner";

function SettingRow({ icon, label, desc, children }: { icon: React.ReactNode; label: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgb(var(--surface-muted))" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "rgb(var(--text))" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "rgb(var(--text-muted))" }}>{desc}</p>}
      </div>
      {children || <ChevronRight size={16} style={{ color: "rgb(var(--text-subtle))" }} />}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
      style={{ background: checked ? "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-secondary)))" : "rgb(var(--surface-subtle))" }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout, couple, setCouple } = useAuthStore();
  const { colorTheme, setColorTheme } = useUIStore();
  const isDark = theme === "dark";

  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsPushSupported(true);
      navigator.serviceWorker.ready
        .then(async (registration) => {
          const subscription = await registration.pushManager.getSubscription();
          setIsPushEnabled(!!subscription);
        })
        .catch((err) => console.error("Error checking push status:", err))
        .finally(() => setIsPushLoading(false));
    } else {
      setIsPushLoading(false);
    }
  }, []);

  async function handlePushToggle(enable: boolean) {
    if (!isPushSupported) {
      toast.error("Push notifications are not supported by this browser.");
      return;
    }

    setIsPushLoading(true);
    try {
      if (enable) {
        // Request Notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notification permission denied. Please enable them in browser settings.");
          setIsPushEnabled(false);
          setIsPushLoading(false);
          return;
        }

        // Register Service Worker and Subscribe
        const registration = await navigator.serviceWorker.register("/sw.js");
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error("VAPID public key not found in environment configuration.");
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // Send subscription to server
        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });

        if (res.ok) {
          setIsPushEnabled(true);
          toast.success("Push notifications enabled! 💜");
        } else {
          const data = await res.json();
          throw new Error(data.error || "Failed to register push subscription");
        }
      } else {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "unsubscribe",
              endpoint: subscription.endpoint,
            }),
          });
        }
        setIsPushEnabled(false);
        toast.info("Push notifications disabled.");
      }
    } catch (err: any) {
      console.error("Push toggle error:", err);
      toast.error(err.message || "Failed to update notification settings");
    } finally {
      setIsPushLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    window.location.href = "/login";
  }

  async function handleRemoveConnection() {
    if (!confirm("Are you sure you want to remove your connection? This will permanently delete ALL shared messages, memories, and data. This action cannot be undone.")) return;

    try {
      const res = await fetch("/api/couple/remove", { method: "POST" });
      if (res.ok) {
        toast.success("Connection removed permanently.");
        setCouple(null); // Clear couple from state
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove connection");
      }
    } catch (e) {
      toast.error("Something went wrong");
    }
  }

  const themeColors = [
    { id: "purple", color: "#d946ef" },
    { id: "ocean", color: "#0ea5e9" },
    { id: "emerald", color: "#10b981" },
    { id: "sunset", color: "#f97316" }
  ];

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-24 space-y-5" style={{ color: "rgb(var(--text))" }}>
        <div>
          <h1 className="font-display font-bold text-2xl">Settings</h1>
          <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Personalize your experience</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgb(var(--text-subtle))" }}>Appearance</p>
          <div className="space-y-2">
            <SettingRow
              icon={isDark ? <Moon size={18} style={{ color: "#8b5cf6" }} /> : <Sun size={18} style={{ color: "#f59e0b" }} />}
              label="Dark Mode"
              desc="Switch between light and dark theme"
            >
              <Toggle checked={isDark} onChange={(v) => setTheme(v ? "dark" : "light")} />
            </SettingRow>
            <SettingRow
              icon={<Palette size={18} style={{ color: "rgb(var(--brand))" }} />}
              label="Couple Theme"
              desc="Customize your shared space colors"
            >
              <div className="flex items-center gap-2">
                {themeColors.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setColorTheme(c.id as any)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${colorTheme === c.id ? "border-white scale-110 shadow-sm" : "border-transparent"}`}
                    style={{ background: c.color }}
                  />
                ))}
              </div>
            </SettingRow>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgb(var(--text-subtle))" }}>Notifications</p>
          <div className="space-y-2">
            <SettingRow
              icon={<Bell size={18} style={{ color: "#3b82f6" }} />}
              label="Push Notifications"
              desc={
                !isPushSupported
                  ? "Not supported by this browser"
                  : isPushLoading
                  ? "Checking subscription..."
                  : "Messages and activity alerts"
              }
            >
              <Toggle checked={isPushEnabled && isPushSupported} onChange={handlePushToggle} />
            </SettingRow>
            <SettingRow
              icon={<Bell size={18} style={{ color: "#10b981" }} />}
              label="Anniversary Reminders"
              desc="Get reminded before special dates"
            >
              <Toggle checked={true} onChange={() => {}} />
            </SettingRow>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgb(var(--text-subtle))" }}>Privacy & Security</p>
          <div className="space-y-2">
            <SettingRow
              icon={<Shield size={18} style={{ color: "#10b981" }} />}
              label="Change Password"
              desc="Update your account password"
            />
            <Link href="/privacy" className="block">
              <SettingRow
                icon={<Globe size={18} style={{ color: "#3b82f6" }} />}
                label="Privacy Policy"
              />
            </Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgb(var(--text-subtle))" }}>Danger Zone</p>
          <div className="space-y-2">
            <button onClick={handleLogout} className="card w-full flex items-center gap-3 p-4 text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
                <LogOut size={18} style={{ color: "#f59e0b" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>Sign Out</p>
                <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>Log out of this device</p>
              </div>
            </button>
            {couple && (
              <button onClick={handleRemoveConnection} className="card w-full flex items-center gap-3 p-4 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <HeartOff size={18} style={{ color: "rgb(239,68,68)" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "rgb(239,68,68)" }}>Disconnect Partner</p>
                  <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>Remove connection and delete all shared messages/data</p>
                </div>
              </button>
            )}
            <button className="card w-full flex items-center gap-3 p-4 text-left">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                <Trash2 size={18} style={{ color: "rgb(239,68,68)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "rgb(239,68,68)" }}>Delete Account</p>
                <p className="text-xs" style={{ color: "rgb(var(--text-subtle))" }}>Permanently remove all your data</p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-xs pb-4" style={{ color: "rgb(var(--text-subtle))" }}>
          PokeUs v1.0.0 · Made with 💜
        </p>
      </div>
    </AppShell>
  );
}
