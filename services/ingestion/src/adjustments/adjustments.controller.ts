import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
} from '@nestjs/common';
import { AdjustmentRequestService } from './adjustment-request.service';
import { CounselorStudentGuard } from './counselor-student.guard';
import {
  AssignCounselorDto,
  CreateAdjustmentRequestDto,
  ReviewAdjustmentDto,
} from './adjustments.dto';

@Controller('api/v1/adjustments')
export class AdjustmentsController {
  constructor(private readonly adjustmentService: AdjustmentRequestService) {}

  // 1. Create an Adjustment Request (Student)
  @Post()
  @UseGuards(CounselorStudentGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAdjustment(@Body() dto: CreateAdjustmentRequestDto, @Req() req: any) {
    // Force studentId to match authenticated user if role is APPLICANT
    if (req.user?.role === 'APPLICANT') {
      dto.studentId = req.user.id;
    }
    return this.adjustmentService.createAdjustmentRequest(dto);
  }

  // 2. Get Student's Adjustment Requests (Guarded by CounselorStudentGuard)
  @Get('student/:studentId')
  @UseGuards(CounselorStudentGuard)
  async getStudentAdjustments(@Param('studentId') studentId: string) {
    return this.adjustmentService.getStudentAdjustments(studentId);
  }

  // 3. Get Counselor's Scoped Adjustment Requests
  @Get('counselor/:counselorId')
  @UseGuards(CounselorStudentGuard)
  async getCounselorAdjustments(@Param('counselorId') counselorId: string) {
    return this.adjustmentService.getCounselorAdjustments(counselorId);
  }

  // 4. Cancel Request within 24-Hour Grace Period (Student)
  @Delete(':id/cancel')
  @UseGuards(CounselorStudentGuard)
  @HttpCode(HttpStatus.OK)
  async cancelAdjustment(@Param('id') id: string, @Req() req: any) {
    const studentId = req.user.id;
    return this.adjustmentService.cancelAdjustmentRequest(id, studentId);
  }

  // 5. Review Adjustment Request (Counselor / Admin)
  @Patch(':id/review')
  @UseGuards(CounselorStudentGuard)
  @HttpCode(HttpStatus.OK)
  async reviewAdjustment(
    @Param('id') id: string,
    @Body() dto: ReviewAdjustmentDto,
    @Req() req: any,
  ) {
    return this.adjustmentService.reviewAdjustmentRequest(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  // 6. Assign Counselor to Student Mapping (Admin / Setup)
  @Post('mappings')
  @UseGuards(CounselorStudentGuard)
  @HttpCode(HttpStatus.CREATED)
  async assignCounselor(@Body() dto: AssignCounselorDto) {
    return this.adjustmentService.assignCounselor(dto);
  }

  // 7. Get Counselor Mappings
  @Get('mappings/counselor/:counselorId')
  @UseGuards(CounselorStudentGuard)
  async getCounselorMappings(@Param('counselorId') counselorId: string) {
    return this.adjustmentService.getCounselorMappings(counselorId);
  }
}
