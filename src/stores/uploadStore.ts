import { create } from 'zustand';

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface UploadJob {
  /** Pre-generated pin ID (UUID), used to correlate with the DB row */
  id: string;
  /** Display title shown in the banner */
  title: string;
  status: UploadStatus;
  error?: string;
}

interface UploadStoreState {
  jobs: UploadJob[];
  addJob: (job: UploadJob) => void;
  updateJob: (id: string, patch: Partial<Omit<UploadJob, 'id'>>) => void;
  dismissJob: (id: string) => void;
  clearDone: () => void;
}

export const useUploadStore = create<UploadStoreState>((set) => ({
  jobs: [],

  addJob: (job) =>
    set((state) => ({ jobs: [...state.jobs, job] })),

  updateJob: (id, patch) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })),

  dismissJob: (id) =>
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),

  clearDone: () =>
    set((state) => ({ jobs: state.jobs.filter((j) => j.status !== 'done') })),
}));
