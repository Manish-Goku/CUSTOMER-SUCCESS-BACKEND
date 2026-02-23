import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmailAiResult {
  summary: string;
  suggested_team: string;
}

const VALID_TEAMS = [
  'finance',
  'support',
  'dispatch',
  'sales',
  'technical',
  'returns_refunds',
  'general',
] as const;

export type TeamName = (typeof VALID_TEAMS)[number];

@Injectable()
export class EmailAiService {
  private readonly logger = new Logger(EmailAiService.name);
  private readonly model;

  constructor(private readonly config_service: ConfigService) {
    const api_key = this.config_service.getOrThrow<string>('GEMINI_API_KEY');
    const gen_ai = new GoogleGenerativeAI(api_key);
    this.model = gen_ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async summarize_and_classify(
    subject: string | null,
    body_text: string | null,
    from_address: string,
  ): Promise<EmailAiResult> {
    const email_content = [
      subject ? `Subject: ${subject}` : '',
      `From: ${from_address}`,
      body_text ? `Body: ${body_text.slice(0, 3000)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `Analyze this customer email and respond with ONLY valid JSON (no markdown, no code blocks):

${email_content}

Respond with this exact JSON structure:
{"summary": "<1-2 sentence summary of what the email is about>", "suggested_team": "<one of: finance, support, dispatch, sales, technical, returns_refunds, general>"}

Rules:
- summary: concise, max 2 sentences, describe the customer's intent/issue
- suggested_team must be exactly one of: finance, support, dispatch, sales, technical, returns_refunds, general
- finance: payment, billing, invoices, refund amounts
- support: general product queries, complaints, feedback
- dispatch: shipping, delivery, tracking, order status
- sales: bulk orders, pricing, partnerships, new purchases
- technical: product usage issues, technical specs
- returns_refunds: return requests, exchange, damaged goods
- general: anything that doesn't fit above`;

    try {
      const result = await this.model.generateContent(prompt);
      const response_text = result.response.text().trim();

      const parsed = JSON.parse(response_text);

      const team = VALID_TEAMS.includes(parsed.suggested_team)
        ? parsed.suggested_team
        : 'general';

      return {
        summary: parsed.summary || 'Unable to summarize',
        suggested_team: team,
      };
    } catch (err) {
      this.logger.error('Failed to summarize/classify email', err);
      return {
        summary: subject || 'No summary available',
        suggested_team: 'general',
      };
    }
  }
}
