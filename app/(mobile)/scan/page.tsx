"use client";

import * as React from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, QrCode, Camera, CameraOff } from "lucide-react";

type ScanResult = { text: string; at: string };

export default function ScanPage() {
  const [active, setActive] = React.useState(true);
  const [results, setResults] = React.useState<ScanResult[]>([]);

  const handleScan = (codes: any[]) => {
    if (!codes?.length) return;
    const value = codes[0]?.rawValue || codes[0]?.raw_data;
    if (!value) return;

    setResults((prev) => {
      if (prev[0]?.text === value) return prev; // hindari duplikat
      return [{ text: value, at: new Date().toISOString() }, ...prev].slice(
        0,
        20
      );
    });

    if (navigator.vibrate) navigator.vibrate(40);
  };

  return (
    <div className="mx-auto max-w-md space-y-4 pb-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan Kode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl overflow-hidden border">
            {active ? (
              <Scanner
                onScan={handleScan}
                onError={(err) => console.error(err)}
                constraints={{ facingMode: "environment" }}
                styles={{
                  container: { width: "100%", aspectRatio: "3/4" },
                  video: { width: "100%", objectFit: "cover" },
                }}
              />
            ) : (
              <div className="h-72 grid place-items-center text-sm text-muted-foreground">
                Kamera non-aktif
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {active ? (
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => setActive(false)}
              >
                <CameraOff className="mr-2 h-4 w-4" /> Berhenti
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => setActive(true)}>
                <Camera className="mr-2 h-4 w-4" /> Mulai
              </Button>
            )}
            <Badge variant="secondary">{active ? "Aktif" : "Non-aktif"}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Hasil Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {results.length} item · urutan terbaru di atas
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Arahkan kamera ke QR/Barcode.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i} className="rounded-lg border p-3 text-sm">
                  <div className="font-mono break-all">{r.text}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(r.at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
