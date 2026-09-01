import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdjustmentRequestService } from './adjustment-request.service';
import { UserRole } from './adjustments.dto';

@Injectable()
export class CounselorStudentGuard implements CanActivate {
  constructor(private readonly adjustmentService: AdjustmentRequestService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract user credentials from request headers or injected user object
    const userId = request.headers['x-user-id'] || request.user?.id;
    const userRole = (request.headers['x-user-role'] || request.user?.role) as UserRole;

    if (!userId || !userRole) {
      throw new UnauthorizedException('Authentication credentials missing (x-user-id, x-user-role)');
    }

    // Attach user to request for downstream controller usage
    request.user = { id: userId, role: userRole };

    // 1. ADMIN_GOVERNANCE and STAFF_AUDITOR have global oversight access
    if (userRole === UserRole.ADMIN_GOVERNANCE || userRole === UserRole.STAFF_AUDITOR) {
      return true;
    }

    // Extract target studentId from route params, query, or body
    const targetStudentId =
      request.params.studentId ||
      request.query.studentId ||
      request.body?.studentId;

    // 2. APPLICANT (Student) role verification: Student can only access their own records
    if (userRole === UserRole.APPLICANT) {
      if (targetStudentId && targetStudentId !== userId) {
        throw new ForbiddenException(
          `Access denied: Student ${userId} is not authorized to access data for student ${targetStudentId}`,
        );
      }
      return true;
    }

    // 3. COUNSELOR role verification: Counselor can only access mapped students
    if (userRole === UserRole.COUNSELOR) {
      if (!targetStudentId) {
        // Accessing counselor's own scoped dashboard / adjustments
        return true;
      }

      const isMapped = await this.adjustmentService.isCounselorMappedToStudent(
        userId,
        targetStudentId,
      );

      if (!isMapped) {
        throw new ForbiddenException(
          `Access denied: Counselor ${userId} is not assigned to student ${targetStudentId}. RBAC scoping violation.`,
        );
      }

      return true;
    }

    throw new ForbiddenException(`Role ${userRole} is not permitted to access this resource`);
  }
}
