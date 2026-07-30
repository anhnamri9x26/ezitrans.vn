import { prisma } from '../prisma';

export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  try {
    const securityIpRule = (prisma as any).securityIpRule;

    if (!securityIpRule?.findFirst) {
      console.warn('Prisma Client is missing securityIpRule delegate. Run `npx prisma generate` and restart `npm run dev`. Failing open for IP guard.');
      return false;
    }

    // Check if there is an active block rule for this IP
    const blockRule = await securityIpRule.findFirst({
      where: {
        ip: ipAddress,
        type: 'block',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (blockRule) {
      // Allow list overrides block list
      const allowRule = await securityIpRule.findFirst({
        where: {
          ip: ipAddress,
          type: 'allow',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });
      return !allowRule;
    }

    return false;
  } catch (error) {
    console.error('Failed to check IP block status:', error);
    // Fail open in case of DB error so we don't lock everyone out
    return false;
  }
}

export async function blockIp(ipAddress: string, reason: string, durationMinutes?: number) {
  try {
    let expiresAt: Date | null = null;
    if (durationMinutes) {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
    }

    await prisma.securityIpRule.create({
      data: {
        ip: ipAddress,
        type: 'block',
        reason,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Failed to block IP:', error);
  }
}

export async function allowIp(ipAddress: string, reason: string) {
  try {
    await prisma.securityIpRule.create({
      data: {
        ip: ipAddress,
        type: 'allow',
        reason,
        expiresAt: null
      }
    });
  } catch (error) {
    console.error('Failed to allow IP:', error);
  }
}

export async function unblockIp(ipAddress: string) {
  try {
    await prisma.securityIpRule.deleteMany({
      where: {
        ip: ipAddress,
        type: 'block'
      }
    });
  } catch (error) {
    console.error('Failed to unblock IP:', error);
  }
}
