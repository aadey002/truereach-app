// This application uses stateless API calls and doesn't require persistent storage
// Storage interface can be extended in the future if needed

export interface IStorage {
  // Add storage methods here if needed
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed for phone validation
  }
}

export const storage = new MemStorage();
