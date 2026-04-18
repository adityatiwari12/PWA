import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Search, MapPin, Star, ChevronRight, Hospital, Store, Phone, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HOSPITAL_LIST, JAN_AUSHADHI_KENDRA_LIST, type ExtendedHospital, type ExtendedKendra } from '../../lib/janAushadhiDataset';

type Place = (ExtendedHospital | ExtendedKendra) & { type: 'hospital' | 'store' };

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

const createStoreIcon = () => {
  return new L.DivIcon({
    className: 'custom-store-icon',
    html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 10px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createHospitalIcon = () => {
  return new L.DivIcon({
    className: 'custom-hospital-icon',
    html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 10px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3H5C3.34 2 2 3.34 2 5v6c0 1.66 1.34 3 3 3h14z"></path><path d="M18 22H6"></path><path d="M12 14v8"></path><path d="M7 14v2c0 2.8 2.2 5 5 5s5-2.2 5-5v-2"></path></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const filteredPlaces = useMemo((): Place[] => {
    if (activeTab === 'ayushman') {
      return HOSPITAL_LIST.filter(h => h.ayushmanAccepted).slice(0, 12).map(h => ({ ...h, type: 'hospital' }));
    } else if (activeTab === 'jan_aushadhi') {
      return JAN_AUSHADHI_KENDRA_LIST.filter(k => k.city === 'Indore').slice(0, 10).map(k => ({ ...k, type: 'store' })) as any;
    } else {
      return HOSPITAL_LIST.filter(h => h.name.toLowerCase().includes('hospital')).slice(5, 12).map(h => ({ ...h, type: 'hospital' }));
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

            {filteredPlaces.map((place: Place) => (
              <Marker 
                key={place.id} 
                position={[place.coordinates?.lat || (place as any).lat, place.coordinates?.lng || (place as any).lng]} 
                icon={place.type === 'hospital' ? createHospitalIcon() : createStoreIcon()}
                eventHandlers={{
                  click: () => setSelectedPlace(place)
                }}
              />
            ))}
          </MapContainer>

          {/* Place Details Overlay Card */}
          {selectedPlace && (
            <div className="absolute bottom-6 left-4 right-4 z-[1000] bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 animate-in slide-in-from-bottom-5">
              <button 
                onClick={() => setSelectedPlace(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <Search size={18} className="rotate-45" /> {/* Use search tilted as X */}
              </button>
              
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${selectedPlace.type === 'hospital' ? 'bg-rose-50' : 'bg-teal-50'}`}>
                   {selectedPlace.type === 'hospital' ? <Hospital className="text-rose-600" size={28} /> : <Store className="text-teal-600" size={28} />}
                </div>
                <div className="flex-1 pr-6">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{selectedPlace.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={14} fill="#f59e0b" className="text-[#f59e0b]" />
                    <span className="text-xs font-bold text-gray-700">{(selectedPlace as any).rating || '4.5'}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs font-medium text-gray-500">{(selectedPlace as any).openTill || 'Open 24/7'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">{selectedPlace.address}</p>
                </div>
                {selectedPlace.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <a href={`tel:${selectedPlace.phone}`} className="text-xs text-blue-600 font-bold">{selectedPlace.phone}</a>
                  </div>
                )}
                {selectedPlace.type === 'hospital' && (selectedPlace as any).specialties && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(selectedPlace as any).specialties.slice(0, 3).map((s: string) => (
                      <span key={s} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  className="flex-1 bg-[#ef4444] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-200"
                  onClick={() => {
                    const lat = selectedPlace.coordinates.lat;
                    const lng = selectedPlace.coordinates.lng;
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                  }}
                >
                  <Navigation size={18} />
                  Get Directions
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results List - 55% */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="px-4 py-4">
            <h2 className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-4">
              {filteredPlaces.length} results nearby
            </h2>

            <div className="space-y-0">
              {filteredPlaces.map((place: Place, index: number) => (
                <div 
                  key={place.id} 
                  onClick={() => setSelectedPlace(place)}
                  className={`group active:bg-gray-50 transition-colors cursor-pointer ${selectedPlace?.id === place.id ? 'bg-red-50/50' : ''}`}
                >
                  <div className="flex items-start gap-4 py-4">
                    {/* Dynamic Icon BG */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${place.type === 'hospital' ? 'bg-rose-50' : 'bg-teal-50'}`}>
                      {place.type === 'hospital' ? <Hospital className="text-rose-600" size={24} /> : <Store className="text-teal-600" size={24} />}
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
                          {(place as any).rating || (4.0 + (Math.random() * 0.9)).toFixed(1)}
                        </div>

                        {/* Ayushman Badge */}
                        {(place as any).ayushmanAccepted && (
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
