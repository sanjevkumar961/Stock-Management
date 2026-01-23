export const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;
// export const BASE_URL = "https://script.google.com/macros/s/AKfycbwdNbwky05HR_Oo1i5VNXA/exec";

if (!BASE_URL) {
  throw new Error('REACT_APP_BACKEND_BASE_URL is not defined');
}

/* ===========================
   GET requests
=========================== */
export async function apiGet(op, user, logout, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set('op', op);
  url.searchParams.set('user_email', user.email);
  url.searchParams.set('id_token', user.token);

  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );

  const res = await fetch(url);
  const data = await res.json();

  if (data.error === 'auth_required' || data.error === 'session_expired') {
    logout();
  }

  return data;
}

/* ===========================
   POST requests
=========================== */
export async function apiPost(action, payload, user, logout) {
  const url = new URL(BASE_URL);

  url.searchParams.set('user_email', user.email);
  url.searchParams.set('id_token', user.token);

  const res = await fetch(url.toString(), {
    method: 'POST',
    body: JSON.stringify({
      data: {
        action,
        ...payload
      }
    })
  });

  const data = await res.json();

  if (data.error === 'auth_required' || data.error === 'session_expired') {
    logout();
  }

  return data;
}
