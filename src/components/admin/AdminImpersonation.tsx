import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserCheck, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AdminImpersonation = () => {
  const [targetEmail, setTargetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    const email = targetEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch(
        `https://vcgaqikuaaazjpwyzvwb.supabase.co/functions/v1/admin-impersonate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");

      // Open magic link in new tab so admin stays logged in
      window.open(result.action_link, "_blank");
      toast({
        title: "Impersonation link opened",
        description: `A new tab was opened logged in as ${email}. Close it when done.`,
      });
      setTargetEmail("");
    } catch (err: any) {
      toast({
        title: "Impersonation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-foreground text-lg">Admin Impersonation</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Sign in as any user to debug their issues (opens in new tab)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="impersonate-email" className="text-foreground text-sm font-medium">
              User Email
            </Label>
            <Input
              id="impersonate-email"
              type="email"
              placeholder="user@example.com"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImpersonate()}
              className="settings-input"
            />
          </div>
          <Button
            onClick={handleImpersonate}
            disabled={loading || !targetEmail.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            Impersonate
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          ⚠️ This action is logged. The magic link opens in a new tab — your admin session stays active here.
        </p>
      </CardContent>
    </Card>
  );
};
