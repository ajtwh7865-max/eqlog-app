const { getKV, setKV, deleteKV } = require('./_sheets');

exports.handler = async (event) => {
  try {
    const key = decodeURIComponent(event.path.replace(/^\/api\/kv\//, ''));
    if (!key) {
      return { statusCode: 400, body: JSON.stringify({ error: 'NO_KEY' }) };
    }

    if (event.httpMethod === 'GET') {
      const value = await getKV(key);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      };
    }

    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      await setKV(key, body.value);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      await deleteKV(key);
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
