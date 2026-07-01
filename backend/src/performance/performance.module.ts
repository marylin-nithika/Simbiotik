import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { Performance, PerformanceSchema } from './schemas/performance.schema';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import { PerformanceTemplate, PerformanceTemplateSchema } from './schemas/template.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Performance.name, schema: PerformanceSchema },
    { name: Feedback.name, schema: FeedbackSchema },
    { name: PerformanceTemplate.name, schema: PerformanceTemplateSchema },
  ])],
  controllers: [PerformanceController],
  providers: [PerformanceService],
})
export class PerformanceModule {}
