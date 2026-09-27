/**
 * Minimal, strict semantic-version comparison for app versions (`1.4.2`). Used by the
 * minimum-version gate that forces outdated apps to update (e.g. after a security fix).
 */

const SEMVER = /^(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/;

/** Parses `major.minor.patch`; returns `null` for anything else (pre-release tags included). */
export function parseSemver(value: string): [number, number, number] | null {
  const match = SEMVER.exec(value.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Returns -1, 0 or 1 like a comparator. Both inputs must be valid versions. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) throw new Error(`invalid version: ${!pa ? a : b}`);
  for (let i = 0; i < 3; i += 1) {
    const x = pa[i] as number;
    const y = pb[i] as number;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
