import { Module, Global } from '@nestjs/common';
import { EmailGateway } from './emailGateway.gateway.js';

@Global()
@Module({
  providers: [EmailGateway],
  exports: [EmailGateway],
})
export class EmailGatewayModule {}
