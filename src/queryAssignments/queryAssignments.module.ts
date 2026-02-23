import { Module } from '@nestjs/common';
import { QueryAssignmentsController } from './queryAssignments.controller.js';
import { QueryAssignmentsService } from './queryAssignments.service.js';

@Module({
  controllers: [QueryAssignmentsController],
  providers: [QueryAssignmentsService],
  exports: [QueryAssignmentsService],
})
export class QueryAssignmentsModule {}
