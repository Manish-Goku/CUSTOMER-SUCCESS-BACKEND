import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SurveyTemplatesService } from './surveyTemplates.service.js';
import { CreateSurveyTemplateDto, UpdateSurveyTemplateDto } from './dto/createSurveyTemplate.dto.js';
import { CreateSurveyQuestionDto, UpdateSurveyQuestionDto } from './dto/createSurveyQuestion.dto.js';

@ApiTags('survey-templates')
@Controller('survey-templates')
export class SurveyTemplatesController {
  constructor(private readonly survey_templates_service: SurveyTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a survey template' })
  async create(@Body() dto: CreateSurveyTemplateDto) {
    return this.survey_templates_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all survey templates' })
  async find_all() {
    return this.survey_templates_service.find_all();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get survey template with questions' })
  async find_one(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_templates_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a survey template' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSurveyTemplateDto,
  ) {
    return this.survey_templates_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a survey template' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_templates_service.remove(id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle survey template active status' })
  async toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_templates_service.toggle(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a survey template with questions' })
  async duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_templates_service.duplicate(id);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add a question to a survey template' })
  async add_question(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSurveyQuestionDto,
  ) {
    return this.survey_templates_service.add_question(id, dto);
  }

  @Patch('questions/:question_id')
  @ApiOperation({ summary: 'Update a survey question' })
  async update_question(
    @Param('question_id', ParseUUIDPipe) question_id: string,
    @Body() dto: UpdateSurveyQuestionDto,
  ) {
    return this.survey_templates_service.update_question(question_id, dto);
  }

  @Delete('questions/:question_id')
  @ApiOperation({ summary: 'Delete a survey question' })
  async remove_question(@Param('question_id', ParseUUIDPipe) question_id: string) {
    return this.survey_templates_service.remove_question(question_id);
  }
}
