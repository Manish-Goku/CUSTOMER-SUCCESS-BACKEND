import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ChatTemplatesService } from './chatTemplates.service.js';
import {
  CreateChatTemplateDto,
  UpdateChatTemplateDto,
  GetChatTemplatesDto,
  ChatTemplateResponseDto,
} from './dto/chatTemplate.dto.js';

@ApiTags('chat-templates')
@Controller('chat-templates')
export class ChatTemplatesController {
  constructor(private readonly chat_templates_service: ChatTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chat template' })
  @ApiCreatedResponse({ type: ChatTemplateResponseDto })
  async create(
    @Body() dto: CreateChatTemplateDto,
  ): Promise<ChatTemplateResponseDto> {
    return this.chat_templates_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List chat templates with search and filters' })
  @ApiOkResponse({ description: 'Paginated list of chat templates' })
  async find_all(
    @Query() dto: GetChatTemplatesDto,
  ): Promise<{ data: ChatTemplateResponseDto[]; total: number }> {
    return this.chat_templates_service.find_all(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single chat template' })
  @ApiParam({ name: 'id', description: 'Chat template UUID' })
  async find_one(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChatTemplateResponseDto> {
    return this.chat_templates_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chat template' })
  @ApiParam({ name: 'id', description: 'Chat template UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChatTemplateDto,
  ): Promise<ChatTemplateResponseDto> {
    return this.chat_templates_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chat template' })
  @ApiParam({ name: 'id', description: 'Chat template UUID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.chat_templates_service.remove(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a chat template' })
  @ApiParam({ name: 'id', description: 'Chat template UUID' })
  @ApiCreatedResponse({ type: ChatTemplateResponseDto })
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChatTemplateResponseDto> {
    return this.chat_templates_service.duplicate(id);
  }

  @Post(':id/usage')
  @ApiOperation({ summary: 'Increment usage count for a template' })
  @ApiParam({ name: 'id', description: 'Chat template UUID' })
  async increment_usage(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.chat_templates_service.increment_usage(id);
    return { success: true };
  }
}
