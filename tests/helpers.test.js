import { describe, it, expect } from 'vitest';
import { getPage, getToday } from '../src/utils/helpers';
import { validateCabin } from '../src/services/apiCabins';

describe('Property calendar and URL pagination', () => {
  it('uses Karachi midnight rather than browser timezone', () => {
    expect(getToday(new Date('2026-11-07T20:01:00Z'))).toBe('2026-11-08');
    expect(getToday(new Date('2026-11-07T18:59:00Z'))).toBe('2026-11-07');
  });
  it('rejects malformed page values', () => {
    for (const value of ['-1', 'abc', '0', '1.5', 'Infinity', null]) expect(getPage(value)).toBe(1);
    expect(getPage('3')).toBe(3);
  });
});

describe('Cabin business validation', () => {
  const cabin = { name: 'Cedar', max_capacity: 2, regular_price: 200, discount: 20 };
  it('accepts a valid cabin', () => expect(() => validateCabin(cabin)).not.toThrow());
  it('rejects a discount that makes the nightly price zero', () => {
    expect(() => validateCabin({ ...cabin, discount: 200 })).toThrow('Discount');
  });
  it('rejects fractional capacity and invalid prices', () => {
    expect(() => validateCabin({ ...cabin, max_capacity: 2.5 })).toThrow('Capacity');
    expect(() => validateCabin({ ...cabin, regular_price: NaN })).toThrow('Price');
  });
});
