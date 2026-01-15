export const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

/* ===========================
   GET requests
=========================== */
export async function apiGet(op, user, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set('op', op);
  url.searchParams.set('user_email', user.email);
  url.searchParams.set('id_token', user.token);

  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );

  const res = await fetch(url);
  return res.json();
}

/* ===========================
   POST requests
=========================== */
export async function apiPost(action, data, user) {
  const url = new URL(BASE_URL);

  // ✅ token passed as query parameter
  url.searchParams.set('user_email', user.email);
  url.searchParams.set('id_token', user.token);

  const res = await fetch(url.toString(), {
    method: 'POST',
    body: JSON.stringify({
      data: {
        action,
        ...data
      }
    })
  });

  return res.json();
}
