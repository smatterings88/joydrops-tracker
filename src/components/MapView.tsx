"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then(mod => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then(mod => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then(mod => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then(mod => mod.Popup),
    { ssr: false }
);

export default function MapView() {
    const [joydrops, setJoydrops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        // Fix leaflet icon issues in Next.js
        import('leaflet').then(leaflet => {
            setL(leaflet);
            // @ts-ignore
            delete leaflet.Icon.Default.prototype._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        });

        const fetchData = async () => {
            try {
                const res = await fetch('/api/get_map_data');
                const data = await res.json();
                setJoydrops(data.joydrops || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !L) {
        return <div className="h-[500px] bg-gray-100 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-gray-400" /></div>;
    }

    // Custom Icon logic could go here if we want purple vs blue pins

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {joydrops.map((drop) => (
                    <Marker
                        key={drop.id}
                        position={[drop.latitude, drop.longitude]}
                    >
                        <Popup>
                            <div className="text-sm">
                                <p className="font-bold">{drop.userName}</p>
                                {drop.organizationName && <p className="text-purple-600">Org: {drop.organizationName}</p>}
                                {!drop.organizationName && <p className="text-blue-500">Individual</p>}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
