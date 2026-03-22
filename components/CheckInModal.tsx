"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrCode } from "lucide-react";

interface Assignment {
  id: string;
  status: string;
  volunteer: { fullName: string };
}

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkInCode: string;
  incidentTitle: string;
  assignments?: Assignment[];
  onCheckIn: (code: string, assignmentId?: string) => Promise<boolean>;
}

export function CheckInModal({
  open,
  onOpenChange,
  checkInCode,
  incidentTitle,
  assignments = [],
  onCheckIn,
}: CheckInModalProps) {
  const [code, setCode] = useState(checkInCode || "");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibles = assignments.filter((a) =>
    ["ASSIGNED", "CONFIRMED"].includes(a.status)
  );

  useEffect(() => {
    if (open) {
      setCode(checkInCode || "");
      setError(null);
      const e = assignments.filter((a) =>
        ["ASSIGNED", "CONFIRMED"].includes(a.status)
      );
      setAssignmentId(e.length === 1 ? e[0].id : "");
    }
  }, [open, checkInCode, assignments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ok = await onCheckIn(code.toUpperCase(), assignmentId || undefined);
      if (ok) {
        onOpenChange(false);
        setCode("");
        setAssignmentId("");
      } else {
        setError("Invalid check-in code or no eligible volunteer. Try again.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check In Volunteer</DialogTitle>
          <DialogDescription>
            Volunteer enters the site code for <strong>{incidentTitle}</strong>.
            Select who is checking in.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
            <QrCode className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Site code: <code className="font-mono font-bold">{checkInCode}</code>
          </p>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <Label htmlFor="code">Check-in Code (from volunteer)</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="font-mono uppercase mt-1"
              />
            </div>
            {eligibles.length > 0 && (
              <div>
                <Label>Volunteer checking in</Label>
                <Select value={assignmentId} onValueChange={setAssignmentId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select volunteer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibles.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.volunteer.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length < 6}
            >
              {loading ? "Checking in..." : "Check In"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
