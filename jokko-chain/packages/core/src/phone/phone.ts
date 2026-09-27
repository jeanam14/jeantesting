/**
 * Phone numbers: parsing, E.164 normalisation, supported countries and masking.
 *
 * Phone numbers are the user's login and the key for send-by-phone, so they are always stored
 * in E.164 (`+221771234567`). Parsing uses `libphonenumber-js` (Google's numbering metadata)
 * rather than hand-written regexes, because numbering plans change.
 */
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
import { JokkoCoreError } from '../errors.js';

/** UEMOA member states (XOF). */
export const UEMOA_COUNTRIES = ['SN', 'CI', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GW'] as const;
/** CEMAC member states (XAF). */
export const CEMAC_COUNTRIES = ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'] as const;

/** Result of parsing a phone number. */
export interface ParsedPhoneNumber {
  /** E.164 form, e.g. `+221771234567`. The only form stored or sent to providers. */
  readonly e164: string;
  /** ISO 3166-1 alpha-2 country of the number. */
  readonly country: string;
  /** International display form, e.g. `+221 77 123 45 67`. */
  readonly international: string;
}

/**
 * Parses user input into a validated phone number.
 *
 * @param input - What the user typed, with or without `+` and spaces.
 * @param defaultCountry - Country chosen in the picker, used when there is no `+` prefix.
 * @param allowedCountries - Countries currently allowed to sign up / receive (server config).
 */
export function parsePhoneNumber(
  input: string,
  defaultCountry: string,
  allowedCountries: readonly string[],
): ParsedPhoneNumber {
  const parsed = parsePhoneNumberFromString(input, defaultCountry as CountryCode);
  if (!parsed?.isValid()) {
    throw new JokkoCoreError('INVALID_PHONE_NUMBER', 'not a valid phone number');
  }
  const country = parsed.country;
  if (country === undefined || !allowedCountries.includes(country)) {
    throw new JokkoCoreError('UNSUPPORTED_COUNTRY', `country not supported: ${country ?? '?'}`);
  }
  return {
    e164: parsed.number,
    country,
    international: parsed.formatInternational(),
  };
}

/**
 * Masks a phone number for display to other users and in admin views with masking on:
 * keeps the country code and the last two digits (`+221 •• ••• •• 67`).
 */
export function maskPhoneNumber(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed) return '••••';
  const national = parsed.nationalNumber;
  const lastTwo = national.slice(-2);
  const hidden = '•'.repeat(Math.max(national.length - 2, 0)).replace(/(.{2})(?=.)/g, '$1 ');
  return `+${parsed.countryCallingCode} ${hidden} ${lastTwo}`;
}
