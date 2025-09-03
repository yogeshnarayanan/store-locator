'use client';
import { useEffect, useState } from "react";
import { GoogleMap, MarkerF, useLoadScript, Autocomplete } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

const libraries: ("places")[] = ["places"];

type PlaceItem = { _id: string; name: string; address?: string; lat: number; lng: number; distanceMeters?: number };

export default function Page(){
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });
  const { toast } = useToast();
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 });
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [selected, setSelected] = useState<{ name: string; address?: string; lat: number; lng: number } | null>(null);

  useEffect(()=>{ if(isLoaded) fetchNear(mapCenter.lat, mapCenter.lng); }, [isLoaded]);

  async function fetchNear(lat: number, lng: number){
    const res = await fetch(`/api/places/near?lat=${lat}&lng=${lng}&radiusKm=10&limit=50`);
    const data = await res.json();
    setPlaces(data);
  }

  const onPlaceChanged = () => {
    if(!autocomplete) return;
    const place = autocomplete.getPlace();
    const geom = place.geometry?.location;
    if(!geom) return;
    const lat = geom.lat(); const lng = geom.lng();
    setMapCenter({ lat, lng });
    setSelected({ name: place.name || place.formatted_address || "Unnamed", address: place.formatted_address || undefined, lat, lng });
    fetchNear(lat, lng);
  };

  async function addSelected(){
    if(!selected) return;
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    });
    if(!res.ok){ toast({ title: "Failed to add place" }); return; }
    toast({ title: "Place added" });
    fetchNear(selected.lat, selected.lng);
  }

  if(loadError) return <div className="p-4">Failed to load Google Maps</div>;
  if(!isLoaded) return <div className="p-4">Loading map…</div>;

  return (
    <div className="grid md:grid-cols-[360px_1fr] gap-4 p-4">
      <Card className="h-[80vh]">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search & pick a place</label>
            <Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged}>
              <Input placeholder="Search places" />
            </Autocomplete>
          </div>
          {selected && (
            <div className="space-y-2">
              <div className="text-sm">Selected: <span className="font-semibold">{selected.name}</span></div>
              <Button onClick={addSelected}>Add Place</Button>
            </div>
          )}
          <div className="text-sm text-gray-500">Showing {places.length} nearby places</div>
          <div className="space-y-2 max-h-[50vh] overflow-auto pr-2">
            {places.map(p => (
              <div key={p._id} className="border rounded-md p-2">
                <div className="font-medium">{p.name}</div>
                {p.address && <div className="text-xs text-gray-500">{p.address}</div>}
                {typeof p.distanceMeters === "number" && <div className="text-xs">{(p.distanceMeters/1000).toFixed(2)} km</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="h-[80vh] w-full">
        <GoogleMap
          zoom={13}
          center={mapCenter}
          mapContainerStyle={{ height: "100%", width: "100%" }}
          onDragEnd={(e) => {
            // workaround: get center from DOM map instance
            const g: any = e;
            const center = g?.getCenter?.();
            if(center){
              const lat = center.lat(); const lng = center.lng();
              setMapCenter({ lat, lng });
              fetchNear(lat, lng);
            }
          }}
        >
          <MarkerF position={mapCenter} />
          {places.map(p => <MarkerF key={p._id} position={{ lat: p.lat, lng: p.lng }} />)}
        </GoogleMap>
      </div>
    </div>
  );
}
