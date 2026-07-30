export async function callUpdateAgent(path: string, body?: any, method: 'GET' | 'POST' = 'POST') {
  const baseUrl = process.env.UPDATE_AGENT_URL;
  const token = process.env.UPDATE_AGENT_TOKEN;
  if (!baseUrl || !token) {
    return {
      success: true,
      simulated: true,
      configured: false,
      message: 'Update agent is not configured. Simulated operation completed.',
    };
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: method === 'GET' ? undefined : JSON.stringify(body || {}),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  return { ...payload, configured: true, httpStatus: response.status };
}

export async function getUpdateAgentDiagnostics() {
  const baseUrl = process.env.UPDATE_AGENT_URL;
  const token = process.env.UPDATE_AGENT_TOKEN;
  if (!baseUrl || !token) {
    return { configured: false, reachable: false, diagnostics: null, lastError: null };
  }

  try {
    const diagnostics = await callUpdateAgent('/diagnostics', undefined, 'GET');
    return {
      configured: true,
      reachable: Boolean(diagnostics.success),
      diagnostics,
      lastError: diagnostics.success ? null : diagnostics.error || 'Update agent diagnostics failed.',
    };
  } catch (error: any) {
    return {
      configured: true,
      reachable: false,
      diagnostics: null,
      lastError: error.message || 'Could not reach update agent.',
    };
  }
}

export async function requestCoreRollback(input: { rollbackTag: string; jobId: string }) {
  return callUpdateAgent('/core/rollback', input, 'POST');
}
