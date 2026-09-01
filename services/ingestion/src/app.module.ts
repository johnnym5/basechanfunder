import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion/ingestion.controller';
import { IngestionService } from './ingestion/ingestion.service';
import { AdjustmentsModule } from './adjustments/adjustments.module';

@Module({
  imports: [AdjustmentsModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class AppModule {}
