import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service.js';
import { CreateRoleDto, UpdateRoleDto } from './dto/createRole.dto.js';
import { AssignRoleDto } from './dto/assignRole.dto.js';
import { UpdateModuleAccessDto } from './dto/updateModuleAccess.dto.js';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly roles_service: RolesService) {}

  // ─── Roles CRUD ────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all roles' })
  @ApiOkResponse({ description: 'List of roles' })
  async list_roles() {
    return this.roles_service.list_roles();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiCreatedResponse({ description: 'Role created' })
  async create_role(@Body() dto: CreateRoleDto) {
    return this.roles_service.create_role(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  async update_role(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roles_service.update_role(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role and its related access entries' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  async delete_role(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles_service.delete_role(id);
  }

  // ─── Modules ───────────────────────────────────────────────────

  @Get('modules')
  @ApiOperation({ summary: 'List all modules' })
  @ApiOkResponse({ description: 'List of modules' })
  async list_modules() {
    return this.roles_service.list_modules();
  }

  @Get(':id/modules')
  @ApiOperation({ summary: 'Get modules accessible by a role' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  async get_role_modules(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles_service.get_role_modules(id);
  }

  @Put(':id/modules')
  @ApiOperation({ summary: 'Set module access for a role (replaces existing)' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  async set_role_modules(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleAccessDto,
  ) {
    return this.roles_service.set_role_modules(id, dto);
  }

  // ─── User Role Assignments ────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all user-role assignments (with agent & role details)' })
  @ApiOkResponse({ description: 'List of user-role assignments' })
  async list_user_roles() {
    return this.roles_service.list_user_roles();
  }

  @Post('users')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiCreatedResponse({ description: 'Role assigned to user' })
  async assign_role(@Body() dto: AssignRoleDto) {
    return this.roles_service.assign_role(dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Remove a user-role assignment' })
  @ApiParam({ name: 'id', description: 'User role assignment UUID' })
  async remove_user_role(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles_service.remove_user_role(id);
  }

  @Get('users/:user_id/access')
  @ApiOperation({ summary: 'Get full access info for a user (role + modules)' })
  @ApiParam({ name: 'user_id', description: 'User (agent) UUID' })
  async get_user_access(@Param('user_id', ParseUUIDPipe) user_id: string) {
    return this.roles_service.get_user_access(user_id);
  }
}
