"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IncidentReport } from "@prisma/client";

interface IncomingReportsProps {
  reports: IncidentReport[];
  onRefresh: () => void;
}

export function IncomingReports({ reports, onRefresh }: IncomingReportsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Simulated social / public reports for triage
        </p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {reports.slice(0, 10).map((r) => (
          <Card
            key={r.id}
            className="bg-slate-900/50 border-slate-700 overflow-hidden"
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{r.rawText}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs border-slate-600">
                      {r.platform}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {(r.confidence * 100).toFixed(0)}% confidence
                    </span>
                    {r.extractedLocation && (
                      <span className="text-xs text-slate-500 truncate">
                        → {r.extractedLocation}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(r.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Link
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    New
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500">
                    Dup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
