// UNIT TESTS for src/utils/validation.ts (pure logic, no UI, no network).
import {
  phoneSchema,
  emailSchema,
  otpSchema,
  epicIdSchema,
  getMinAgeForElectionType,
  aspirantSchema,
} from '../utils/validation';

describe('phoneSchema (Indian mobile: 10 digits, starts 6-9)', () => {
  it.each(['9876543210', '6000000000', '7123456789'])(
    'accepts valid number %s',
    async (value) => {
      expect(await phoneSchema.isValid(value)).toBe(true);
    }
  );

  it.each(['1234567890', '98765', '98765432101', 'abcdefghij', ''])(
    'rejects invalid number %s',
    async (value) => {
      expect(await phoneSchema.isValid(value)).toBe(false);
    }
  );
});

describe('emailSchema', () => {
  it('accepts a valid email', async () => {
    expect(await emailSchema.isValid('user@example.com')).toBe(true);
  });
  it.each(['not-an-email', ''])('rejects %s', async (value) => {
    expect(await emailSchema.isValid(value)).toBe(false);
  });
});

describe('otpSchema (6 digits)', () => {
  it('accepts a 6-digit OTP', async () => {
    expect(await otpSchema.isValid('123456')).toBe(true);
  });
  it.each(['12345', '1234567', 'abcdef'])('rejects %s', async (value) => {
    expect(await otpSchema.isValid(value)).toBe(false);
  });
});

describe('epicIdSchema (3 letters + 7 digits)', () => {
  it('accepts a valid EPIC id', async () => {
    expect(await epicIdSchema.isValid('ABC1234567')).toBe(true);
  });
  it.each(['AB1234567', 'ABCD123456', 'ABC123456', 'abc1234567'])(
    'rejects %s',
    async (value) => {
      expect(await epicIdSchema.isValid(value)).toBe(false);
    }
  );
});

describe('getMinAgeForElectionType', () => {
  it('returns 25 for lok_sabha / state_assembly', () => {
    expect(getMinAgeForElectionType('lok_sabha')).toBe(25);
    expect(getMinAgeForElectionType('state_assembly')).toBe(25);
  });
  it('returns 21 for municipal / panchayat', () => {
    expect(getMinAgeForElectionType('municipal_corporation')).toBe(21);
    expect(getMinAgeForElectionType('gram_panchayat')).toBe(21);
  });
  it('defaults to 21 for an unknown type', () => {
    expect(getMinAgeForElectionType('unknown')).toBe(21);
  });
});

describe('aspirantSchema', () => {
  const validBase = {
    name: 'Jane Doe',
    manifesto: 'My plan for the ward',
    electionId: 1,
    constituencyId: 2,
    age: 30,
  };

  it('accepts a valid aspirant with only required fields', async () => {
    expect(await aspirantSchema.isValid(validBase)).toBe(true);
  });

  it('rejects when name is missing', async () => {
    const { name, ...withoutName } = validBase;
    expect(await aspirantSchema.isValid(withoutName)).toBe(false);
  });

  it('rejects a non-instagram URL in instagramLink', async () => {
    expect(
      await aspirantSchema.isValid({ ...validBase, instagramLink: 'https://example.com/jane' })
    ).toBe(false);
  });

  it('accepts a valid instagram URL', async () => {
    expect(
      await aspirantSchema.isValid({ ...validBase, instagramLink: 'https://instagram.com/jane' })
    ).toBe(true);
  });

  it('treats empty optional links as valid', async () => {
    expect(
      await aspirantSchema.isValid({ ...validBase, instagramLink: '', twitterLink: '' })
    ).toBe(true);
  });
});
