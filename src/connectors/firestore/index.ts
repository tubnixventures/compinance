import { cosmosService } from '../cosmos';
import { logger } from '../../utils/logger';

export interface FirestoreDoc<T = any> {
  id: string;
  data: () => T;
  exists: boolean;
}

/**
 * Cosmos-backed Document Collection Interface
 * Seamlessly stores all documents in Azure Cosmos DB containers while maintaining native method compatibility.
 */
export class FirestoreCollection<T = any> {
  constructor(private collectionName: string) {}

  private getCosmosContainer(): any {
    switch (this.collectionName) {
      case 'users':
        return cosmosService.users;
      case 'loans':
        return cosmosService.loans;
      case 'verifications':
        return cosmosService.verifications;
      case 'otps':
        return cosmosService.otps;
      case 'audit_logs':
        return cosmosService.auditLogs;
      case 'pawapay_webhooks':
        return cosmosService.pawapayWebhooks;
      default:
        return cosmosService.loans;
    }
  }

  async add(data: any): Promise<{ id: string }> {
    const container = this.getCosmosContainer();
    const id = data.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = { ...JSON.parse(JSON.stringify(data)), id };
    await container.items.upsert(record);
    return { id };
  }

  async doc(id: string): Promise<{
    get: () => Promise<FirestoreDoc<T>>;
    set: (data: Partial<T>, options?: { merge?: boolean }) => Promise<void>;
    update: (data: Partial<T>) => Promise<void>;
    delete: () => Promise<void>;
  }> {
    const container = this.getCosmosContainer();
    return {
      get: async () => {
        try {
          const res = await container.item(id, id).read();
          const item = res.resource;
          return {
            id,
            exists: Boolean(item),
            data: () => (item ? JSON.parse(JSON.stringify(item)) : (undefined as any)),
          };
        } catch {
          return { id, exists: false, data: () => undefined as any };
        }
      },
      set: async (data: Partial<T>, options?: { merge?: boolean }) => {
        let existing = {};
        if (options?.merge) {
          try {
            const current = await container.item(id, id).read();
            existing = current.resource || {};
          } catch {}
        }
        const record = { ...existing, ...JSON.parse(JSON.stringify(data)), id };
        await container.items.upsert(record);
      },
      update: async (data: Partial<T>) => {
        let existing = {};
        try {
          const current = await container.item(id, id).read();
          existing = current.resource || {};
        } catch {}
        const record = { ...existing, ...JSON.parse(JSON.stringify(data)), id };
        await container.items.upsert(record);
      },
      delete: async () => {
        try {
          await container.item(id, id).delete();
        } catch {}
      },
    };
  }

  async get(): Promise<{ docs: Array<FirestoreDoc<T>> }> {
    const container = this.getCosmosContainer();
    let items: any[] = [];
    try {
      if (typeof container.getAll === 'function') {
        items = container.getAll();
      } else {
        const querySpec = { query: 'SELECT * FROM c' };
        const res = await container.items.query(querySpec).fetchAll();
        items = res.resources || [];
      }
    } catch (err: any) {
      logger.warn(`Cosmos fetchAll for ${this.collectionName} returned fallback:`, err.message);
    }

    const docs: Array<FirestoreDoc<T>> = items.map((item) => ({
      id: item.id,
      exists: true,
      data: () => JSON.parse(JSON.stringify(item)),
    }));

    return { docs };
  }
}

export const nativeFirestore = {
  collection: <T = any>(name: string) => new FirestoreCollection<T>(name),
  getCosmosStatus: () => cosmosService.getStatus(),
};
