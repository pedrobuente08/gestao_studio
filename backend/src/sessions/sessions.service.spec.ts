import { Test } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, TransactionType, TransactionCategory } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    // Intercepta $transaction interativa e executa a função com o mock como cliente
    (prisma.$transaction as jest.Mock).mockImplementation((fn: any) => {
      if (typeof fn === 'function') return fn(prisma);
      return Promise.all(fn);
    });

    const module = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SessionsService);
  });

  // ─── Conversão de preço ─────────────────────────────────────────────────────

  describe('conversão de preço (R$ → centavos)', () => {
    it('converte R$ 150,00 para 15000 centavos', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 150,
        date: '2025-01-15',
      });

      expect(prisma.tattooSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ finalPrice: 15000 }),
        }),
      );
    });

    it('arredonda corretamente valores com centavos (R$ 99,99 → 9999)', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 99.99,
        date: '2025-01-15',
      });

      expect(prisma.tattooSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ finalPrice: 9999 }),
        }),
      );
    });
  });

  // ─── Cálculo de split ────────────────────────────────────────────────────────

  describe('cálculo de split (guest location)', () => {
    it('sem guest location: studioFee e tatuadorRevenue são null', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 200,
        date: '2025-01-15',
        // sem guestLocationId
      });

      expect(prisma.tattooSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studioFee: null,
            tatuadorRevenue: null,
          }),
        }),
      );
    });

    it('com 30% para o studio: studioFee=3000, tatuadorRevenue=7000 (sobre R$100)', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 100,
        date: '2025-01-15',
        guestLocationId: 'loc-1',
        studioPercentage: 30,
      });

      expect(prisma.tattooSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studioFee: 3000,
            tatuadorRevenue: 7000,
          }),
        }),
      );
    });

    it('split 40% sobre R$ 150: studioFee=6000, tatuadorRevenue=9000', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 150,
        date: '2025-01-15',
        guestLocationId: 'loc-1',
        studioPercentage: 40,
      });

      expect(prisma.tattooSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studioFee: 6000,
            tatuadorRevenue: 9000,
          }),
        }),
      );
    });

    it('arredondamento no split: 33% de R$ 100,01 sem perder centavo', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 100.01, // 10001 centavos
        date: '2025-01-15',
        guestLocationId: 'loc-1',
        studioPercentage: 33,
      });

      const callData = (prisma.tattooSession.create as jest.Mock).mock.calls[0][0].data;

      // studioFee + tatuadorRevenue deve somar exatamente o preço total
      expect(callData.studioFee + callData.tatuadorRevenue).toBe(10001);
    });

    it('guestLocationId sem studioPercentage: não calcula split', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 100,
        date: '2025-01-15',
        guestLocationId: 'loc-1',
        // studioPercentage ausente
      });

      expect(prisma.tattooSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studioFee: null,
            tatuadorRevenue: null,
          }),
        }),
      );
    });
  });

  // ─── Atomicidade ─────────────────────────────────────────────────────────────

  describe('atomicidade (sessão + transação financeira)', () => {
    it('usa $transaction — garante que sessão e lançamento são criados juntos', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 100,
        date: '2025-01-15',
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('lançamento financeiro recebe o mesmo valor da sessão', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockResolvedValue({} as any);

      await service.create('tenant-1', {
        clientId: 'client-1',
        userId: 'user-1',
        finalPrice: 250,
        date: '2025-01-15',
      });

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 25000,
            type: TransactionType.INCOME,
            category: TransactionCategory.TATTOO,
          }),
        }),
      );
    });

    it('se transaction.create falhar, lança erro (rollback esperado pelo $transaction)', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);
      prisma.tattooSession.create.mockResolvedValue({ id: 'sess-1' } as any);
      prisma.transaction.create.mockRejectedValue(new Error('DB constraint violated'));

      await expect(
        service.create('tenant-1', {
          clientId: 'client-1',
          userId: 'user-1',
          finalPrice: 100,
          date: '2025-01-15',
        }),
      ).rejects.toThrow('DB constraint violated');
    });
  });

  // ─── Validação ───────────────────────────────────────────────────────────────

  describe('validações', () => {
    it('lança BadRequestException se userId não for fornecido', async () => {
      prisma.serviceType.findUnique.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', {
          clientId: 'client-1',
          userId: '',
          finalPrice: 100,
          date: '2025-01-15',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se tipo Tatuagem vier sem size/complexity/bodyLocation', async () => {
      prisma.serviceType.findUnique.mockResolvedValue({
        id: 'st-1',
        name: 'Tatuagem',
      } as any);

      await expect(
        service.create('tenant-1', {
          clientId: 'client-1',
          userId: 'user-1',
          serviceTypeId: 'st-1',
          finalPrice: 100,
          date: '2025-01-15',
          // sem size, complexity, bodyLocation
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
