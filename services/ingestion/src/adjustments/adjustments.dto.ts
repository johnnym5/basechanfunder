import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export enum UserRole {
  APPLICANT = 'APPLICANT',
  COUNSELOR = 'COUNSELOR',
  STAFF_AUDITOR = 'STAFF_AUDITOR',
  ADMIN_GOVERNANCE = 'ADMIN_GOVERNANCE',
}

export enum AdjustmentType {
  FUNDING_TARGET = 'FUNDING_TARGET',
  TIMELINE_EXTENSION = 'TIMELINE_EXTENSION',
  FX_BUFFER_OVERRIDE = 'FX_BUFFER_OVERRIDE',
  DOCUMENT_AMENDMENT = 'DOCUMENT_AMENDMENT',
}

export enum AdjustmentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export class CreateAdjustmentRequestDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsString()
  counselorId?: string;

  @IsEnum(AdjustmentType)
  @IsNotEmpty()
  requestType: AdjustmentType;

  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  requestedValue: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  supportingDocumentUrl?: string;

  @IsOptional()
  details?: Record<string, any>;
}

export class ReviewAdjustmentDto {
  @IsEnum(AdjustmentStatus)
  @IsNotEmpty()
  status: AdjustmentStatus.APPROVED | AdjustmentStatus.REJECTED;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class AssignCounselorDto {
  @IsString()
  @IsNotEmpty()
  counselorId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export interface StudentCounselorMapping {
  id: string;
  counselorId: string;
  studentId: string;
  isActive: boolean;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdjustmentRequest {
  id: string;
  studentId: string;
  counselorId?: string;
  requestType: AdjustmentType;
  currentValue?: number;
  requestedValue: number;
  details: Record<string, any>;
  reason: string;
  supportingDocumentUrl?: string;
  status: AdjustmentStatus;
  gracePeriodExpiresAt: Date;
  isGracePeriodActive?: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
