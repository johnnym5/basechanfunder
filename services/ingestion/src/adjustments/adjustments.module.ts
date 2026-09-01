import { Module } from '@nestjs/common';
import { AdjustmentsController } from './adjustments.controller';
import { AdjustmentRequestService } from './adjustment-request.service';
import { CounselorStudentGuard } from './counselor-student.guard';

@Module({
  controllers: [AdjustmentsController],
  providers: [AdjustmentRequestService, CounselorStudentGuard],
  exports: [AdjustmentRequestService, CounselorStudentGuard],
})
export class AdjustmentsModule {}
