export class ClientResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  email!: string | null;
  phone!: string | null;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  totalSessions!: number;
  totalSpent!: number;
  lastVisit!: Date | null;
}