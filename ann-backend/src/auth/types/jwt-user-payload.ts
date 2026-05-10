import { UserRole } from '../../database/entities';

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: UserRole;
  clientName: string;
}
