interface LoginAttempt {
  count: number;
  lockedUntil: Date | null;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Run clean-up periodically to avoid memory leaks
if (typeof global !== 'undefined') {
  const intervalId = setInterval(() => {
    const now = new Date();
    for (const [ip, attempt] of loginAttempts.entries()) {
      if (attempt.lockedUntil && attempt.lockedUntil < now) {
        loginAttempts.delete(ip);
      } else if (!attempt.lockedUntil) {
        // Remove stale records that aren't locked to free memory
        loginAttempts.delete(ip);
      }
    }
  }, 1000 * 60 * 60); // hourly

  // Don't keep the event loop alive just for this timer in Node.js
  if (intervalId.unref) {
    intervalId.unref();
  }
}

/**
 * Checks if an IP address is currently locked out of logging in.
 */
export function isIpLocked(ip: string): { locked: boolean; remainingMinutes: number } {
  const attempt = loginAttempts.get(ip);
  if (!attempt || !attempt.lockedUntil) {
    return { locked: false, remainingMinutes: 0 };
  }

  const now = new Date();
  if (attempt.lockedUntil > now) {
    const diff = attempt.lockedUntil.getTime() - now.getTime();
    return { locked: true, remainingMinutes: Math.ceil(diff / (1000 * 60)) };
  }

  // Lock expired, reset
  loginAttempts.delete(ip);
  return { locked: false, remainingMinutes: 0 };
}

/**
 * Records a failed login attempt for an IP.
 * Locks the IP if thresholds are exceeded (5 attempts -> 15 min lock, 10 attempts -> 1 hour lock).
 */
export function recordFailedAttempt(ip: string): { locked: boolean; remainingMinutes: number } {
  let attempt = loginAttempts.get(ip);
  if (!attempt) {
    attempt = { count: 0, lockedUntil: null };
    loginAttempts.set(ip, attempt);
  }

  attempt.count += 1;
  const now = new Date();

  if (attempt.count >= 10) {
    attempt.lockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour lockout
    return { locked: true, remainingMinutes: 60 };
  } else if (attempt.count >= 5) {
    attempt.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes lockout
    return { locked: true, remainingMinutes: 15 };
  }

  return { locked: false, remainingMinutes: 0 };
}

/**
 * Clears failed attempts on successful login.
 */
export function resetAttempts(ip: string): void {
  loginAttempts.delete(ip);
}
