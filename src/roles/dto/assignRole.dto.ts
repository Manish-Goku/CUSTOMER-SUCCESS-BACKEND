import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ description: 'UUID of the user (agent)' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'UUID of the role to assign' })
  @IsUUID()
  role_id: string;
}
