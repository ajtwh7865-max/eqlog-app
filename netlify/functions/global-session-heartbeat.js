const { getKV, setKV } = require('./_sheets');

const KEY = 'global-session';

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const body = JSON.parse(event.body || '{}');
    const raw = await getKV(KEY);
    const session = raw ? JSON.parse(raw) : null;

    if (!session || session.sessionId !== body.sessionId) {
      // 다른 사람이 세션을 가져갔거나 세션이 사라짐 -> 프론트엔드가 로그아웃 처리
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lost: true }),
      };
    }

    await setKV(KEY, JSON.stringify({ ...session, updatedAt: Date.now() }));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lost: false }),
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
