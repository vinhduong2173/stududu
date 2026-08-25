import Stripe from 'stripe';
import { ProviderEventType } from './payment-provider.interface';

/** SRS §7.3 — bốn sự kiện cần xử lý, cộng nhánh checkout thất bại. */
const EVENT_MAP: Record<string, ProviderEventType> = {
  'checkout.session.completed': 'checkout.session.completed',
  'checkout.session.async_payment_failed': 'checkout.session.failed',
  'checkout.session.expired': 'checkout.session.failed',
  'invoice.payment_succeeded': 'invoice.payment_succeeded',
  'invoice.payment_failed': 'invoice.payment_failed',
  'customer.subscription.deleted': 'customer.subscription.deleted',
};

export function mapEventType(stripeType: string): ProviderEventType | null {
  return EVENT_MAP[stripeType] ?? null;
}

interface ExtractedEvent {
  userId: number;
  providerSubId?: string;
  providerCustomerId?: string;
  amount?: number;
  providerRef?: string;
  failureReason?: string;
}

/**
 * Tìm userId trong payload Stripe.
 *
 * Phải dò nhiều chỗ vì mỗi loại object gắn định danh một kiểu: checkout session
 * dùng `client_reference_id`, còn invoice thì chỉ truy được qua metadata mà ta
 * đã gắn lên subscription lúc tạo phiên. Thiếu tất cả thì trả 0 để tầng trên
 * bỏ qua event thay vì gán nhầm gói cho người khác.
 */
export function extractUserId(event: Stripe.Event): ExtractedEvent {
  const object = event.data.object as unknown as Record<string, unknown>;

  if (event.type.startsWith('checkout.session')) {
    const session = object as unknown as Stripe.Checkout.Session;
    return {
      userId: toId(session.client_reference_id),
      providerSubId: idOf(session.subscription),
      providerCustomerId: idOf(session.customer),
      amount: session.amount_total ?? undefined,
      providerRef: session.id,
    };
  }

  if (event.type.startsWith('invoice.')) {
    const invoice = object as unknown as Stripe.Invoice;
    return {
      userId: toId(metadataUserId(object)),
      providerSubId: invoiceSubscriptionId(object),
      providerCustomerId: idOf(invoice.customer),
      amount: invoice.amount_paid || invoice.amount_due || undefined,
      providerRef: invoice.id,
      failureReason:
        invoice.status === 'uncollectible' ? 'uncollectible' : undefined,
    };
  }

  const subscription = object as unknown as Stripe.Subscription;
  return {
    userId: toId(subscription.metadata?.userId),
    providerSubId: subscription.id,
    providerCustomerId: idOf(subscription.customer),
  };
}

/** Metadata do ta gắn lên subscription; invoice mang theo ở vài vị trí tuỳ phiên bản API. */
function metadataUserId(object: Record<string, unknown>): unknown {
  const details = object.subscription_details as
    { metadata?: Record<string, string> } | undefined;
  if (details?.metadata?.userId) return details.metadata.userId;

  const parent = object.parent as
    | { subscription_details?: { metadata?: Record<string, string> } }
    | undefined;
  if (parent?.subscription_details?.metadata?.userId) {
    return parent.subscription_details.metadata.userId;
  }

  const lines = object.lines as
    { data?: { metadata?: Record<string, string> }[] } | undefined;
  return lines?.data?.[0]?.metadata?.userId;
}

function invoiceSubscriptionId(
  object: Record<string, unknown>,
): string | undefined {
  const direct = idOf(object.subscription);
  if (direct) return direct;

  const parent = object.parent as
    | { subscription_details?: { subscription?: string | { id: string } } }
    | undefined;
  return idOf(parent?.subscription_details?.subscription);
}

function idOf(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id;
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
}

function toId(value: unknown): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
