import { useState, useEffect } from 'react';
import { useMedicationStore } from '../store/medicationStore';
import { useVitalsStore } from '../store/vitalsStore';

export type DiagnosticLevel = 'safe' | 'warning' | 'critical';

export interface DiagnosticState {
  level: DiagnosticLevel;
  reasons: string[];
  missedDoses: number;
  hasInteractionRisk: boolean;
  vitalAnomalies: string[];
}

export function useDiagnosticState() {
  const { medications, adherence } = useMedicationStore();
  const { vitals } = useVitalsStore();
  
  const [state, setState] = useState<DiagnosticState>({
    level: 'safe',
    reasons: [],
    missedDoses: 0,
    hasInteractionRisk: false,
    vitalAnomalies: []
  });

  useEffect(() => {
    let newLevel: DiagnosticLevel = 'safe';
    const reasons: string[] = [];
    let missedDoses = 0;
    
    // 1. Calculate missed doses for *today*
    const todayStr = new Date().toISOString().split('T')[0];
    
    // We parse adherence just like HomeScreen does
    medications.forEach(med => {
      if (med.status !== 'active') return;
      med.schedule.forEach(sched => {
        const id = `${med.id}:${todayStr}:${sched.time}`;
        const isTaken = adherence[id] === 'taken';
        
        const [hours, minutes] = sched.time.split(':').map(Number);
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const isPast = (currentHours > hours) || (currentHours === hours && currentMinutes > minutes);
        
        if (!isTaken && isPast) {
          missedDoses++;
        }
      });
    });

    if (missedDoses > 0) {
      newLevel = 'warning';
      reasons.push(`You have ${missedDoses} missed ${missedDoses === 1 ? 'dose' : 'doses'}.`);
    }

    // 2. Interaction Risk
    const hasInteractionRisk = medications.some(m => 
      m.interactionLog?.some(a => a.severity === 'contraindicated' || a.severity === 'major')
    );
    if (hasInteractionRisk) {
      newLevel = 'critical';
      reasons.push('Severe drug interaction detected in active medications.');
    }

    // 3. Vitals Anomalies
    const vitalAnomalies: string[] = [];
    vitals.forEach(v => {
      if (v.status === 'critical') {
        newLevel = 'critical';
        vitalAnomalies.push(`Critical ${v.label} reading: ${v.value || `${v.sys}/${v.dia}`}${v.unit}`);
        reasons.push(`${v.label} is critically abnormal.`);
      } else if (v.status === 'high' || v.status === 'low') {
        if (newLevel !== 'critical') newLevel = 'warning';
        vitalAnomalies.push(`Abnormal ${v.label} detected: ${v.value || `${v.sys}/${v.dia}`}${v.unit}`);
        reasons.push(`${v.label} is outside optimal range.`);
      }
    });

    if (newLevel === 'safe' && reasons.length === 0) {
      reasons.push('All systems optimal. Baseline stable.');
    }

    setState({
      level: newLevel,
      reasons,
      missedDoses,
      hasInteractionRisk,
      vitalAnomalies
    });

  }, [medications, adherence, vitals]);

  return state;
}
