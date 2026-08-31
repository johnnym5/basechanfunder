import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion/ingestion.controller';
import { IngestionService } from './ingestion/ingestion.service';

@Module({
  imports: [],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class AppModule {}
