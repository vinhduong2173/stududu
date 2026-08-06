import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CallKind, CallStatus, MessageType } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { RING_TIMEOUT_MS } from './calls.constants';
import { CallsService } from './calls.service';

// audio-call-design.md — kiểm các luật dễ vỡ nhất: bận (mục 9), offline (13.2),
// hết giờ đổ chuông (mục 3), mốc tính thời lượng (mục 5) và BR-25.

const CONVERSATION_ID = 7;
const CALLER = 1;
const CALLEE = 2;

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    conversationId: CONVERSATION_ID,
    callerId: CALLER,
    calleeId: CALLEE,
    kind: CallKind.audio,
    status: CallStatus.ringing,
    invitedAt: new Date(),
    startedAt: null,
    endedAt: null,
    durationSec: 0,
    endReason: null,
    ...overrides,
  };
}

describe('CallsService', () => {
  let service: CallsService;
  let prisma: {
    callSession: Record<string, jest.Mock>;
    conversation: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    message: { create: jest.Mock };
  };
  let emit: jest.Mock;
  let fetchSockets: jest.Mock;
  let config: Record<string, string | undefined>;

  beforeEach(async () => {
    prisma = {
      callSession: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) =>
          makeSession(data),
        ),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(makeSession()),
        // Prisma trả về BẢN GHI SAU KHI SỬA, không phải riêng phần data — mock
        // phải trộn lên bản hiện có, nếu không `kind` luôn rơi về mặc định.
        update: jest.fn(
          async ({ data }: { data: Record<string, unknown> }) => ({
            ...(await prisma.callSession.findUnique({ where: { id: 0 } })),
            ...data,
          }),
        ),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { durationSec: 0 } }),
      },
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: CONVERSATION_ID,
          match: { memberId: CALLER, candidateId: CALLEE },
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: CALLER,
          displayName: 'Người gọi',
          avatarUrl: null,
          status: 'active',
        }),
      },
      message: { create: jest.fn(async ({ data }) => ({ id: 1, ...data })) },
    };

    emit = jest.fn();
    fetchSockets = jest.fn().mockResolvedValue([{ id: 'socket-1' }]); // mặc định: online
    config = {};

    const moduleRef = await Test.createTestingModule({
      providers: [
        CallsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ChatService, useValue: { assertParticipant: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config[key] },
        },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();

    service = moduleRef.get(CallsService);
    service.attachServer({
      to: () => ({ emit }),
      in: () => ({ fetchSockets }),
    } as never);
  });

  describe('getIceConfig', () => {
    it('luôn có STUN, và thêm TURN khi .env đủ 3 biến', () => {
      expect(service.getIceConfig().iceServers).toEqual([
        { urls: 'stun:stun.l.google.com:19302' },
      ]);

      config.TURN_URLS = 'turn:relay.example:80,turns:relay.example:443';
      config.TURN_USERNAME = 'user';
      config.TURN_CREDENTIAL = 'secret';

      expect(service.getIceConfig().iceServers).toContainEqual({
        urls: ['turn:relay.example:80', 'turns:relay.example:443'],
        username: 'user',
        credential: 'secret',
      });
    });

    it('thiếu credential thì bỏ TURN chứ không gửi cấu hình hỏng', () => {
      config.TURN_URLS = 'turn:relay.example:80';
      expect(service.getIceConfig().iceServers).toHaveLength(1);
    });
  });

  describe('invite', () => {
    it('báo bận khi một trong hai phía đang có cuộc khác (mục 9 — glare)', async () => {
      prisma.callSession.findFirst.mockResolvedValue(makeSession({ id: 99 }));

      const result = await service.invite(CALLER, {
        conversationId: CONVERSATION_ID,
        calleeId: CALLEE,
        sdp: { type: 'offer', sdp: 'v=0' },
      });

      expect(result).toMatchObject({ blocked: CallStatus.busy });
      expect(prisma.callSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: CallStatus.busy }),
        }),
      );
      expect(emit).not.toHaveBeenCalledWith('call:incoming', expect.anything());
    });

    it('không cho gọi người đang offline (đề xuất 13.2)', async () => {
      fetchSockets.mockResolvedValue([]);

      const result = await service.invite(CALLER, {
        conversationId: CONVERSATION_ID,
        calleeId: CALLEE,
        sdp: { type: 'offer', sdp: 'v=0' },
      });

      expect(result).toMatchObject({ blocked: CallStatus.unavailable });
    });

    it('chặn khi calleeId không phải đối tác của hội thoại', async () => {
      await expect(
        service.invite(CALLER, {
          conversationId: CONVERSATION_ID,
          calleeId: 999,
          sdp: { type: 'offer', sdp: 'v=0' },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('đổ chuông rồi hết 45 giây thì thành cuộc gọi nhỡ + tin nhắn hệ thống (BR-25)', async () => {
      jest.useFakeTimers();
      try {
        await service.invite(CALLER, {
          conversationId: CONVERSATION_ID,
          calleeId: CALLEE,
          sdp: { type: 'offer', sdp: 'v=0' },
        });
        expect(emit).toHaveBeenCalledWith('call:incoming', expect.anything());

        jest.advanceTimersByTime(RING_TIMEOUT_MS);
        await jest.runAllTicks();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(prisma.callSession.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: CallStatus.missed,
              durationSec: 0,
            }),
          }),
        );
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('accept', () => {
    it('chỉ người nhận mới bắt máy được', async () => {
      await expect(
        service.accept(CALLER, {
          callId: 100,
          sdp: { type: 'answer', sdp: 'v=0' },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('đặt startedAt lúc kết nối, không phải lúc bấm gọi (mục 5)', async () => {
      await service.accept(CALLEE, {
        callId: 100,
        sdp: { type: 'answer', sdp: 'v=0' },
      });

      expect(prisma.callSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CallStatus.connected,
            startedAt: expect.any(Date),
          }),
        }),
      );
      expect(emit).toHaveBeenCalledWith(
        'call:accepted',
        expect.objectContaining({ callId: 100 }),
      );
    });
  });

  describe('end', () => {
    it('tính thời lượng từ startedAt và sinh tin nhắn hệ thống (BR-24/25)', async () => {
      const startedAt = new Date(Date.now() - 65_000);
      prisma.callSession.findUnique.mockResolvedValue(
        makeSession({ status: CallStatus.connected, startedAt }),
      );

      await service.end(CALLER, 100);

      const update = prisma.callSession.update.mock.calls[0][0] as {
        data: { status: CallStatus; durationSec: number };
      };
      expect(update.data.status).toBe(CallStatus.ended);
      expect(update.data.durationSec).toBeGreaterThanOrEqual(64);
      expect(update.data.durationSec).toBeLessThanOrEqual(66);

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: MessageType.call }),
        }),
      );
    });

    it('tin nhắn hệ thống của cuộc gọi video ghi đúng loại', async () => {
      prisma.callSession.findUnique.mockResolvedValue(
        makeSession({
          kind: CallKind.video,
          status: CallStatus.connected,
          startedAt: new Date(Date.now() - 5_000),
        }),
      );

      await service.end(CALLER, 100);

      const message = prisma.message.create.mock.calls[0][0] as {
        data: { content: string; payload: { kind: CallKind } };
      };
      expect(message.data.content).toContain('video');
      expect(message.data.payload.kind).toBe(CallKind.video);
    });

    it('cúp máy hai lần không ghi đè trạng thái đã chốt', async () => {
      prisma.callSession.findUnique.mockResolvedValue(
        makeSession({ status: CallStatus.ended, endedAt: new Date() }),
      );

      await service.end(CALLER, 100);

      expect(prisma.callSession.update).not.toHaveBeenCalled();
    });
  });

  describe('relayIce', () => {
    it('chỉ chuyển tiếp cho phía bên kia của đúng cuộc gọi đó', async () => {
      await service.relayIce(CALLER, {
        callId: 100,
        candidate: { candidate: 'a' },
      });
      expect(emit).toHaveBeenCalledWith(
        'call:ice-candidate',
        expect.objectContaining({ callId: 100 }),
      );

      emit.mockClear();
      await expect(
        service.relayIce(999, { callId: 100, candidate: { candidate: 'a' } }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('relayMediaState', () => {
    it('chuyển tiếp trạng thái camera cho phía bên kia (mục 4.2 video)', async () => {
      prisma.callSession.findUnique.mockResolvedValue(
        makeSession({
          kind: CallKind.video,
          status: CallStatus.connected,
          startedAt: new Date(),
        }),
      );

      await service.relayMediaState(CALLER, {
        callId: 100,
        audio: true,
        video: false,
      });

      expect(emit).toHaveBeenCalledWith('call:media-state', {
        callId: 100,
        audio: true,
        video: false,
      });
    });

    it('người ngoài cuộc gọi không bơm được trạng thái vào cuộc của người khác', async () => {
      await expect(
        service.relayMediaState(999, { callId: 100, audio: true, video: true }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(emit).not.toHaveBeenCalled();
    });

    it('cuộc gọi đã kết thúc thì im lặng bỏ qua', async () => {
      prisma.callSession.findUnique.mockResolvedValue(
        makeSession({ status: CallStatus.ended }),
      );

      await service.relayMediaState(CALLER, {
        callId: 100,
        audio: true,
        video: false,
      });

      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('handleUserDisconnect', () => {
    it('còn tab khác đang mở thì không kết thúc cuộc gọi', async () => {
      await service.handleUserDisconnect(CALLER);
      expect(prisma.callSession.findMany).not.toHaveBeenCalled();
    });

    it('mất hết socket thì kết thúc cuộc gọi đang mở (mục 9 — đóng tab)', async () => {
      fetchSockets.mockResolvedValue([]);
      prisma.callSession.findMany.mockResolvedValue([
        { id: 100, status: CallStatus.connected, callerId: CALLER },
      ]);
      prisma.callSession.findUnique.mockResolvedValue(
        makeSession({ status: CallStatus.connected, startedAt: new Date() }),
      );

      await service.handleUserDisconnect(CALLER);

      expect(prisma.callSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CallStatus.ended,
            endReason: 'disconnect',
          }),
        }),
      );
    });
  });
});
