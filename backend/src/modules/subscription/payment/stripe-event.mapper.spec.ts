import Stripe from 'stripe';
import { extractUserId, mapEventType } from './stripe-event.mapper';

function event(type: string, object: unknown): Stripe.Event {
  return { id: 'evt_1', type, data: { object } } as unknown as Stripe.Event;
}

describe('mapEventType (SRS §7.3)', () => {
  it('ánh xạ đủ 4 sự kiện bắt buộc', () => {
    expect(mapEventType('checkout.session.completed')).toBe('checkout.session.completed');
    expect(mapEventType('invoice.payment_succeeded')).toBe('invoice.payment_succeeded');
    expect(mapEventType('invoice.payment_failed')).toBe('invoice.payment_failed');
    expect(mapEventType('customer.subscription.deleted')).toBe('customer.subscription.deleted');
  });

  it('trả null cho event Stripe gửi kèm mà ta không dùng', () => {
    expect(mapEventType('customer.created')).toBeNull();
    expect(mapEventType('payment_intent.succeeded')).toBeNull();
  });
});

describe('extractUserId', () => {
  it('checkout session lấy userId từ client_reference_id', () => {
    const result = extractUserId(
      event('checkout.session.completed', {
        id: 'cs_1',
        client_reference_id: '42',
        subscription: 'sub_1',
        customer: 'cus_1',
        amount_total: 29000,
      }),
    );

    expect(result).toMatchObject({
      userId: 42,
      providerSubId: 'sub_1',
      providerCustomerId: 'cus_1',
      amount: 29000,
    });
  });

  it('invoice lấy userId từ metadata gắn trên subscription', () => {
    const result = extractUserId(
      event('invoice.payment_failed', {
        id: 'in_1',
        subscription_details: { metadata: { userId: '7' } },
        subscription: 'sub_9',
        amount_due: 29000,
      }),
    );

    expect(result).toMatchObject({ userId: 7, providerSubId: 'sub_9' });
  });

  it('invoice theo hình dạng API mới (parent.subscription_details) vẫn tra được', () => {
    const result = extractUserId(
      event('invoice.payment_succeeded', {
        id: 'in_2',
        parent: {
          subscription_details: { metadata: { userId: '8' }, subscription: 'sub_8' },
        },
        amount_paid: 29000,
      }),
    );

    expect(result).toMatchObject({ userId: 8, providerSubId: 'sub_8' });
  });

  it('customer.subscription.deleted lấy userId từ metadata của subscription', () => {
    const result = extractUserId(
      event('customer.subscription.deleted', {
        id: 'sub_3',
        metadata: { userId: '11' },
        customer: { id: 'cus_3' },
      }),
    );

    expect(result).toMatchObject({ userId: 11, providerSubId: 'sub_3', providerCustomerId: 'cus_3' });
  });

  it('không tra được người dùng thì trả 0 — tuyệt đối không đoán bừa', () => {
    expect(extractUserId(event('invoice.payment_failed', { id: 'in_3' })).userId).toBe(0);
    expect(
      extractUserId(event('checkout.session.completed', { id: 'cs_2', client_reference_id: 'abc' }))
        .userId,
    ).toBe(0);
  });
});
