import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GmailService } from './gmail.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import { SupportEmailRecord } from '../common/interfaces/gmailTypes.js';

@Injectable()
export class GmailCronService {
  private readonly logger = new Logger(GmailCronService.name);

  constructor(
    private readonly gmail_service: GmailService,
    private readonly supabase_service: SupabaseService,
  ) {}

  @Cron('0 */6 * * *')
  async renew_expiring_watches(): Promise<void> {
    this.logger.log('Checking for expiring Gmail watches...');

    const { data: active_emails, error } = await this.supabase_service
      .getClient()
      .from('support_emails')
      .select('*')
      .eq('is_active', true);

    if (error || !active_emails) {
      this.logger.error('Failed to fetch active emails for renewal', error);
      return;
    }

    const renewal_threshold = new Date();
    renewal_threshold.setHours(renewal_threshold.getHours() + 24);

    for (const email_record of active_emails as SupportEmailRecord[]) {
      const expiration = email_record.watch_expiration
        ? new Date(email_record.watch_expiration)
        : null;

      if (!expiration || expiration < renewal_threshold) {
        try {
          const watch_response = await this.gmail_service.setup_watch(
            email_record.email_address,
          );

          await this.supabase_service
            .getClient()
            .from('support_emails')
            .update({
              watch_expiration: new Date(
                parseInt(watch_response.expiration),
              ).toISOString(),
              watch_history_id: watch_response.history_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', email_record.id);

          this.logger.log(
            `Renewed watch for ${email_record.email_address}`,
          );
        } catch (err) {
          this.logger.error(
            `Failed to renew watch for ${email_record.email_address}`,
            err,
          );
        }
      }
    }

    this.logger.log('Watch renewal check complete');
  }
}
