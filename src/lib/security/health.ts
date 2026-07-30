import { prisma } from '@/lib/prisma';

type ChecklistStatus = 'safe' | 'warning' | 'danger';

export type SecurityChecklistItem = {
  id: string;
  label: string;
  description: string;
  status: ChecklistStatus;
  points: number;
  action: string;
};

function parseSummary(summary?: string | null): any {
  if (!summary) return null;
  try {
    return JSON.parse(summary);
  } catch {
    return null;
  }
}

export async function getSecurityHealth() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [adminsTotal, adminsWith2fa, blockedIps, recentEvents, failedLogins, newIpLogins, latestScan, baselineCount] = await Promise.all([
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'ADMIN', twoFactorEnabled: true } }),
    prisma.securityIpRule.count({ where: { type: 'block' } }),
    prisma.securityEvent.count({ where: { createdAt: { gte: since24h } } }),
    prisma.securityEvent.count({ where: { type: 'login_failed', createdAt: { gte: since24h } } }),
    prisma.securityEvent.count({ where: { type: 'new_ip_login', createdAt: { gte: since24h } } }),
    prisma.securityScan.findFirst({ orderBy: { startedAt: 'desc' } }),
    prisma.fileIntegritySnapshot.count(),
  ]);

  const latestSummary = parseSummary(latestScan?.summary);
  const highRiskFindings = latestScan
    ? await prisma.securityFinding.count({ where: { scanId: latestScan.id, severity: { in: ['critical', 'high'] } } })
    : 0;

  const checklist: SecurityChecklistItem[] = [
    { id: 'firewall_active', label: 'Firewall đang hoạt động', description: 'WAF cơ bản đang chặn request SQLi/XSS/path traversal.', status: 'safe', points: 20, action: 'Tiếp tục theo dõi Security Events.' },
    { id: 'admin_2fa', label: '2FA cho tài khoản quản trị', description: adminsTotal === 0 ? 'Chưa có tài khoản admin.' : `${adminsWith2fa}/${adminsTotal} admin đã bật 2FA.`, status: adminsTotal > 0 && adminsWith2fa === adminsTotal ? 'safe' : adminsWith2fa > 0 ? 'warning' : 'danger', points: adminsTotal > 0 && adminsWith2fa === adminsTotal ? 20 : adminsWith2fa > 0 ? 10 : 0, action: 'Bật 2FA cho toàn bộ tài khoản ADMIN.' },
    { id: 'login_rate_limit', label: 'Giới hạn đăng nhập sai', description: 'Rate limit/lockout đang được áp dụng trong luồng đăng nhập.', status: 'safe', points: 15, action: 'Không cần thao tác.' },
    { id: 'scanner_health', label: 'Không có cảnh báo file nguy hiểm', description: latestScan ? `Scan mới nhất có ${highRiskFindings} cảnh báo high/critical.` : 'Chưa có lần quét nào.', status: !latestScan ? 'warning' : highRiskFindings === 0 ? 'safe' : 'danger', points: !latestScan ? 5 : highRiskFindings === 0 ? 15 : 0, action: !latestScan ? 'Chạy scanner lần đầu.' : highRiskFindings === 0 ? 'Không cần thao tác.' : 'Kiểm tra và xử lý cảnh báo high/critical.' },
    { id: 'login_anomaly', label: 'Không có đăng nhập bất thường gần đây', description: `${failedLogins} đăng nhập thất bại, ${newIpLogins} đăng nhập IP mới trong 24h.`, status: failedLogins >= 10 || newIpLogins >= 3 ? 'danger' : failedLogins > 0 || newIpLogins > 0 ? 'warning' : 'safe', points: failedLogins >= 10 || newIpLogins >= 3 ? 0 : failedLogins > 0 || newIpLogins > 0 ? 5 : 10, action: 'Nếu tăng bất thường, chặn IP hoặc đổi mật khẩu admin.' },
    { id: 'ip_blocking_ready', label: 'IP Blocking sẵn sàng', description: `${blockedIps} IP đang bị chặn.`, status: 'safe', points: 10, action: 'Thêm IP thủ công nếu phát hiện tấn công.' },
    { id: 'baseline_ready', label: 'Baseline file integrity', description: `${baselineCount} file đang có baseline.`, status: baselineCount > 0 ? 'safe' : 'warning', points: baselineCount > 0 ? 10 : 0, action: 'Tạo baseline khi source hiện tại sạch.' },
  ];

  const score = Math.min(100, checklist.reduce((sum, item) => sum + item.points, 0));
  const grade = score >= 80 ? 'good' : score >= 55 ? 'warning' : 'danger';
  const recommendations = checklist.filter(item => item.status !== 'safe').map(item => item.action).filter((value, index, arr) => arr.indexOf(value) === index).slice(0, 5);

  return { score, grade, checklist, recommendations, metrics: { adminsTotal, adminsWith2fa, blockedIps, recentEvents, failedLogins, newIpLogins, highRiskFindings, baselineCount, latestScanSummary: latestSummary } };
}
