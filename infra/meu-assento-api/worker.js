const ALLOWED_ORIGIN = 'https://danielnrodrigues-git.github.io';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      if (origin && origin !== ALLOWED_ORIGIN) {
        return jsonResponse({ ok: false, error: 'Origem não permitida.' }, 403, ALLOWED_ORIGIN);
      }
      return new Response(null, { status: 204, headers: corsHeaders(ALLOWED_ORIGIN) });
    }

    if (request.method === 'GET') {
      return jsonResponse({ ok: true, service: 'Meu Assento API', version: 'V5.0.0' }, 200, ALLOWED_ORIGIN);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'Método HTTP não permitido.' }, 405, ALLOWED_ORIGIN);
    }

    if (origin !== ALLOWED_ORIGIN) {
      return jsonResponse({ ok: false, error: 'Origem não permitida.' }, 403, ALLOWED_ORIGIN);
    }

    if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET) {
      return jsonResponse({ ok: false, error: 'API não configurada no servidor.' }, 500, ALLOWED_ORIGIN);
    }

    let clientPayload;
    try {
      clientPayload = await request.json();
    } catch (err) {
      return jsonResponse({ ok: false, error: 'JSON inválido.' }, 400, ALLOWED_ORIGIN);
    }

    if (!clientPayload || typeof clientPayload.method !== 'string' || !Array.isArray(clientPayload.args)) {
      return jsonResponse({ ok: false, error: 'Requisição inválida.' }, 400, ALLOWED_ORIGIN);
    }

    const upstreamPayload = {
      method: clientPayload.method,
      args: clientPayload.args,
      apiSecret: env.APPS_SCRIPT_SECRET
    };

    try {
      const upstream = await fetch(env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(upstreamPayload),
        redirect: 'follow'
      });

      const text = await upstream.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        return jsonResponse({ ok: false, error: 'Resposta inválida do Apps Script.', detail: text.slice(0, 300) }, 502, ALLOWED_ORIGIN);
      }

      return jsonResponse(parsed, upstream.ok ? 200 : 502, ALLOWED_ORIGIN);
    } catch (err) {
      return jsonResponse({ ok: false, error: 'Falha ao acessar o Apps Script: ' + (err && err.message ? err.message : String(err)) }, 502, ALLOWED_ORIGIN);
    }
  }
};
