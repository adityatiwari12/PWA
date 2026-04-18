import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  MapPin,
  Camera,
  Activity, 
  UserCircle 
} from 'lucide-react';

// The prompt specified "5 tabs: Home, Meds, Map, Scan, Vitals, Health"
// That's 6 items, so we'll render all 6 keeping the layout balanced.
const tabs = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/medications', label: 'Meds', icon: Pill },
  { path: '/map', label: 'Map', icon: MapPin },
  { path: '/medication/scan', label: 'Scan', icon: Camera, isCenter: true },
  { path: '/vitals', label: 'Vitals', icon: Activity },
  { path: '/profile', label: 'Health', icon: UserCircle },
];

export default function AppTabs() {
  const location = useLocation();

  // Hide nav on modal routes
  if (location.pathname.startsWith('/medication/') && location.pathname !== '/medication/scan' || location.pathname.startsWith('/emergency/') || location.pathname.startsWith('/guardian/')) {
    // Wait, if Scan is a tab, it shouldn't hide the nav if it's rendered as a tab link, 
    // BUT in this app /medication/scan is a modal overlay.
    // The "Scan" tab is just a NavLink that triggers the modal route.
    if (location.pathname !== '/medication/scan' && location.pathname.startsWith('/medication/')) {
       return null;
    }
  }

  return (
    <nav 
      className="h-[64px] w-full bg-white flex items-center sticky bottom-0 z-50 px-1"
      style={{ borderTop: '0.5px solid #E5E7EB' }}
    >
      {tabs.map((tab) => {
        if (tab.isCenter) {
          return (
            <div key={tab.path} className="flex-1 flex flex-col items-center justify-center h-full">
              <NavLink
                to={tab.path}
                className="flex items-center justify-center w-[48px] h-[48px] rounded-full bg-[#E84040] active:scale-95 transition-transform shadow-md"
              >
                <tab.icon size={24} color="white" strokeWidth={2} />
              </NavLink>
            </div>
          );
        }

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className="flex flex-col items-center justify-center flex-1 h-full select-none"
          >
            {({ isActive }) => (
              <>
                <tab.icon 
                  size={20} 
                  strokeWidth={2} 
                  className={`mb-1 transition-colors ${isActive ? 'text-[#E84040]' : 'text-gray-400'}`}
                />
                <span 
                   className={`text-[11px] font-medium transition-colors ${isActive ? 'text-[#E84040]' : 'text-gray-400'}`}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
