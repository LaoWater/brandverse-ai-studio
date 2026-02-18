import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserCheck, Loader2, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AdminImpersonation = () => {
  const [targetEmail, setTargetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedForEmail, setGeneratedForEmail] = useState("");

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
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/auth/callback`,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");

      setGeneratedLink(result.action_link || "");
      setGeneratedForEmail(result.target_email || email);
      toast({
        title: "Impersonation link generated",
        description: `Copy and open the link to sign in as ${email}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Impersonation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Link copied",
        description: "Impersonation link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy link. Please copy it manually.",
        variant: "destructive",
      });
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
              Generate a login link for any user and open it in a separate tab
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
            Generate link
          </Button>
        </div>

        {generatedLink && (
          <div className="mt-4 space-y-2">
            <Label className="text-foreground text-sm font-medium">
              Magic link for {generatedForEmail}
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={generatedLink} readOnly className="settings-input font-mono text-xs" />
              <Button type="button" onClick={handleCopyLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => window.open(generatedLink, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          ⚠️ This action is logged. Generate, copy, and open the link in another tab when needed.
        </p>
      </CardContent>
    </Card>
  );
};
