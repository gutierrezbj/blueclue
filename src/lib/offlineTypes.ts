export type OfflinePack = {
  id: string;
  assets: string[];
  audio: string[];
  audioBytes: number;
};

export type OfflineStatus = { id: string; bytes: number } | null;
