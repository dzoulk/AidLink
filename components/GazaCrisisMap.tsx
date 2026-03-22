"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapIncident } from "@/types/incident-json";
import { GAZA_STRIP_POLYGON, GAZA_FLY_BOUNDS, getZoneForPoint } from "@/lib/gaza-zones";
import { CRITICALITY_META } from "@/lib/criticality-meta";

const createIcon = (color: string) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

function ViewController({ gazaMode }: { gazaMode: boolean }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(GAZA_FLY_BOUNDS[0], GAZA_FLY_BOUNDS[1]);
    if (gazaMode) {
      map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 12, duration: 1.1 });
    } else {
      map.flyTo([28, 38], 5, { duration: 1 });
    }
  }, [gazaMode, map]);
  return null;
}

function PopupCloser({ drawerOpen }: { drawerOpen: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (drawerOpen) map.closePopup();
  }, [drawerOpen, map]);
  return null;
}

interface GazaCrisisMapProps {
  incidents: MapIncident[];
  gazaMode: boolean;
  onEnterGaza: () => void;
  selectedIncidentId: string | null;
  onSelectIncident: (id: string | null) => void;
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  className?: string;
}

export function GazaCrisisMap({
  incidents,
  gazaMode,
  onEnterGaza,
  selectedIncidentId,
  onSelectIncident,
  selectedZoneId,
  onSelectZone,
  className = "",
}: GazaCrisisMapProps) {
  const worldCenter: [number, number] = [28, 38];
  const worldZoom = 5;

  const drawerOpen = !!selectedIncidentId;

  return (
    <div
      className={`h-full min-h-[400px] overflow-hidden rounded-lg border ${className} ${drawerOpen ? "incident-drawer-open" : ""}`}
    >
      <MapContainer
        center={worldCenter}
        zoom={worldZoom}
        className="h-full w-full"
        scrollWheelZoom
        minZoom={3}
        maxBounds={[
          [-85, -200],
          [85, 200],
        ]}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewController gazaMode={gazaMode} />
        <PopupCloser drawerOpen={drawerOpen} />

        <Polygon
          positions={GAZA_STRIP_POLYGON}
          pathOptions={{
            color: "#0f172a",
            weight: 2,
            fillColor: "#1e293b",
            fillOpacity: gazaMode ? 0.12 : 0.5,
            interactive: true,
          }}
          eventHandlers={{
            click: () => onEnterGaza(),
          }}
        >
          <Popup>
            <div className="text-sm font-medium">Gaza Strip</div>
            <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
              Click the Gaza view button or this area to zoom in.
            </p>
            {!gazaMode && (
              <button
                type="button"
                className="mt-2 text-xs font-medium text-primary underline"
                onClick={onEnterGaza}
              >
                Zoom to Gaza
              </button>
            )}
          </Popup>
        </Polygon>

        {
          incidents.map((inc) => {
            const meta = CRITICALITY_META[inc.criticality];
            const color = meta.marker;
            const selected = selectedIncidentId === inc.id;
            const radiusM = inc.radiusKm ? inc.radiusKm * 1000 : 0;

            return (
              <React.Fragment key={inc.id}>
                {radiusM > 0 && (
                  <Circle
                    center={[inc.lat, inc.lng]}
                    radius={radiusM}
                    pathOptions={{
                      color: meta.stroke,
                      fillColor: meta.fill,
                      fillOpacity: 0.2,
                      weight: 1,
                    }}
                  />
                )}
                <Marker
                  position={[inc.lat, inc.lng]}
                  icon={createIcon(color)}
                  zIndexOffset={selected ? 800 : 400}
                  eventHandlers={{
                    mouseover: (e) => {
                      e.target.openPopup();
                    },
                  }}
                >
                  <Popup
                    closeButton={false}
                    autoClose={false}
                    className="incident-summary-popup"
                    offset={[0, -12]}
                  >
                    <div className="min-w-[180px] py-1">
                      <p className="font-semibold text-sm">{inc.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {meta.label} • {inc.casualtiesEstimate} casualties est.
                      </p>
                      <button
                        type="button"
                        className="mt-2 w-full rounded bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIncident(inc.id);
                          const z = getZoneForPoint(inc.lat, inc.lng);
                          onSelectZone(z?.id ?? null);
                        }}
                      >
                        Open details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
      </MapContainer>
    </div>
  );
}
