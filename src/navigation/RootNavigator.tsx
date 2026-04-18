import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { dbOperations } from '../lib/db';
import { useNotificationEngine } from '../hooks/useNotificationEngine';

import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

// Tab screens
import HomeScreen from '../screens/home/HomeScreen';
import MedicationsScreen from '../screens/medications/MedicationsScreen';
import VitalsScreen from '../screens/vitals/VitalsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AssistantScreen from '../screens/assistant/AssistantScreen';
import MapScreen from '../screens/map/MapScreen';

// Modal screens
import ScanModal from '../screens/modals/medication/ScanModal';
import ConfirmModal from '../screens/modals/medication/ConfirmModal';
import InteractionsModal from '../screens/modals/medication/InteractionsModal';
import PriceCompareModal from '../screens/modals/medication/PriceCompareModal';
import ScheduleModal from '../screens/modals/medication/ScheduleModal';

/**
 * RootNavigator — entry point for all routing.
 * Checks auth state (profile existence) and renders either
 * the Auth stack or the main App shell.
 */
export default function RootNavigator() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    dbOperations.getUserProfile().then(p => setHasProfile(!!p));
  }, []);

  // Loading state
  if (hasProfile === null) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" />
            <div className="relative animate-spin w-10 h-10 rounded-full border-4 border-gray-200 border-t-teal-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sanjeevni</p>
        </div>
      </div>
    );
  }

  // Not authenticated → Auth Stack
  if (!hasProfile) {
    return <AuthStack />;
  }

  // Authenticated → App Shell with Tabs + Modal routes
  return (
    <Routes>
      {/* Tab layout wraps all tab screens */}
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/medications" element={<MedicationsScreen />} />
        <Route path="/vitals" element={<VitalsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/assistant" element={<AssistantScreen />} />
        <Route path="/map" element={<MapScreen />} />
      </Route>

      {/* Modal routes — rendered fullscreen, outside the tab layout */}
      <Route path="/medication/scan" element={<ScanModal />} />
      <Route path="/medication/confirm" element={<ConfirmModal />} />
      <Route path="/medication/interactions" element={<InteractionsModal />} />
      <Route path="/medication/price-compare" element={<PriceCompareModal />} />
      <Route path="/medication/schedule" element={<ScheduleModal />} />

      {/* Auth routes (allow re-onboarding) */}
      <Route path="/auth/*" element={<AuthStack />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * AppShell — the persistent layout for tabbed screens.
 * Renders AppTabs (bottom nav) + the active tab content via <Outlet/>.
 */
function AppShell() {
  useNotificationEngine();
  
  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
      <AppTabs />
    </div>
  );
}
