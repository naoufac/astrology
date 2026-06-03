// public/app.js
const form    = document.getElementById('form');
const signEl  = document.getElementById('sign');
const dateEl  = document.getElementById('date');
const statusEl= document.getElementById('status');
const resultEl= document.getElementById('result');
const titleEl = document.getElementById('result-title');
const readEl  = document.getElementById('reading');
const posBody = document.querySelector('#positions tbody');
const aspBody = document.querySelector('#aspects tbody');

// Default date = today (UTC)
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}
dateEl.value = todayUtc();

const SIGN_LABEL = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn',
  aquarius: 'Aquarius', pisces: 'Pisces'
};
const BODY_LABEL = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn'
};

function setStatus(msg, isError = false) {
  statusEl.hidden = false;
  statusEl.textContent = msg;
  statusEl.className = 'status ' + (isError ? 'err' : 'ok');
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.textContent = '';
}

function render(result) {
  titleEl.textContent = `${SIGN_LABEL[result.sign] || result.sign} · ${result.date}`;
  readEl.innerHTML = '';
  for (const s of result.reading) {
    const li = document.createElement('li');
    li.textContent = s.text;
    const meta = document.createElement('span');
    meta.className = 'cites';
    meta.textContent = 'cited: ' + s.cites.join(', ');
    li.appendChild(meta);
    readEl.appendChild(li);
  }
  posBody.innerHTML = '';
  for (const [body, sign] of Object.entries(result.data)) {
    const tr = document.createElement('tr');
    const t1 = document.createElement('td'); t1.textContent = BODY_LABEL[body] || body;
    const t2 = document.createElement('td'); t2.textContent = SIGN_LABEL[sign] || sign;
    tr.append(t1, t2); posBody.appendChild(tr);
  }
  aspBody.innerHTML = '';
  if (result.aspects.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3; td.textContent = 'No major aspects within 6°.';
    tr.appendChild(td); aspBody.appendChild(tr);
  } else {
    for (const a of result.aspects) {
      const tr = document.createElement('tr');
      const t1 = document.createElement('td'); t1.textContent = a.a;
      const t2 = document.createElement('td'); t2.textContent = a.type;
      const t3 = document.createElement('td'); t3.textContent = a.orb.toFixed(2);
      tr.append(t1, t2, t3); aspBody.appendChild(tr);
    }
  }
  resultEl.hidden = false;
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  clearStatus();
  const sign = signEl.value;
  const date = dateEl.value;
  if (!sign || !date) return;
  setStatus('reading the stars…');
  try {
    const url = `/api/horoscope?sign=${encodeURIComponent(sign)}&date=${encodeURIComponent(date)}`;
    const r = await fetch(url);
    if (!r.ok) {
      const body = await r.json().catch(() => ({ error: r.statusText }));
      setStatus('error: ' + (body.error || r.statusText), true);
      return;
    }
    const data = await r.json();
    render(data);
    clearStatus();
  } catch (err) {
    setStatus('error: ' + err.message, true);
  }
});
