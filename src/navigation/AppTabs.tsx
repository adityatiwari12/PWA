import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  Activity, 
  UserCircle, 
  Camera,
  MapPin
} from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/medications', label: 'Meds', icon: Pill },
  { path: '/map', label: 'Map', icon: MapPin },
  { path: '/medication/scan', label: 'Scan', icon: Camera, isCenter: true },
  { path: '/vitals', label: 'Vitals', icon: Activity },
  { path: '/profile', label: 'Health', icon: UserCircle },
];

/**
 * AppTabs — 5-tab bottom navigation with a floating center Scan button.
 * Hidden on modal routes.
 */
export default function AppTabs() {
  const location = useLocation();

  // Hide nav on modal routes
  if (location.pathname.startsWith('/medication/') || location.pathname.startsWith('/emergency/') || location.pathname.startsWith('/guardian/')) {
    return null;
  }

  return (
    <nav className="h-[72px] w-full bg-white border-t border-gray-100 flex items-center justify-around shadow-[0_-2px_20px_rgba(0,0,0,0.04)] sticky bottom-0 z-50 px-2">
      {tabs.map((tab) => {
        if (tab.isCenter) {
          return (
            <div key={tab.path} className="relative flex justify-center" style={{ width: 64 }}>
              <NavLink
                to={tab.path}
                className="absolute -top-7 flex items-center justify-center w-[60px] h-[60px] rounded-[22px] text-white shadow-xl ring-4 ring-white transform transition active:scale-90"
                style={{ 
                  background: 'linear-gradient(135deg, #1D9E75 0%, #0A6E57 100%)', 
                  boxShadow: '0 8px 24px rgba(29,158,117,0.35)' 
                }}
              >
                <tab.icon size={26} strokeWidth={2.5} />
              </NavLink>
            </div>
          );
        }

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-teal-600'
                  : 'text-gray-400 hover:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-teal-50' : ''}`}>
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-teal-600' : 'text-gray-400'}`}>
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
