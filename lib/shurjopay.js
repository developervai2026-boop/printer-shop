const BASE = process.env.SP_BASE_URL;

export async function getToken() {
  const r = await fetch(`${BASE}/get_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username: process.env.SP_USERNAME, password: process.env.SP_PASSWORD }),
  });
  const j = await r.json();
  if (!j.token) throw new Error('shurjoPay token পাওয়া যায়নি');
  return j;
}

export async function createPayment({ jobId, amount, ip }) {
  const t = await getToken();
  const site = process.env.SITE_URL;
  const r = await fetch(`${BASE}/secret-pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `${t.token_type || 'Bearer'} ${t.token}` },
    body: JSON.stringify({
      prefix: process.env.SP_PREFIX,
      token: t.token,
      store_id: t.store_id,
      return_url: `${site}/api/payment/return`,
      cancel_url: `${site}/api/payment/return`,
      amount,
      order_id: jobId,
      currency: 'BDT',
      customer_name: 'Print Customer',
      customer_address: 'Bangladesh',
      customer_phone: '01700000000',
      customer_city: 'Dhaka',
      customer_post_code: '1200',
      client_ip: ip || '127.0.0.1',
    }),
  });
  const j = await r.json();
  if (!j.checkout_url) throw new Error('checkout_url পাওয়া যায়নি');
  return j.checkout_url;
}

export async function verifyPayment(spOrderId) {
  const t = await getToken();
  const r = await fetch(`${BASE}/verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `${t.token_type || 'Bearer'} ${t.token}` },
    body: JSON.stringify({ order_id: spOrderId }),
  });
  const j = await r.json();
  return Array.isArray(j) ? j[0] : j;
}
