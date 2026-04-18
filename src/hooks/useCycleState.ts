import { useState, useEffect } from 'react';
import { dbOperations } from '../lib/db';

export type CyclePhase = 'follicular' | 'ovulation' | 'luteal' | 'late' | 'unknown';

export interface CycleState {
  isTracking: boolean;
  currentPhase: CyclePhase;
  daysIntoCycle: number;
  expectedCycleLength: number;
}

export function useCycleState() {
  const [state, setState] = useState<CycleState>({
    isTracking: false,
    currentPhase: 'unknown',
    daysIntoCycle: 0,
    expectedCycleLength: 28
  });

  useEffect(() => {
    const fetchAndCalculate = async () => {
      const profile = await dbOperations.getUserProfile();
      if (!profile || !profile.menstrualCycle?.isTracking || profile.gender !== 'Female') {
        return; // Not tracking or not applicable
      }

      const { lastPeriodDate, averageCycleLength } = profile.menstrualCycle;
      const lastPeriod = new Date(lastPeriodDate);
      const now = new Date();
      
      const timeDiff = now.getTime() - lastPeriod.getTime();
      const daysIntoCycle = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      let currentPhase: CyclePhase = 'follicular';
      
      // Standard phase estimation roughly mapped to average cycle length
      // Ovulation is typically 14 days before the END of the cycle.
      const lutealLength = 14; 
      const ovulationDay = averageCycleLength - lutealLength;
      
      if (daysIntoCycle > averageCycleLength + 3) {
        currentPhase = 'late';
      } else if (daysIntoCycle >= ovulationDay + 2) {
        currentPhase = 'luteal';
      } else if (daysIntoCycle >= ovulationDay - 2 && daysIntoCycle <= ovulationDay + 1) {
        currentPhase = 'ovulation';
      } else {
        currentPhase = 'follicular';
      }

      setState({
        isTracking: true,
        currentPhase,
        daysIntoCycle,
        expectedCycleLength: averageCycleLength
      });
    };

    fetchAndCalculate();
    // Simulate real-time by recalculating every minute
    const interval = setInterval(fetchAndCalculate, 60000);
    return () => clearInterval(interval);
  }, []);

  return state;
}
