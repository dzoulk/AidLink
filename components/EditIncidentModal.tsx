"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Incident } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  locationName: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  severityScore: z.number().min(1).max(10),
  volunteersNeeded: z.number().min(1),
  safetyNote: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditIncidentModalProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: FormData) => Promise<void>;
}

export function EditIncidentModal({
  incident,
  open,
  onOpenChange,
  onSave,
}: EditIncidentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: incident
      ? {
          title: incident.title,
          description: incident.description ?? "",
          locationName: incident.locationName,
          lat: incident.lat,
          lng: incident.lng,
          severityScore: incident.severityScore,
          volunteersNeeded: incident.volunteersNeeded,
          safetyNote: incident.safetyNote ?? "",
        }
      : undefined,
  });

  useEffect(() => {
    if (incident) {
      reset({
        title: incident.title,
        description: incident.description ?? "",
        locationName: incident.locationName,
        lat: incident.lat,
        lng: incident.lng,
        severityScore: incident.severityScore,
        volunteersNeeded: incident.volunteersNeeded,
        safetyNote: incident.safetyNote ?? "",
      });
    }
  }, [incident, reset]);

  if (!incident) return null;

  const onSubmit = async (data: FormData) => {
    await onSave(incident.id, data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} className="mt-1" />
            {errors.title && (
              <p className="text-sm text-destructive mt-0.5">{errors.title.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="locationName">Location Name</Label>
            <Input id="locationName" {...register("locationName")} className="mt-1" />
            {errors.locationName && (
              <p className="text-sm text-destructive mt-0.5">{errors.locationName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                {...register("lat", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                {...register("lng", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severityScore">Severity (1-10)</Label>
              <Input
                id="severityScore"
                type="number"
                min={1}
                max={10}
                {...register("severityScore", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="volunteersNeeded">Volunteers Needed</Label>
              <Input
                id="volunteersNeeded"
                type="number"
                min={1}
                {...register("volunteersNeeded", { valueAsNumber: true })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="safetyNote">Safety Note</Label>
            <Input id="safetyNote" {...register("safetyNote")} className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
