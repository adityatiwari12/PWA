import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/auth/onboarding/OnboardingScreen';

/**
 * AuthStack — handles unauthenticated users.
 * Routes: welcome → login → onboarding (multi-step)
 */
export default function AuthStack() {
  return (
    <Routes>
      <Route path="/auth/welcome" element={<WelcomeScreen />} />
      <Route path="/auth/login" element={<LoginScreen />} />
      <Route path="/auth/onboarding" element={<OnboardingScreen />} />
      {/* Legacy route support */}
      <Route path="/onboarding" element={<Navigate to="/auth/onboarding" replace />} />
      <Route path="*" element={<Navigate to="/auth/welcome" replace />} />
    </Routes>
  );
}
