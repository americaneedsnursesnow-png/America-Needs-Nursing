import { IsBoolean } from 'class-validator';

export class SetPartnershipDto {
  @IsBoolean()
  partnershipFeatured: boolean;
}
