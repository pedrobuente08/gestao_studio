export type TattooSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE' | 'XLARGE' | 'FULL_BODY';
export type TattooComplexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type BodyLocation = 'ARM' | 'FOREARM' | 'HAND' | 'FINGER' | 'UPPER_BACK' |
  'LOWER_BACK' | 'FULL_BACK' | 'CHEST' | 'ABDOMEN' | 'SHOULDER' | 'NECK' |
  'FACE' | 'HEAD' | 'THIGH' | 'CALF' | 'FOOT' | 'RIB' | 'INNER_ARM' |
  'WRIST' | 'ANKLE' | 'TRAPEZIUS' | 'SHIN' | 'COLLARBONE' | 'OTHER';

export interface Procedure {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  finalPrice: number;    // em centavos
  duration: number;      // em minutos
  createdAt: string;
  updatedAt: string;
  sessionCount?: number;
}

export interface CreateProcedureData {
  name: string;
  description?: string;
  size: TattooSize;
  complexity: TattooComplexity;
  bodyLocation: BodyLocation;
  finalPrice: number;    // em centavos
  duration: number;
}

export type UpdateProcedureData = Partial<CreateProcedureData>;
