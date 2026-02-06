import { describe, expect, it } from 'vitest';
import { getWaterBodyCategory, isPoolType } from '@/lib/waterBodyUtils';
import { WaterBodyCategory } from '@/types/enums';

describe('waterBodyUtils', () => {
  it('treats pool variants as pool types', () => {
    expect(isPoolType('pool')).toBe(true);
    expect(isPoolType('pool_chlorine')).toBe(true);
    expect(isPoolType('pool_saltwater')).toBe(true);
    expect(isPoolType('spa')).toBe(true);
    expect(isPoolType('hot_tub')).toBe(true);
    expect(isPoolType('freshwater')).toBe(false);
  });

  it('maps pool variants to pool category', () => {
    expect(getWaterBodyCategory('pool')).toBe(WaterBodyCategory.POOL);
    expect(getWaterBodyCategory('pool_chlorine')).toBe(WaterBodyCategory.POOL);
    expect(getWaterBodyCategory('pool_saltwater')).toBe(WaterBodyCategory.POOL);
    expect(getWaterBodyCategory('spa')).toBe(WaterBodyCategory.SPA);
    expect(getWaterBodyCategory('reef')).toBe(WaterBodyCategory.AQUARIUM);
  });
});
