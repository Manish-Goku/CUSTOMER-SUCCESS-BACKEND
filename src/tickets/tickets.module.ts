import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { TicketCategoriesController } from './ticketCategories.controller.js';
import { TicketCategoriesService } from './ticketCategories.service.js';
import { TicketTemplatesController } from './ticketTemplates.controller.js';
import { TicketTemplatesService } from './ticketTemplates.service.js';
import { TicketRoutingRulesController } from './ticketRoutingRules.controller.js';
import { TicketRoutingRulesService } from './ticketRoutingRules.service.js';

@Module({
  controllers: [
    TicketsController,
    TicketCategoriesController,
    TicketTemplatesController,
    TicketRoutingRulesController,
  ],
  providers: [
    TicketsService,
    TicketCategoriesService,
    TicketTemplatesService,
    TicketRoutingRulesService,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
