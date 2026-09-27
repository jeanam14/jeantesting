/**
 * Injectable clock. Business rules that depend on time (quote expiry, 48h invite refunds,
 * referral hold periods) read the time from here, so tests can control it precisely.
 */
export interface Clock {
  /** Current time. */
  now(): Date;
}

/** Real wall-clock time. */
export const systemClock: Clock = { now: () => new Date() };

/** A clock tests can move forward. */
export class FixedClock implements Clock {
  /** @param current - Initial time. */
  constructor(private current: Date) {}

  /** Returns the current fixed time. */
  now(): Date {
    return new Date(this.current.getTime());
  }

  /** Moves time forward by `ms` milliseconds. */
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }

  /** Sets the time. */
  set(date: Date): void {
    this.current = new Date(date.getTime());
  }
}
