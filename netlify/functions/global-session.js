const { getKV, setKV, deleteKV } = require('./_sheets');

const KEY = 'global-session';

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const raw = await getKV(KEY);
      const session = raw ? JSON.parse(raw) : null;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      await setKV(KEY, JSON.stringify({
        username: body.username,
        sessionId: body.sessionId,
        updatedAt: Date.now(),
      }));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const raw = await getKV(KEY);
      const session = raw ? JSON.parse(raw) : null;
      // 본인 세션일 때만 해제 (다른 사람이 이미 새 세션을 잡았다면 건드리지 않음)
      if (session && session.sessionId === body.sessionId) {
        await deleteKV(KEY);
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
