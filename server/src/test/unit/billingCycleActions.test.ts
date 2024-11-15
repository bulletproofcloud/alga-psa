// server/src/test/actions/billingCycleActions.test.ts

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { getBillingCycle, updateBillingCycle, getAllBillingCycles } from '../../lib/actions/billingCycleActions';
import { getServerSession } from "next-auth/next";
import { Knex } from 'knex';
import { createTenantKnex } from '../../lib/db';

// Mock next-auth
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

// Mock the db/db module
vi.mock('../../lib/db/db', () => {
  return {
    getConnection: vi.fn(),
  };
});

// Create mock knex instance factory
function createMockKnex(): Knex {
  const mockKnex = vi.fn(() => mockKnex) as unknown as Knex;
  
  // Add query builder methods
  (mockKnex as any).where = vi.fn().mockReturnThis();
  (mockKnex as any).first = vi.fn();
  (mockKnex as any).insert = vi.fn().mockReturnThis();
  (mockKnex as any).onConflict = vi.fn().mockReturnThis();
  (mockKnex as any).merge = vi.fn().mockReturnThis();
  (mockKnex as any).select = vi.fn();

  return mockKnex;
}

// Mock the root db module
vi.mock('../../lib/db', () => {
  const mock = vi.fn().mockImplementation(async () => {
    return { knex: createMockKnex(), tenant: 'test-tenant' };
  });
  return { createTenantKnex: mock };
});

describe('Billing Cycle Actions', () => {
  let mockCreateTenantKnex: MockedFunction<typeof createTenantKnex>;

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'test-user-id' } });
    mockCreateTenantKnex = vi.mocked(createTenantKnex);
  });

  describe('getBillingCycle', () => {
    it('should return the billing cycle for a company', async () => {
      const mockKnex = createMockKnex();
      (mockKnex as any).first.mockResolvedValue({ billing_cycle: 'monthly' });
      mockCreateTenantKnex.mockResolvedValue({ knex: mockKnex, tenant: 'test-tenant' });

      const result = await getBillingCycle('company-1');
      expect(result).toBe('monthly');
      expect((mockKnex as any).where).toHaveBeenCalledWith('company_id', 'company-1');
    });

    it('should return "monthly" if no billing cycle is set', async () => {
      const mockKnex = createMockKnex();
      (mockKnex as any).first.mockResolvedValue(null);
      mockCreateTenantKnex.mockResolvedValue({ knex: mockKnex, tenant: 'test-tenant' });

      const result = await getBillingCycle('company-2');
      expect(result).toBe('monthly');
    });

    it('should throw an error if user is not authenticated', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(getBillingCycle('company-1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateBillingCycle', () => {
    it('should update the billing cycle for a company', async () => {
      const mockKnex = createMockKnex();
      mockCreateTenantKnex.mockResolvedValue({ knex: mockKnex, tenant: 'test-tenant' });

      await updateBillingCycle('company-1', 'quarterly');

      expect((mockKnex as any).insert).toHaveBeenCalledWith({ company_id: 'company-1', billing_cycle: 'quarterly' });
      expect((mockKnex as any).onConflict).toHaveBeenCalledWith('company_id');
      expect((mockKnex as any).merge).toHaveBeenCalled();
    });

    it('should throw an error if user is not authenticated', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(updateBillingCycle('company-1', 'quarterly')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getAllBillingCycles', () => {
    it('should return all billing cycles', async () => {
      const mockKnex = createMockKnex();
      (mockKnex as any).select.mockResolvedValue([
        { company_id: 'company-1', billing_cycle: 'monthly' },
        { company_id: 'company-2', billing_cycle: 'quarterly' }
      ]);
      mockCreateTenantKnex.mockResolvedValue({ knex: mockKnex, tenant: 'test-tenant' });

      const result = await getAllBillingCycles();
      expect(result).toEqual({
        'company-1': 'monthly',
        'company-2': 'quarterly'
      });
    });

    it('should return an empty object if no billing cycles are set', async () => {
      const mockKnex = createMockKnex();
      (mockKnex as any).select.mockResolvedValue([]);
      mockCreateTenantKnex.mockResolvedValue({ knex: mockKnex, tenant: 'test-tenant' });

      const result = await getAllBillingCycles();
      expect(result).toEqual({});
    });

    it('should throw an error if user is not authenticated', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(getAllBillingCycles()).rejects.toThrow('Unauthorized');
    });
  });
});
