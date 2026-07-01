import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { Payroll, PayrollSchema } from './schemas/payroll.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Payroll.name, schema: PayrollSchema }])],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
