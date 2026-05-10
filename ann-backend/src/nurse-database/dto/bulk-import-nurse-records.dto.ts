import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';

export class NurseRecordItemDto {
  @IsObject()
  data: Record<string, unknown>;
}

export class BulkImportNurseRecordsDto {
  @IsArray()
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => NurseRecordItemDto)
  records: NurseRecordItemDto[];
}
