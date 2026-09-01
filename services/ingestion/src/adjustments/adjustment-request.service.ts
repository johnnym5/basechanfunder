import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AdjustmentRequest,
  AdjustmentStatus,
  AdjustmentType,
  AssignCounselorDto,
  CreateAdjustmentRequestDto,
  ReviewAdjustmentDto,
  StudentCounselorMapping,
  UserRole,
} from './adjustments.dto';

@Injectable()
export class AdjustmentRequestService {
  // In-memory persistent store for student-counselor mappings and adjustment requests
  private mappings: Map<string, StudentCounselorMapping> = new Map();
  private adjustmentRequests: Map<string, AdjustmentRequest> = new Map();

  constructor() {
    // Seed default baseline counselor-student mappings for demonstration
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultCounselorId = 'counselor-sarah-101';
    const defaultStudentId = 'student-chidi-8941';

    const mappingId = `map-${defaultCounselorId}-${defaultStudentId}`;
    this.mappings.set(mappingId, {
      id: mappingId,
      counselorId: defaultCounselorId,
      studentId: defaultStudentId,
      isActive: true,
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 1. Assign counselor to student
  async assignCounselor(dto: AssignCounselorDto): Promise<StudentCounselorMapping> {
    const key = `map-${dto.counselorId}-${dto.studentId}`;
    const mapping: StudentCounselorMapping = {
      id: key,
      counselorId: dto.counselorId,
      studentId: dto.studentId,
      isActive: true,
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.mappings.set(key, mapping);
    return mapping;
  }

  // 2. Check if a counselor is actively mapped to a student (RBAC Scoping)
  async isCounselorMappedToStudent(counselorId: string, studentId: string): Promise<boolean> {
    for (const mapping of this.mappings.values()) {
      if (
        mapping.counselorId === counselorId &&
        mapping.studentId === studentId &&
        mapping.isActive
      ) {
        return true;
      }
    }
    return false;
  }

  // 3. Get all active student mappings for a counselor
  async getCounselorMappings(counselorId: string): Promise<StudentCounselorMapping[]> {
    return Array.from(this.mappings.values()).filter(
      (m) => m.counselorId === counselorId && m.isActive,
    );
  }

  // 4. Create an Adjustment Request with 24-Hour Grace Period Enforcement
  async createAdjustmentRequest(dto: CreateAdjustmentRequestDto): Promise<AdjustmentRequest> {
    const requestId = `adj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    
    // Exactly 24 hours from creation
    const gracePeriodExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Auto-resolve counselor if mapped
    let assignedCounselorId = dto.counselorId;
    if (!assignedCounselorId) {
      const activeMapping = Array.from(this.mappings.values()).find(
        (m) => m.studentId === dto.studentId && m.isActive,
      );
      if (activeMapping) {
        assignedCounselorId = activeMapping.counselorId;
      }
    }

    const request: AdjustmentRequest = {
      id: requestId,
      studentId: dto.studentId,
      counselorId: assignedCounselorId,
      requestType: dto.requestType,
      currentValue: dto.currentValue,
      requestedValue: dto.requestedValue,
      details: dto.details || {},
      reason: dto.reason,
      supportingDocumentUrl: dto.supportingDocumentUrl,
      status: AdjustmentStatus.PENDING,
      gracePeriodExpiresAt,
      isGracePeriodActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.adjustmentRequests.set(requestId, request);
    return request;
  }

  // 5. Get all adjustments for a student
  async getStudentAdjustments(studentId: string): Promise<AdjustmentRequest[]> {
    const now = Date.now();
    return Array.from(this.adjustmentRequests.values())
      .filter((req) => req.studentId === studentId)
      .map((req) => ({
        ...req,
        isGracePeriodActive: now < new Date(req.gracePeriodExpiresAt).getTime() && req.status === AdjustmentStatus.PENDING,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 6. Get all adjustments assigned to a counselor (Scoped to mapped students)
  async getCounselorAdjustments(counselorId: string): Promise<AdjustmentRequest[]> {
    const mappings = await this.getCounselorMappings(counselorId);
    const assignedStudentIds = new Set(mappings.map((m) => m.studentId));

    const now = Date.now();
    return Array.from(this.adjustmentRequests.values())
      .filter((req) => req.counselorId === counselorId || assignedStudentIds.has(req.studentId))
      .map((req) => ({
        ...req,
        isGracePeriodActive: now < new Date(req.gracePeriodExpiresAt).getTime() && req.status === AdjustmentStatus.PENDING,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 7. Cancel Adjustment Request (Enforcing 24-Hour Grace Period)
  async cancelAdjustmentRequest(requestId: string, studentId: string): Promise<AdjustmentRequest> {
    const request = this.adjustmentRequests.get(requestId);
    if (!request) {
      throw new NotFoundException(`Adjustment request ${requestId} not found`);
    }

    if (request.studentId !== studentId) {
      throw new ForbiddenException(`You are not authorized to cancel this adjustment request`);
    }

    if (request.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel request with status ${request.status}`);
    }

    const now = Date.now();
    const expiryTime = new Date(request.gracePeriodExpiresAt).getTime();

    // 24-hour grace period validation check
    if (now > expiryTime) {
      throw new BadRequestException(
        `24-hour grace period has expired on ${request.gracePeriodExpiresAt.toISOString()}. This adjustment request is now locked and under official review.`,
      );
    }

    request.status = AdjustmentStatus.CANCELLED;
    request.isGracePeriodActive = false;
    request.updatedAt = new Date();
    this.adjustmentRequests.set(requestId, request);

    return request;
  }

  // 8. Review Adjustment Request (Approve / Reject)
  async reviewAdjustmentRequest(
    requestId: string,
    reviewerId: string,
    reviewerRole: string,
    dto: ReviewAdjustmentDto,
  ): Promise<AdjustmentRequest> {
    const request = this.adjustmentRequests.get(requestId);
    if (!request) {
      throw new NotFoundException(`Adjustment request ${requestId} not found`);
    }

    // If reviewer is a COUNSELOR, verify scoping to student
    if (reviewerRole === UserRole.COUNSELOR) {
      const isMapped = await this.isCounselorMappedToStudent(reviewerId, request.studentId);
      if (!isMapped) {
        throw new ForbiddenException(
          `Counselor ${reviewerId} is not authorized to review adjustments for student ${request.studentId}`,
        );
      }
    }

    request.status = dto.status;
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNotes = dto.reviewNotes;
    request.isGracePeriodActive = false;
    request.updatedAt = new Date();

    this.adjustmentRequests.set(requestId, request);
    return request;
  }

  // Utility for testing: artificially fast-forward grace period for testing expiry
  expireGracePeriodForTesting(requestId: string): void {
    const req = this.adjustmentRequests.get(requestId);
    if (req) {
      req.gracePeriodExpiresAt = new Date(Date.now() - 1000); // 1 second in the past
      req.isGracePeriodActive = false;
      this.adjustmentRequests.set(requestId, req);
    }
  }
}
