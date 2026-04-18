import Dexie, { type Table } from 'dexie';
import type { Medication } from '../types/medication';
import type { UserProfile } from '../types/user';

export interface AdherenceLog {
  id: string; // medicationId:YYYY-MM-DD:time
  status: 'taken' | 'missed';
  loggedAt: number;
}

export interface DrugDataset {
  name: string;
  interactions: string[];
}

export class MedScannerDB extends Dexie {
  medicines!: Table<Medication>;
  drugDataset!: Table<DrugDataset>;
  userProfile!: Table<UserProfile>;
  adherence!: Table<AdherenceLog>;

  constructor() {
    super('MedScannerDB');
    this.version(4).stores({
      medicines: 'id, addedAt, genericName',
      drugDataset: 'name',
      userProfile: 'uid',
      adherence: 'id'
    });
  }
}

export const db = new MedScannerDB();

export const dbOperations = {
  async addMedication(medication: Medication) {
    await db.medicines.put(medication);
    return medication.id;
  },

  async getMedication(id: string) {
    return db.medicines.get(id);
  },

  async getMedicines() {
    const meds = await db.medicines.orderBy('addedAt').toArray();
    return meds.reverse(); // Newest first
  },

  async updateMedication(id: string, updates: Partial<Medication>) {
    await db.medicines.update(id, updates);
    return db.medicines.get(id);
  },

  async deleteMedication(id: string) {
    await db.medicines.delete(id);
  },

  // Adherence
  async logAdherence(log: AdherenceLog) {
    await db.adherence.put(log);
  },

  async getAdherenceLogs(medicationId: string, date: string) {
    const prefix = `${medicationId}:${date}`;
    return db.adherence.filter(l => l.id.startsWith(prefix)).toArray();
  },

  async getAllAdherenceForDate(date: string) {
    return db.adherence.filter(l => l.id.split(':')[1] === date).toArray();
  },

  // Dataset utilities
  async seedDataset(dataset: DrugDataset[]) {
    await db.drugDataset.bulkPut(dataset);
  },

  async getInteractions(drugName: string): Promise<string[]> {
    const obj = await db.drugDataset.get(drugName);
    return obj ? obj.interactions : [];
  },

  // User Profile CRUD
  async saveUserProfile(profile: UserProfile) {
    await db.userProfile.put(profile);
  },

  async getUserProfile(): Promise<UserProfile | undefined> {
    const all = await db.userProfile.toArray();
    return all[0];
  },

  async deleteUserProfile(uid: string) {
    await db.userProfile.delete(uid);
  }
};
