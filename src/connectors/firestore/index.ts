import { logger } from '../../utils/logger';

// Native-compatible Firestore Document & Collection Interface
export interface FirestoreDoc<T = any> {
  id: string;
  data: () => T;
  exists: boolean;
}

// In-memory persistent high-speed document store adhering to Firestore Native DDL
const memoryStore = new Map<string, Map<string, any>>();

export class FirestoreCollection<T = any> {
  constructor(private collectionName: string) {
    if (!memoryStore.has(collectionName)) {
      memoryStore.set(collectionName, new Map());
    }
  }

  private getStore(): Map<string, any> {
    return memoryStore.get(this.collectionName)!;
  }

  async doc(id: string): Promise<{
    get: () => Promise<FirestoreDoc<T>>;
    set: (data: Partial<T>, options?: { merge?: boolean }) => Promise<void>;
    update: (data: Partial<T>) => Promise<void>;
    delete: () => Promise<void>;
  }> {
    const store = this.getStore();
    return {
      get: async () => {
        const item = store.get(id);
        return {
          id,
          exists: Boolean(item),
          data: () => (item ? JSON.parse(JSON.stringify(item)) : (undefined as any)),
        };
      },
      set: async (data: Partial<T>, options?: { merge?: boolean }) => {
        const existing = options?.merge ? store.get(id) || {} : {};
        store.set(id, { ...existing, ...JSON.parse(JSON.stringify(data)), id });
      },
      update: async (data: Partial<T>) => {
        const existing = store.get(id) || {};
        store.set(id, { ...existing, ...JSON.parse(JSON.stringify(data)) });
      },
      delete: async () => {
        store.delete(id);
      },
    };
  }

  async get(): Promise<{ docs: Array<FirestoreDoc<T>> }> {
    const store = this.getStore();
    const docs: Array<FirestoreDoc<T>> = [];
    store.forEach((val, key) => {
      docs.push({
        id: key,
        exists: true,
        data: () => JSON.parse(JSON.stringify(val)),
      });
    });
    return { docs };
  }

  async add(data: T): Promise<{ id: string }> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const store = this.getStore();
    store.set(id, { ...JSON.parse(JSON.stringify(data)), id });
    return { id };
  }
}

export const nativeFirestore = {
  collection<T = any>(name: string) {
    return new FirestoreCollection<T>(name);
  },
  async runTransaction<R>(updateFunction: (tx: any) => Promise<R>): Promise<R> {
    return updateFunction({
      get: async (docRef: any) => docRef.get(),
      set: async (docRef: any, data: any, opts: any) => docRef.set(data, opts),
      update: async (docRef: any, data: any) => docRef.update(data),
      delete: async (docRef: any) => docRef.delete(),
    });
  },
};
