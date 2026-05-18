import { Global, Module, OnModuleInit } from '@nestjs/common';

import { FileStorageService } from './file-storage.service';
import { registerFileStorage } from './file-storage.registry';

@Global()
@Module({
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class StorageModule implements OnModuleInit {
  constructor(private readonly fileStorage: FileStorageService) {}

  onModuleInit(): void {
    registerFileStorage(this.fileStorage);
  }
}
