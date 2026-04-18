import { create } from 'zustand';
import { dbOperations, type AdherenceLog } from '../lib/db';
import type { Medication } from '../types/medication';

interface MedicationStore {
  medications: Medication[];
  isLoading: boolean;
  pendingScan: Partial<Medication> | null;
  adherence: Record<string, 'taken' | 'missed'>; // key: medId:YYYY-MM-DD:time
  
  // Actions
  setPendingScan: (scan: Partial<Medication> | null) => void;
  fetchMedications: () => Promise<void>;
  fetchAdherence: (date: string) => Promise<void>;
  addMedication: (med: Medication) => Promise<string>;
  removeMedication: (id: string) => Promise<void>;
  markAsTaken: (medicationId: string, date: string, time: string) => Promise<void>;
}

export const useMedicationStore = create<MedicationStore>((set, get) => ({
  medications: [],
  isLoading: false,
  pendingScan: null,
  adherence: {},

  setPendingScan: (scan) => set({ pendingScan: scan }),

  fetchMedications: async () => {
    set({ isLoading: true });
    try {
      const meds = await dbOperations.getMedicines();
      set({ medications: meds, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch medications:', error);
      set({ isLoading: false });
    }
  },

  fetchAdherence: async (date) => {
    try {
      const logs = await dbOperations.getAllAdherenceForDate(date);
      const adherenceMap: Record<string, 'taken' | 'missed'> = {};
      logs.forEach(log => {
        adherenceMap[log.id] = log.status;
      });
      set({ adherence: adherenceMap });
    } catch (error) {
      console.error('Failed to fetch adherence:', error);
    }
  },

  addMedication: async (med) => {
    const id = await dbOperations.addMedication(med);
    await get().fetchMedications();
    return id;
  },

  removeMedication: async (id) => {
    await dbOperations.deleteMedication(id);
    await get().fetchMedications();
  },

  markAsTaken: async (medicationId, date, time) => {
    const id = `${medicationId}:${date}:${time}`;
    const log: AdherenceLog = {
      id,
      status: 'taken',
      loggedAt: Date.now()
    };
    await dbOperations.logAdherence(log);
    
    // Optimistic update
    set((state) => ({
      adherence: { ...state.adherence, [id]: 'taken' }
    }));
  }
}));
