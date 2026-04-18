import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";

interface Hospital {
  id: string;
  name: string;
  nameHi: string;
  address: string;
  addressHi: string;
  lat: number;
  lng: number;
  type: string;
  phone?: string;
  pmjayEnabled: boolean;
  services: string[];
  distance?: number; // Distance from user location in km
}

interface GovernmentHospitalMapProps {
  language: 'en' | 'hi';
  selectedState?: string;
}

// Sample government hospitals data (you can expand this with real data)
const governmentHospitals: Hospital[] = [
  {
    id: "aiims-delhi",
    name: "All India Institute of Medical Sciences (AIIMS)",
    nameHi: "अखिल भारतीय आयुर्विज्ञान संस्थान (एम्स)",
    address: "Ansari Nagar, New Delhi - 110029",
    addressHi: "अंसारी नगर, नई दिल्ली - 110029",
    lat: 28.5672,
    lng: 77.2100,
    type: "Super Specialty Hospital",
    phone: "011-26588500",
    pmjayEnabled: true,
    services: ["Emergency", "Cardiology", "Neurology", "Oncology", "Surgery"]
  },
  {
    id: "safdarjung-delhi",
    name: "Safdarjung Hospital",
    nameHi: "सफदरजंग अस्पताल",
    address: "Ring Road, New Delhi - 110029",
    addressHi: "रिंग रोड, नई दिल्ली - 110029",
    lat: 28.5738,
    lng: 77.2088,
    type: "Multi-specialty Hospital",
    phone: "011-26165060",
    pmjayEnabled: true,
    services: ["Emergency", "General Medicine", "Surgery", "Pediatrics"]
  },
  {
    id: "kgmu-lucknow",
    name: "King George's Medical University",
    nameHi: "किंग जॉर्ज मेडिकल यूनिवर्सिटी",
    address: "Chowk, Lucknow, Uttar Pradesh - 226003",
    addressHi: "चौक, लखनऊ, उत्तर प्रदेश - 226003",
    lat: 26.8467,
    lng: 80.9462,
    type: "Medical College & Hospital",
    phone: "0522-2257540",
    pmjayEnabled: true,
    services: ["Emergency", "Trauma", "Cardiology", "Neurosurgery"]
  },
  {
    id: "pgimer-chandigarh",
    name: "Post Graduate Institute of Medical Education and Research",
    nameHi: "स्नातकोत्तर चिकित्सा शिक्षा और अनुसंधान संस्थान",
    address: "Sector 12, Chandigarh - 160012",
    addressHi: "सेक्टर 12, चंडीगढ़ - 160012",
    lat: 30.7333,
    lng: 76.7794,
    type: "Super Specialty Hospital",
    phone: "0172-2747585",
    pmjayEnabled: true,
    services: ["Emergency", "Advanced Surgery", "Research", "Transplant"]
  },
  {
    id: "jipmer-puducherry",
    name: "Jawaharlal Institute of Postgraduate Medical Education and Research",
    nameHi: "जवाहरलाल स्नातकोत्तर चिकित्सा शिक्षा और अनुसंधान संस्थान",
    address: "Dhanvantari Nagar, Puducherry - 605006",
    addressHi: "धन्वंतरि नगर, पुडुचेरी - 605006",
    lat: 11.9416,
    lng: 79.8083,
    type: "Medical Institute",
    phone: "0413-2272380",
    pmjayEnabled: true,
    services: ["Emergency", "General Medicine", "Surgery", "Research"]
  },
  {
    id: "sctimst-kerala",
    name: "Sree Chitra Tirunal Institute for Medical Sciences and Technology",
    nameHi: "श्री चित्रा तिरुनल चिकित्सा विज्ञान और प्रौद्योगिकी संस्थान",
    address: "Thiruvananthapuram, Kerala - 695011",
    addressHi: "तिरुवनंतपुरम, केरल - 695011",
    lat: 8.5241,
    lng: 76.9366,
    type: "Specialty Institute",
    phone: "0471-2524266",
    pmjayEnabled: true,
    services: ["Cardiology", "Neurosurgery", "Research", "Emergency"]
  },
  // Indore Region Government Hospitals
  {
    id: "mgh-indore",
    name: "Maharaja Yeshwantrao Hospital (M.Y. Hospital)",
    nameHi: "महाराजा यशवंतराव अस्पताल (एम.वाई. अस्पताल)",
    address: "A.B. Road, Indore, Madhya Pradesh - 452001",
    addressHi: "ए.बी. रोड, इंदौर, मध्य प्रदेश - 452001",
    lat: 22.7196,
    lng: 75.8577,
    type: "Government General Hospital",
    phone: "0731-2542621",
    pmjayEnabled: true,
    services: ["Emergency", "General Medicine", "Surgery", "Pediatrics", "Gynecology"]
  },
  {
    id: "govt-medical-college-indore",
    name: "Government Medical College & Associated Hospitals, Indore",
    nameHi: "सरकारी मेडिकल कॉलेज और संबद्ध अस्पताल, इंदौर",
    address: "Rani Road, Indore, Madhya Pradesh - 452001",
    addressHi: "रानी रोड, इंदौर, मध्य प्रदेश - 452001",
    lat: 22.7209,
    lng: 75.8573,
    type: "Medical College Hospital",
    phone: "0731-2542345",
    pmjayEnabled: true,
    services: ["Emergency", "Super Specialty", "Trauma", "Cardiology", "Neurology"]
  },
  {
    id: "chacha-nehru-hospital-indore",
    name: "Chacha Nehru Bal Chikitsalaya",
    nameHi: "चाचा नेहरू बाल चिकित्सालय",
    address: "M.G. Road, Indore, Madhya Pradesh - 452001",
    addressHi: "एम.जी. रोड, इंदौर, मध्य प्रदेश - 452001",
    lat: 22.7167,
    lng: 75.8545,
    type: "Government Children Hospital",
    phone: "0731-2542789",
    pmjayEnabled: true,
    services: ["Pediatrics", "Emergency", "Neonatal Care", "Child Surgery"]
  },
  {
    id: "district-hospital-indore",
    name: "District Hospital Indore",
    nameHi: "जिला अस्पताल इंदौर",
    address: "Jail Road, Indore, Madhya Pradesh - 452002",
    addressHi: "जेल रोड, इंदौर, मध्य प्रदेश - 452002",
    lat: 22.7251,
    lng: 75.8503,
    type: "District Hospital",
    phone: "0731-2542456",
    pmjayEnabled: true,
    services: ["Emergency", "General Medicine", "Surgery", "Maternity", "TB Treatment"]
  },
  {
    id: "govt-chest-hospital-indore",
    name: "Government Chest Hospital Indore",
    nameHi: "सरकारी छाती अस्पताल इंदौर",
    address: "Jail Road, Indore, Madhya Pradesh - 452002",
    addressHi: "जेल रोड, इंदौर, मध्य प्रदेश - 452002",
    lat: 22.7234,
    lng: 75.8489,
    type: "Specialty Hospital",
    phone: "0731-2542567",
    pmjayEnabled: true,
    services: ["Pulmonology", "TB Treatment", "Respiratory Diseases", "Emergency"]
  },
  {
    id: "mental-hospital-indore",
    name: "Government Mental Hospital Indore",
    nameHi: "सरकारी मानसिक अस्पताल इंदौर",
    address: "Bhawarkua, Indore, Madhya Pradesh - 452010",
    addressHi: "भवरकुआ, इंदौर, मध्य प्रदेश - 452010",
    lat: 22.6890,
    lng: 75.8630,
    type: "Mental Health Hospital",
    phone: "0731-2542890",
    pmjayEnabled: true,
    services: ["Psychiatry", "Mental Health", "De-addiction", "Counseling"]
  },
  {
    id: "aiims-indore",
    name: "All India Institute of Medical Sciences (AIIMS) Indore",
    nameHi: "अखिल भारतीय आयुर्विज्ञान संस्थान (एम्स) इंदौर",
    address: "Saket Nagar, Indore, Madhya Pradesh - 452020",
    addressHi: "साकेत नगर, इंदौर, मध्य प्रदेश - 452020",
    lat: 22.6726,
    lng: 75.9064,
    type: "Super Specialty Institute",
    phone: "0731-2672001",
    pmjayEnabled: true,
    services: ["Emergency", "Super Specialty", "Trauma", "Cardiology", "Neurosurgery", "Oncology"]
  },
  {
    id: "govt-ayurved-college-indore",
    name: "Government Ayurved College & Hospital Indore",
    nameHi: "सरकारी आयुर्वेद कॉलेज और अस्पताल इंदौर",
    address: "Nanakheda, Indore, Madhya Pradesh - 452010",
    addressHi: "नानाखेड़ा, इंदौर, मध्य प्रदेश - 452010",
    lat: 22.6945,
    lng: 75.8712,
    type: "Ayurvedic Hospital",
    phone: "0731-2542678",
    pmjayEnabled: true,
    services: ["Ayurvedic Treatment", "Panchakarma", "General Medicine", "Physiotherapy"]
  },
  {
    id: "govt-homeopathy-college-indore",
    name: "Government Homeopathy Medical College & Hospital Indore",
    nameHi: "सरकारी होम्योपैथी मेडिकल कॉलेज और अस्पताल इंदौर",
    address: "Anand Nagar, Indore, Madhya Pradesh - 452011",
    addressHi: "आनंद नगर, इंदौर, मध्य प्रदेश - 452011",
    lat: 22.7023,
    lng: 75.8834,
    type: "Homeopathic Hospital",
    phone: "0731-2542789",
    pmjayEnabled: true,
    services: ["Homeopathic Treatment", "General Medicine", "Pediatrics", "Skin Diseases"]
  }
];

