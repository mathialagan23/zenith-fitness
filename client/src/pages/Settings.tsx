import { useEffect, useState } from "react";
import { GlowCard } from "@/components/GlowCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Save, LogOut, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store";
import { useUIStore } from "@/store";
import { userService } from "@/services";
import type { UpdateUserData } from "@/types";

const Settings = () => {
  const { logout } = useAuthStore();
  const { showToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    weight: "",
    height: "",
    goal: "maintenance",
    dailyCalories: "",
    proteinTarget: "",
    waterTarget: "",
    name: "",
    email: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profile = await userService.getProfile();
        setSettings({
          weight: profile.weight?.toString() || "",
          height: profile.height?.toString() || "",
          // User model now stores "goal" only; daily targets live in Plan
          goal: profile.goal || "maintenance",
          // Leave daily targets blank for now (managed via Plan wizard)
          dailyCalories: "",
          proteinTarget: "",
          waterTarget: "",
          name: profile.name || "",
          email: profile.email || "",
        });
      } catch (err) {
        setError("Failed to load profile settings");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const update = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updateData: UpdateUserData = {
        name: settings.name || undefined,
        weight: settings.weight ? parseFloat(settings.weight) : undefined,
        height: settings.height ? parseFloat(settings.height) : undefined,
        goal: settings.goal as UpdateUserData["goal"],
      };

      await userService.updateProfile(updateData);
      showToast("Settings saved successfully!", "success");
    } catch (err) {
      setError("Failed to save settings");
      showToast("Failed to save settings", "error");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Logged out successfully", "success");
    } catch {
      showToast("Failed to logout", "error");
    }
  };

  const inputClass =
    "w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm text-foreground border border-border focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors";

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2 bg-secondary" />
          <Skeleton className="h-5 w-64 bg-secondary" />
        </div>
        <Skeleton className="h-48 rounded-2xl bg-secondary" />
        <Skeleton className="h-64 rounded-2xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your fitness profile</p>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-neon-red/10 border border-neon-red/30 text-neon-red text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Account Info */}
      <GlowCard glowColor="blue" delay={0.05}>
        <h3 className="font-display font-semibold text-foreground mb-5">Account</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              value={settings.email}
              disabled
              className={`${inputClass} opacity-50 cursor-not-allowed`}
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
        </div>
      </GlowCard>

      <GlowCard glowColor="purple" delay={0.1}>
        <h3 className="font-display font-semibold text-foreground mb-5">Body Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={settings.weight}
              onChange={(e) => update("weight", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</label>
            <input
              type="number"
              value={settings.height}
              onChange={(e) => update("height", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </GlowCard>

      <GlowCard glowColor="green" delay={0.2}>
        <h3 className="font-display font-semibold text-foreground mb-5">Goals</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Current Goal</label>
            <select
              value={settings.goal}
              onChange={(e) => update("goal", e.target.value)}
              className={inputClass}
            >
              <option value="cutting">Cutting</option>
              <option value="bulking">Bulking</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Daily Calorie Target</label>
            <input
              type="number"
              value={settings.dailyCalories}
              onChange={(e) => update("dailyCalories", e.target.value)}
              placeholder="e.g., 2200"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Protein Target (g)</label>
            <input
              type="number"
              value={settings.proteinTarget}
              onChange={(e) => update("proteinTarget", e.target.value)}
              placeholder="e.g., 140"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Water Target (L)</label>
            <input
              type="number"
              step="0.5"
              value={settings.waterTarget}
              onChange={(e) => update("waterTarget", e.target.value)}
              placeholder="e.g., 3"
              className={inputClass}
            />
          </div>
        </div>
      </GlowCard>

      <div className="space-y-3">
        <Button 
          variant="neon" 
          className="w-full rounded-xl h-12 text-base gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>

        <Button 
          variant="outline" 
          className="w-full rounded-xl h-12 text-base gap-2 border-neon-red/30 text-neon-red hover:bg-neon-red/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Settings;
