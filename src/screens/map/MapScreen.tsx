import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Search, User, MapPin, Star, ChevronRight, Hospital } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HOSPITAL_LIST, JAN_AUSHADHI_KENDRA_LIST } from '../../lib/janAushadhiDataset';

// Custom Marker Icons
const createUserIcon = () => {
  return new L.DivIcon({
    className: 'custom-user-icon',
    html: `<div style="background-color: #ef4444; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; color: white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createHospitalIcon = () => {
  return new L.DivIcon({
    className: 'custom-hospital-icon',
    html: `<div style="color: #ef4444; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

type TabType = 'ayushman' | 'jan_aushadhi' | 'govt_clinics';

export default function MapScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('ayushman');
  const [userLocation, setUserLocation] = useState<[number, number]>([22.7196, 75.8577]); // Default Indore
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const filteredPlaces = useMemo(() => {
    if (activeTab === 'ayushman') {
      return HOSPITAL_LIST.filter(h => h.ayushmanAccepted).slice(0, 12);
    } else if (activeTab === 'jan_aushadhi') {
      return JAN_AUSHADHI_KENDRA_LIST.filter(k => k.city === 'Indore').slice(0, 10);
    } else {
      // Mock "Govt Clinics" from dataset (filtering for certain keywords or just subset)
      return HOSPITAL_LIST.filter(h => h.name.toLowerCase().includes('hospital')).slice(5, 12);
    }
  }, [activeTab]);

  const tabs = [
    { id: 'ayushman', label: 'Ayushman Hospitals' },
    { id: 'jan_aushadhi', label: 'Jan Aushadhi stores' },
    { id: 'govt_clinics', label: 'Govt. Clinics' }
  ];

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-medium text-gray-900">Nearby Services</h1>
        <button className="p-2 -mr-2 text-gray-800">
          <Search size={22} />
        </button>
      </header>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto gap-3 px-4 py-3 no-scrollbar shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-[#ef4444] text-white shadow-md shadow-red-200' 
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Map Section - 45% */}
        <div className="h-[45%] w-full relative z-0 border-b border-gray-100">
          <MapContainer 
            center={userLocation} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController center={userLocation} zoom={14} />
            
            <Marker position={userLocation} icon={createUserIcon()} />

            {filteredPlaces.map((place: any) => (
              <Marker 
                key={place.id} 
                position={[place.coordinates?.lat || place.lat, place.coordinates?.lng || place.lng]} 
                icon={createHospitalIcon()} 
              />
            ))}
          </MapContainer>
        </div>

        {/* Results List - 55% */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="px-4 py-4">
            <h2 className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-4">
              {filteredPlaces.length} results nearby
            </h2>

            <div className="space-y-0">
              {filteredPlaces.map((place: any, index: number) => (
                <div key={place.id} className="group active:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4 py-4">
                    {/* Teal Rounded Icon BG */}
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
                      <Hospital className="text-teal-600" size={24} />
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-start justify-between">
                        <h3 className="text-[15px] font-semibold text-gray-900 truncate pr-4">
                          {place.name}
                        </h3>
                        <ChevronRight className="text-gray-300 mt-1" size={18} />
                      </div>
                      
                      <p className="text-[12px] text-gray-500 truncate mt-0.5">
                        {place.address}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {/* Distance Badge */}
                        <div className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-500">
                          {((Math.random() * 2) + 0.5).toFixed(1)} km
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700">
                          <Star size={12} fill="#f59e0b" className="text-[#f59e0b]" />
                          {place.rating || (4.0 + (Math.random() * 0.9)).toFixed(1)}
                        </div>

                        {/* Ayushman Badge */}
                        {place.ayushmanAccepted && (
                          <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100">
                            Ayushman Empanelled
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < filteredPlaces.length - 1 && (
                    <div className="h-[1px] bg-gray-100 ml-16" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
