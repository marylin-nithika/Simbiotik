import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Grievance, GrievanceSchema } from './schemas/grievance.schema';
import { Counter, CounterSchema } from '../common/schemas/counter.schema';
import { GrievancesController } from './grievances.controller';
import { GrievancesService } from './grievances.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Grievance.name, schema: GrievanceSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [GrievancesController],
  providers: [GrievancesService],
  exports: [GrievancesService],
})
export class GrievancesModule {}