export const GovernmentHospitalMap: React.FC<GovernmentHospitalMapProps> = ({ 
  language, 
  selectedState 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearestHospitals, setNearestHospitals] = useState<Hospital[]>([]);
  const [mapHospitals, setMapHospitals] = useState<Hospital[]>([]); // Hospitals currently shown on map
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied' | 'error'>('requesting');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setIsMapLoaded(true);
        };
        document.head.appendChild(script);
      } else if (window.L) {
        setIsMapLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  // Request user location
  const requestLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationStatus('granted');
          setIsLoadingLocation(false);
        },
        (error) => {
          console.log('Location access denied:', error);
          setLocationStatus('denied');
          setIsLoadingLocation(false);
          // Don't set default location, let user choose
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationStatus('error');
      setIsLoadingLocation(false);
    }
  };

  // Use default location (Delhi) as fallback
  const useDefaultLocation = () => {
    setUserLocation({ lat: 28.6139, lng: 77.2090 });
    setLocationStatus('granted');
  };

  // Initialize map
  useEffect(() => {
    if (isMapLoaded && userLocation && mapRef.current && !mapInstanceRef.current) {
      const L = window.L;
      
      // Create map
      const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 6);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Custom icons
      const hospitalIcon = L.divIcon({
        html: `<div style="background: #dc2626; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏥</div>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const userIcon = L.divIcon({
        html: `<div style="background: #2563eb; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>`,
        className: 'custom-div-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Add user location marker
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(language === 'en' ? '📍 Your Location' : '📍 आपका स्थान');

      // Calculate nearest hospitals and add markers
      const hospitalsWithDistance = governmentHospitals.map(hospital => ({
        ...hospital,
        distance: calculateDistance(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
      }));

      const sortedHospitals = hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
      const hospitalsToShow = sortedHospitals.slice(0, 8); // Show top 8 nearest hospitals
      
      // Update the map hospitals state
      setMapHospitals(hospitalsToShow);

      // Add hospital markers
      hospitalsToShow.forEach((hospital) => {
        const marker = L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
          .addTo(map);

        const popupContent = `
          <div style="min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px; font-weight: bold;">
              ${language === 'en' ? hospital.name : hospital.nameHi}
            </h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              <strong>${language === 'en' ? 'Address:' : 'पता:'}</strong><br>
              ${language === 'en' ? hospital.address : hospital.addressHi}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              <strong>${language === 'en' ? 'Type:' : 'प्रकार:'}</strong> ${hospital.type}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              <strong>${language === 'en' ? 'Distance:' : 'दूरी:'}</strong> ${hospital.distance.toFixed(1)} km
            </p>
            ${hospital.phone ? `
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>${language === 'en' ? 'Phone:' : 'फोन:'}</strong> 
                <a href="tel:${hospital.phone}" style="color: #2563eb;">${hospital.phone}</a>
              </p>
            ` : ''}
            ${hospital.pmjayEnabled ? `
              <div style="margin: 8px 0;">
                <span style="background: #16a34a; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                  ✅ ${language === 'en' ? 'PM-JAY Enabled' : 'पीएम-जेएवाई सक्षम'}
                </span>
              </div>
            ` : ''}
            <div style="margin: 8px 0;">
              <strong style="font-size: 12px;">${language === 'en' ? 'Services:' : 'सेवाएं:'}</strong><br>
              <div style="font-size: 11px; color: #666;">
                ${hospital.services.join(', ')}
              </div>
            </div>
            <button 
              onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}', '_blank')"
              style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-top: 8px;"
            >
              ${language === 'en' ? '🗺️ Get Directions' : '🗺️ दिशा प्राप्त करें'}
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      mapInstanceRef.current = map;
    }
  }, [isMapLoaded, userLocation, language, nearestHospitals]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find nearest hospitals
  const findNearestHospitals = () => {
    if (!userLocation) return;

    const hospitalsWithDistance = governmentHospitals.map(hospital => ({
      ...hospital,
      distance: calculateDistance(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
    }));

    const sorted = hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
    setNearestHospitals(sorted.slice(0, 10)); // Show top 10 nearest
  };

  useEffect(() => {
    if (userLocation) {
      findNearestHospitals();
    }
  }, [userLocation]);

  // Location request screen
  if (locationStatus === 'requesting') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 border-2 border-blue-300">
        <div className="text-center">
          <div className="text-4xl mb-4">📍</div>
          <h4 className="font-semibold text-gray-800 mb-3">
            {language === 'en' ? 'Location Access Required' : 'स्थान की पहुंच आवश्यक'}
          </h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {language === 'en' 
              ? 'To show you the nearest government hospitals, we need access to your location. This helps us provide personalized healthcare services.'
              : 'आपको निकटतम सरकारी अस्पताल दिखाने के लिए, हमें आपके स्थान तक पहुंच की आवश्यकता है। यह हमें व्यक्तिगत स्वास्थ्य सेवाएं प्रदान करने में मदद करता है।'
            }
          </p>
          <div className="space-y-3">
            <Button 
              onClick={requestLocation}
              disabled={isLoadingLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              {isLoadingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {language === 'en' ? 'Getting Location...' : 'स्थान प्राप्त कर रहे हैं...'}
                </>
              ) : (
                <>
                  📍 {language === 'en' ? 'Allow Location Access' : 'स्थान की पहुंच की अनुमति दें'}
                </>
              )}
            </Button>
            <div className="text-sm text-gray-500">
              {language === 'en' ? 'or' : 'या'}
            </div>
            <Button 
              onClick={useDefaultLocation}
              variant="outline"
              className="border-gray-300"
            >
              🏛️ {language === 'en' ? 'Use Delhi as Default' : 'दिल्ली को डिफ़ॉल्ट के रूप में उपयोग करें'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Location denied screen
  if (locationStatus === 'denied') {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-8 border-2 border-orange-300">
        <div className="text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h4 className="font-semibold text-gray-800 mb-3">
            {language === 'en' ? 'Location Access Denied' : 'स्थान की पहुंच अस्वीकृत'}
          </h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {language === 'en' 
              ? 'Location access was denied. You can still view hospitals by using a default location or try allowing location access again.'
              : 'स्थान की पहुंच अस्वीकार कर दी गई थी। आप अभी भी डिफ़ॉल्ट स्थान का उपयोग करके अस्पतालों को देख सकते हैं या फिर से स्थान की पहुंच की अनुमति देने का प्रयास कर सकते हैं।'
            }
          </p>
          <div className="space-y-3">
            <Button 
              onClick={requestLocation}
              disabled={isLoadingLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              🔄 {language === 'en' ? 'Try Again' : 'फिर से कोशिश करें'}
            </Button>
            <div className="text-sm text-gray-500">
              {language === 'en' ? 'or' : 'या'}
            </div>
            <Button 
              onClick={useDefaultLocation}
              variant="outline"
              className="border-gray-300"
            >
              🏛️ {language === 'en' ? 'Continue with Delhi' : 'दिल्ली के साथ जारी रखें'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Geolocation not supported
  if (locationStatus === 'error') {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 border-2 border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h4 className="font-semibold text-gray-800 mb-3">
            {language === 'en' ? 'Location Not Supported' : 'स्थान समर्थित नहीं'}
          </h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {language === 'en' 
              ? 'Your browser does not support location services. We will show hospitals using Delhi as the default location.'
              : 'आपका ब्राउज़र स्थान सेवाओं का समर्थन नहीं करता है। हम दिल्ली को डिफ़ॉल्ट स्थान के रूप में उपयोग करके अस्पताल दिखाएंगे।'
            }
          </p>
          <Button 
            onClick={useDefaultLocation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            🏛️ {language === 'en' ? 'Continue with Delhi' : 'दिल्ली के साथ जारी रखें'}
          </Button>
        </div>
      </div>
    );
  }

  // Loading map
  if (!isMapLoaded) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 border-2 border-dashed border-blue-300">
        <div className="text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <h4 className="font-semibold text-gray-800 mb-2">
            {language === 'en' ? 'Loading Interactive Map...' : 'इंटरैक्टिव मानचित्र लोड हो रहा है...'}
          </h4>
          <div className="animate-pulse bg-gray-200 h-4 w-32 mx-auto rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border-2 border-gray-200 shadow-lg"
          style={{ minHeight: '400px' }}
        />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button
            size="sm"
            className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 shadow-md"
            onClick={findNearestHospitals}
          >
            🔄 {language === 'en' ? 'Refresh' : 'रीफ्रेश'}
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            onClick={() => {
              if (mapInstanceRef.current && userLocation) {
                mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 10);
              }
            }}
          >
            📍 {language === 'en' ? 'My Location' : 'मेरा स्थान'}
          </Button>
        </div>
      </div>

      {/* Hospital List - Shows hospitals currently on map */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800">
            🏥 {language === 'en' ? 'Hospitals on Map' : 'मानचित्र पर अस्पताल'}
          </h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {mapHospitals.length} {language === 'en' ? 'hospitals' : 'अस्पताल'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {mapHospitals.map((hospital, index) => (
            <div key={hospital.id} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                      #{index + 1}
                    </span>
                    <h5 className="font-medium text-sm text-gray-800">
                      {language === 'en' ? hospital.name : hospital.nameHi}
                    </h5>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {language === 'en' ? hospital.address : hospital.addressHi}
                  </p>
                  {hospital.distance && (
                    <p className="text-xs text-blue-600 font-medium mb-2">
                      📍 {hospital.distance.toFixed(1)} km {language === 'en' ? 'away' : 'दूर'}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {hospital.pmjayEnabled && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        ✅ PM-JAY
                      </span>
                    )}
                    {hospital.phone && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        📞 {hospital.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, '_blank')}
                  >
                    🗺️
                  </Button>
                  {hospital.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => window.open(`tel:${hospital.phone}`)}
                    >
                      📞
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {mapHospitals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">🏥</div>
            <p className="text-sm">
              {language === 'en' ? 'No hospitals to display. Please allow location access.' : 'प्रदर्शित करने के लिए कोई अस्पताल नहीं। कृपया स्थान की पहुंच की अनुमति दें।'}
            </p>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h5 className="font-medium text-sm text-gray-800 mb-2">
          {language === 'en' ? 'Map Legend' : 'मानचित्र किंवदंती'}
        </h5>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">🏥</span>
            <span>{language === 'en' ? 'Government Hospital' : 'सरकारी अस्पताल'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">📍</span>
            <span>{language === 'en' ? 'Your Location' : 'आपका स्थान'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✅ PM-JAY</span>
            <span>{language === 'en' ? 'PM-JAY Enabled' : 'पीएम-जेएवाई सक्षम'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
