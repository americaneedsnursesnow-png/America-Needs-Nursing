import type { FileStorageService } from './file-storage.service';

let instance: FileStorageService | undefined;

export function registerFileStorage(service: FileStorageService): void {
  instance = service;
}

export function getFileStorage(): FileStorageService {
  if (!instance) {
    throw new Error('FileStorageService is not initialized');
  }
  return instance;
}
