import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

interface IvrProvider {
  id: string;
  slug: string;
  name: string;
  api_key: string;
  field_mapping: Record<string, string>;
  status_map: Record<string, string>;
  is_active: boolean;
}

@Injectable()
export class IvrWebhooksService {
  private readonly logger = new Logger(IvrWebhooksService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  /**
   * Resolve a dot-notation path from a nested object.
   * e.g. resolve_path({ data: { caller: "9876" } }, "data.caller") => "9876"
   */
  private resolve_path(
    obj: Record<string, unknown>,
    path: string,
  ): unknown | undefined {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  async process_webhook(
    slug: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const client = this.supabase_service.getClient();

    // 1. Look up provider by slug
    const { data: provider, error: provider_error } = await client
      .from('ivr_providers')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (provider_error || !provider) {
      throw new NotFoundException(`IVR provider not found: ${slug}`);
    }

    const typed_provider = provider as IvrProvider;

    // 2. Apply field mapping
    const field_mapping = typed_provider.field_mapping || {};
    const mapped: Record<string, unknown> = {};

    for (const [our_field, provider_path] of Object.entries(field_mapping)) {
      const value = this.resolve_path(payload, provider_path);
      if (value !== undefined) {
        mapped[our_field] = value;
      }
    }

    // 4. Apply status mapping
    const status_map = typed_provider.status_map || {};
    const raw_status = String(mapped.status || '').toUpperCase();
    const canonical_status = status_map[raw_status] || 'waiting';

    // 5. Build the ivr_calls row
    const call_id =
      mapped.call_id ||
      `${slug.toUpperCase()}-${Date.now()}`;

    const row = {
      call_id: String(call_id),
      mobile_number: String(mapped.mobile_number || ''),
      customer_name: mapped.customer_name
        ? String(mapped.customer_name)
        : null,
      did_number: mapped.did_number ? String(mapped.did_number) : null,
      department: slug,
      status: canonical_status,
      state: mapped.state ? String(mapped.state) : null,
      order_id: mapped.order_id ? String(mapped.order_id) : null,
      received_at: new Date().toISOString(),
    };

    // 6. Upsert into ivr_calls (call_id is unique)
    const { error: insert_error } = await client
      .from('ivr_calls')
      .upsert(row, { onConflict: 'call_id' });

    if (insert_error) {
      this.logger.error(
        `Failed to insert IVR call [${slug}]: ${insert_error.message}`,
      );
      return;
    }

    this.logger.log(
      `Ingested IVR call: ${row.call_id} → ${slug} (${canonical_status})`,
    );
  }
}
