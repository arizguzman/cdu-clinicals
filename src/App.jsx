import { useState, useEffect, useMemo } from 'react';
import { storage } from './storage.js';
import {
  Lock, Users, FileText, Download, Plus, Trash2, LogOut, Calendar,
  CheckCircle2, AlertCircle, X, Check, Eye, EyeOff, Save, ArrowLeft,
  UserPlus, GraduationCap, ClipboardList, KeyRound, Search, Sliders,
  ChevronRight, FileDown, Sparkles, Printer, History, AlertTriangle,
  TrendingUp, RefreshCw, Building, UserX, Mail
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Static config
// ──────────────────────────────────────────────────────────────────────────────
const COURSES = [
  { id: 'medsurg',    name: 'Medical Surgical',          code: 'NUR 428 / NUR 512'  },
  { id: 'geriatrics', name: 'Geriatrics / Aging Pop.',   code: 'NUR 430 / NUR 546'  },
  { id: 'ob',         name: 'OB',                        code: 'NUR 436A / NUR 513A'},
  { id: 'peds',       name: 'Pediatrics',                code: 'NUR 436B / NUR 513B'},
  { id: 'psych',      name: 'Psych Mental Health',       code: 'NUR 435 / NUR 517'  },
  { id: 'leadership', name: 'Leadership',                code: 'NUR 452 / NUR 619'  },
];

const PROGRAMS = [
  { id: 'BSN', label: 'BSN (BSN / LVN-BSN)' },
  { id: 'ELM', label: 'ELM' },
];


const DEFAULTS = {
  adminPassword:   'admin2026',
  facultyPassword: 'clinical2026',
};

const STORAGE_KEYS = {
  config:     'cwr-config',
  roster:     'cwr-roster',
  subs:       'cwr-submissions',
  accounts:   'cwr-accounts',
  facilities: 'cwr-facilities',
};

// Local-only (per-browser) storage keys — used for faculty draft & identity
const LOCAL_KEYS = {
  draft:    'cwr-faculty-draft',
  identity: 'cwr-faculty-identity',
  facility: 'cwr-faculty-facility',
  session:  'cwr-faculty-session',
};

// SHA-256 hash with an app-level pepper. Not bcrypt-strong, but better than
// plaintext. For production, migrate to Firebase Auth (see README).
async function hashPassword(password) {
  const data = new TextEncoder().encode(password + ':cwr-pilot-pepper-v1');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const normalizeEmail = (e) => (e || '').trim().toLowerCase();

const safeLocal = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

const normalizeName = (n) => (n || '').trim().toLowerCase().replace(/\s+/g, ' ');

const startOfWeek = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  x.setDate(x.getDate() + diff);
  return x;
};

const startOfMonth = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
};

const LOGO_URL = 'data:image/webp;base64,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';


const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const courseLabel = (id) => {
  const c = COURSES.find(c => c.id === id);
  return c ? `${c.name} (${c.code})` : id;
};

const programLabel = (id) => PROGRAMS.find(p => p.id === id)?.label || id;

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const fmtRelative = (iso) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// ──────────────────────────────────────────────────────────────────────────────
// Storage helpers — wrap storage in try/catch (missing keys throw)
// ──────────────────────────────────────────────────────────────────────────────
const safeGet = async (key) => {
  try {
    const res = await storage.get(key, true);
    return res?.value ? JSON.parse(res.value) : null;
  } catch { return null; }
};
const safeSet = async (key, value) => {
  try { await storage.set(key, JSON.stringify(value), true); return true; }
  catch (e) { console.error('storage set failed', key, e); return false; }
};

// ──────────────────────────────────────────────────────────────────────────────
// Root
// ──────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [booted, setBooted] = useState(false);
  const [auth, setAuth] = useState(null);            // null | 'admin' | { type: 'faculty', accountId, name, email }
  const [config, setConfig] = useState(DEFAULTS);
  const [cohorts, setCohorts] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [accounts, setAccounts] = useState([]);      // [{ id, email, passwordHash, name, createdAt, disabled }]
  const [facilities, setFacilities] = useState([]);  // [{ id, name }]
  const [toast, setToast] = useState(null);

  // Load
  useEffect(() => {
    (async () => {
      const c = await safeGet(STORAGE_KEYS.config);
      if (c) setConfig({ ...DEFAULTS, ...c });
      const r = await safeGet(STORAGE_KEYS.roster);
      if (r) { setCohorts(r.cohorts || []); setStudents(r.students || []); }
      const s = await safeGet(STORAGE_KEYS.subs);
      if (s) setSubmissions(s);
      const a = await safeGet(STORAGE_KEYS.accounts);
      if (a) setAccounts(a);
      const f = await safeGet(STORAGE_KEYS.facilities);
      if (f) setFacilities(f);

      // Try to restore faculty session from localStorage
      const sessionId = safeLocal.get(LOCAL_KEYS.session);
      if (sessionId && a) {
        const acc = a.find(x => x.id === sessionId && !x.disabled);
        if (acc) setAuth({ type: 'faculty', accountId: acc.id, name: acc.name, email: acc.email });
      }
      setBooted(true);
    })();
  }, []);

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind, id: uid() });
    setTimeout(() => setToast(null), 2800);
  };

  const persistConfig     = async (next) => { setConfig(next); await safeSet(STORAGE_KEYS.config, next); };
  const persistRoster     = async (cs, st) => { setCohorts(cs); setStudents(st); await safeSet(STORAGE_KEYS.roster, { cohorts: cs, students: st }); };
  const persistSubs       = async (next) => { setSubmissions(next); await safeSet(STORAGE_KEYS.subs, next); };
  const persistAccounts   = async (next) => { setAccounts(next); await safeSet(STORAGE_KEYS.accounts, next); };
  const persistFacilities = async (next) => { setFacilities(next); await safeSet(STORAGE_KEYS.facilities, next); };

  const signInFaculty = (account) => {
    safeLocal.set(LOCAL_KEYS.session, account.id);
    setAuth({ type: 'faculty', accountId: account.id, name: account.name, email: account.email });
  };

  const signOut = () => {
    safeLocal.del(LOCAL_KEYS.session);
    setAuth(null);
  };

  return (
    <div style={styles.shell}>
      <FontsAndStyles />
      {!booted ? (
        <BootScreen />
      ) : auth === null ? (
        <LoginScreen config={config} accounts={accounts}
                     setAccounts={persistAccounts}
                     onAdminAuth={() => setAuth('admin')}
                     onFacultyAuth={signInFaculty}
                     showToast={showToast} />
      ) : auth === 'admin' ? (
        <AdminApp
          config={config} setConfig={persistConfig}
          cohorts={cohorts} students={students} setRoster={persistRoster}
          submissions={submissions} setSubmissions={persistSubs}
          accounts={accounts} setAccounts={persistAccounts}
          facilities={facilities} setFacilities={persistFacilities}
          onLogout={signOut}
          showToast={showToast}
        />
      ) : (
        <FacultyApp
          account={auth}
          accounts={accounts} setAccounts={persistAccounts}
          cohorts={cohorts} students={students}
          submissions={submissions} setSubmissions={persistSubs}
          facilities={facilities}
          onLogout={signOut}
          showToast={showToast}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Theme / styles
// ──────────────────────────────────────────────────────────────────────────────
const C = {
  paper:    '#ffffff',
  paperAlt: '#f5f5f5',
  ink:      '#1e2329',
  inkSoft:  '#4a5159',
  inkFaint: '#7a8189',
  line:     '#e5e5e5',
  lineSoft: '#f0f0f0',
  forest:   '#2d4a3e',
  forestDk: '#1f3329',
  terra:    '#b8654a',
  amber:    '#c89640',
  rose:     '#a73a4a',
  white:    '#ffffff',
};

const styles = {
  shell: {
    minHeight: '100vh',
    background: C.paper,
    color: C.ink,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: 15,
    lineHeight: 1.5,
  },
};

function FontsAndStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500;600;700&display=swap');

      * { box-sizing: border-box; }
      body { margin: 0; }
      input, select, textarea, button { font-family: inherit; font-size: inherit; color: inherit; }
      button { cursor: pointer; border: none; background: none; }
      button:disabled { cursor: not-allowed; opacity: 0.5; }

      .cwr-display { font-family: 'Fraunces', Georgia, serif; font-weight: 500; letter-spacing: -0.01em; }
      .cwr-italic  { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 400; }
      .cwr-mono    { font-family: ui-monospace, 'SF Mono', monospace; font-size: 13px; letter-spacing: 0.02em; }

      .cwr-input {
        width: 100%; padding: 11px 14px; border-radius: 8px;
        background: ${C.white}; border: 1px solid ${C.line};
        outline: none; transition: border-color .15s, box-shadow .15s;
      }
      .cwr-input:focus { border-color: ${C.forest}; box-shadow: 0 0 0 3px ${C.forest}22; }
      .cwr-input::placeholder { color: ${C.inkFaint}; }

      .cwr-btn-primary {
        background: ${C.ink}; color: ${C.paper};
        padding: 11px 18px; border-radius: 8px; font-weight: 500;
        display: inline-flex; align-items: center; gap: 8px;
        transition: background .15s, transform .05s;
      }
      .cwr-btn-primary:hover:not(:disabled) { background: ${C.forestDk}; }
      .cwr-btn-primary:active:not(:disabled) { transform: translateY(1px); }

      .cwr-btn-ghost {
        background: transparent; color: ${C.inkSoft};
        padding: 9px 14px; border-radius: 8px; font-weight: 500;
        display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid ${C.line};
        transition: background .15s, border-color .15s, color .15s;
      }
      .cwr-btn-ghost:hover:not(:disabled) { background: ${C.lineSoft}; border-color: ${C.inkFaint}; color: ${C.ink}; }

      .cwr-btn-danger {
        background: transparent; color: ${C.rose};
        padding: 9px 14px; border-radius: 8px; font-weight: 500;
        display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid ${C.line};
        transition: background .15s, border-color .15s;
      }
      .cwr-btn-danger:hover:not(:disabled) { background: ${C.rose}11; border-color: ${C.rose}; }

      .cwr-card {
        background: ${C.white}; border: 1px solid ${C.line};
        border-radius: 12px; padding: 24px;
      }

      .cwr-chip {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 10px; border-radius: 999px;
        font-size: 12px; font-weight: 500; letter-spacing: 0.02em;
        background: ${C.paperAlt}; color: ${C.inkSoft};
        border: 1px solid ${C.lineSoft};
      }

      .cwr-link {
        color: ${C.forest}; text-decoration: none; font-weight: 500;
        border-bottom: 1px solid ${C.forest}55; transition: border-color .15s;
      }
      .cwr-link:hover { border-bottom-color: ${C.forest}; }

      .cwr-check {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px; border-radius: 8px;
        background: ${C.paper}; border: 1px solid ${C.lineSoft};
        cursor: pointer; transition: background .12s, border-color .12s;
      }
      .cwr-check:hover { background: ${C.paperAlt}; }
      .cwr-check.checked { background: ${C.forest}11; border-color: ${C.forest}66; }
      .cwr-check input { accent-color: ${C.forest}; width: 16px; height: 16px; }

      .cwr-radio-row { display: flex; flex-direction: column; gap: 8px; }
      .cwr-radio {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 16px; border-radius: 8px;
        background: ${C.white}; border: 1px solid ${C.line};
        cursor: pointer; transition: all .12s;
      }
      .cwr-radio:hover { background: ${C.paperAlt}; }
      .cwr-radio.selected { background: ${C.forest}11; border-color: ${C.forest}; }
      .cwr-radio input { accent-color: ${C.forest}; }

      .cwr-tab {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 16px; border-radius: 8px;
        color: ${C.inkSoft}; font-weight: 500;
        transition: background .12s, color .12s;
      }
      .cwr-tab:hover { background: ${C.paperAlt}; color: ${C.ink}; }
      .cwr-tab.active { background: ${C.ink}; color: ${C.paper}; }

      .cwr-divider {
        border: none; height: 1px; background: ${C.line};
        margin: 24px 0;
      }

      table.cwr-table { width: 100%; border-collapse: collapse; }
      .cwr-table th {
        text-align: left; padding: 12px 14px;
        font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
        text-transform: uppercase; color: ${C.inkFaint};
        border-bottom: 1px solid ${C.line};
      }
      .cwr-table td {
        padding: 14px; border-bottom: 1px solid ${C.lineSoft};
        vertical-align: top;
      }
      .cwr-table tr:hover td { background: ${C.paper}; }

      @keyframes cwr-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .cwr-fade-in { animation: cwr-fade-in .25s ease-out; }

      /* Responsive: switch admin table to cards on small screens */
      .cwr-mobile-only { display: none; }
      @media (max-width: 768px) {
        .cwr-desktop-only { display: none !important; }
        .cwr-mobile-only { display: flex !important; }
      }

      /* ── Print / PDF view ───────────────────────────────────────────── */
      .cwr-print-only { display: none; }

      @media print {
        @page { margin: 0.6in; size: letter; }
        body, html { background: white !important; }
        .cwr-no-print { display: none !important; }
        .cwr-print-only { display: block !important; }
        .cwr-fade-in { animation: none !important; }
        .cwr-card {
          border: none !important;
          padding: 0 !important;
          background: white !important;
          box-shadow: none !important;
        }
        .cwr-divider { background: #999 !important; }
        .cwr-chip {
          background: white !important;
          border: 1px solid #555 !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        /* Avoid splitting student blocks across pages */
        .cwr-print-keep { break-inside: avoid; page-break-inside: avoid; }
      }`}</style>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Boot / Toast
// ──────────────────────────────────────────────────────────────────────────────
function BootScreen() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: C.inkFaint }}>
      <div style={{ textAlign: 'center' }}>
        <div className="cwr-display" style={{ fontSize: 22, color: C.ink }}>Clinical Weekly Report</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>Loading…</div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.kind === 'error';
  return (
    <div className="cwr-fade-in cwr-no-print" style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: isErr ? C.rose : C.forestDk, color: C.paper,
      padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 10, zIndex: 1000,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    }}>
      {isErr ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      {toast.msg}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────────────────────────────────────
function LoginScreen({ config, accounts, setAccounts, onAdminAuth, onFacultyAuth, showToast }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register' | 'admin' | 'forgot'

  if (mode === 'register') {
    return <CreateAccountScreen
      config={config}
      accounts={accounts}
      setAccounts={setAccounts}
      onCreated={onFacultyAuth}
      onCancel={() => setMode('signin')}
      showToast={showToast}
    />;
  }

  if (mode === 'forgot') {
    return <ForgotPasswordScreen
      accounts={accounts}
      setAccounts={setAccounts}
      onBack={() => setMode('signin')}
      showToast={showToast}
    />;
  }

  return <SignInScreen
    mode={mode}
    setMode={setMode}
    config={config}
    accounts={accounts}
    onAdminAuth={onAdminAuth}
    onFacultyAuth={onFacultyAuth}
  />;
}

function SignInScreen({ mode, setMode, config, accounts, onAdminAuth, onFacultyAuth }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = mode === 'admin';

  const submit = async () => {
    setErr('');
    setBusy(true);
    try {
      if (isAdmin) {
        if (pwd.trim() === (config.adminPassword || '').trim()) onAdminAuth();
        else setErr('Incorrect administrator password.');
        return;
      }
      const target = normalizeEmail(email);
      if (!target) { setErr('Enter your email.'); return; }
      const acc = accounts.find(a => normalizeEmail(a.email) === target);
      if (!acc) { setErr('No account with that email. Try creating one.'); return; }
      if (acc.disabled) { setErr('This account has been disabled. Contact your administrator.'); return; }
      const hash = await hashPassword(pwd);
      if (hash !== acc.passwordHash) { setErr('Incorrect password.'); return; }
      onFacultyAuth(acc);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="cwr-fade-in" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src={LOGO_URL} alt="Charles R. Drew University · Mervyn M. Dymally College of Nursing"
               style={{ maxWidth: '100%', height: 64, objectFit: 'contain', marginBottom: 20 }} />
          <h1 className="cwr-display" style={{ fontSize: 30, margin: 0, lineHeight: 1.1 }}>
            Clinical Weekly <span className="cwr-italic">Report</span>
          </h1>
          <p style={{ color: C.inkSoft, marginTop: 10, fontSize: 14 }}>
            {isAdmin ? 'Administrator sign in' : 'Faculty reporting portal · Sign in to your account'}
          </p>
        </div>

        <div className="cwr-card" style={{ padding: 28 }}>
          {!isAdmin && (
            <>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.inkSoft }}>
                Email
              </label>
              <input
                autoFocus
                type="email"
                className="cwr-input"
                value={email}
                onChange={e => { setEmail(e.target.value); setErr(''); }}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="you@cdrewu.edu"
                style={{ marginBottom: 14 }}
              />
            </>
          )}

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.inkSoft }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              autoFocus={isAdmin}
              type={showPwd ? 'text' : 'password'}
              className="cwr-input"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder={isAdmin ? 'Administrator password' : 'Your password'}
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPwd(s => !s)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                             padding: 8, color: C.inkFaint }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {err && (
            <div style={{ marginTop: 12, color: C.rose, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}

          <button onClick={submit} disabled={busy} className="cwr-btn-primary"
                  style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}>
            <Lock size={16} /> Sign in
          </button>

          {!isAdmin && (
            <>
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <button onClick={() => setMode('forgot')}
                        style={{ fontSize: 12, color: C.inkFaint, padding: 4,
                                 textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ marginTop: 12, paddingTop: 16, borderTop: `1px solid ${C.lineSoft}`,
                            textAlign: 'center', fontSize: 13, color: C.inkSoft }}>
                Don't have an account?{' '}
                <button onClick={() => setMode('register')}
                        style={{ color: C.forest, fontWeight: 500, padding: 0,
                                 textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Create one
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          {isAdmin ? (
            <button onClick={() => setMode('signin')}
                    style={{ fontSize: 13, color: C.inkFaint, padding: 4 }}>
              ← Faculty sign in instead
            </button>
          ) : (
            <button onClick={() => setMode('admin')}
                    style={{ fontSize: 13, color: C.inkFaint, padding: 4 }}>
              Administrator? <span style={{ color: C.inkSoft, textDecoration: 'underline', textUnderlineOffset: 2 }}>Sign in here</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateAccountScreen({ config, accounts, setAccounts, onCreated, onCancel, showToast }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');

    if (code.trim() !== (config.facultyPassword || '').trim()) {
      setErr('Invalid registration code. Ask your program administrator.');
      return;
    }
    if (!name.trim()) { setErr('Enter your full name.'); return; }
    const e = normalizeEmail(email);
    if (!e || !e.includes('@')) { setErr('Enter a valid email.'); return; }
    if (accounts.some(a => normalizeEmail(a.email) === e)) {
      setErr('An account already exists with that email. Sign in instead.');
      return;
    }
    if (pwd.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pwd !== pwd2) { setErr('Passwords do not match.'); return; }

    setBusy(true);
    try {
      const passwordHash = await hashPassword(pwd);
      const account = {
        id: 'acc_' + uid(),
        email: e,
        passwordHash,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        disabled: false,
      };
      await setAccounts([...accounts, account]);
      showToast('Account created. Welcome!');
      onCreated(account);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="cwr-fade-in" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO_URL} alt="CDU College of Nursing"
               style={{ maxWidth: '100%', height: 56, objectFit: 'contain', marginBottom: 18 }} />
          <h1 className="cwr-display" style={{ fontSize: 28, margin: 0, lineHeight: 1.1 }}>
            Create a faculty <span className="cwr-italic">account</span>
          </h1>
          <p style={{ color: C.inkSoft, marginTop: 8, fontSize: 14 }}>
            For ongoing clinical faculty at the Mervyn M. Dymally College of Nursing.
          </p>
        </div>

        <div className="cwr-card" style={{ padding: 26 }}>
          <FieldLabel>Registration code</FieldLabel>
          <input className="cwr-input" value={code} autoFocus
                 onChange={e => { setCode(e.target.value); setErr(''); }}
                 placeholder="Provided by your program administrator" />
          <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 4, marginBottom: 14 }}>
            A one-time code to verify you're authorized. Ask your Asst. Program Director if you don't have it.
          </div>

          <FieldLabel>Full name</FieldLabel>
          <input className="cwr-input" value={name}
                 onChange={e => { setName(e.target.value); setErr(''); }}
                 placeholder="e.g. Sarah Johnson"
                 style={{ marginBottom: 14 }} />

          <FieldLabel>Email</FieldLabel>
          <input className="cwr-input" type="email" value={email}
                 onChange={e => { setEmail(e.target.value); setErr(''); }}
                 placeholder="you@cdrewu.edu"
                 style={{ marginBottom: 14 }} />

          <FieldLabel>Password</FieldLabel>
          <div style={{ position: 'relative' }}>
            <input className="cwr-input" type={showPwd ? 'text' : 'password'} value={pwd}
                   onChange={e => { setPwd(e.target.value); setErr(''); }}
                   placeholder="At least 6 characters"
                   style={{ paddingRight: 44, marginBottom: 10 }} />
            <button type="button" onClick={() => setShowPwd(s => !s)}
                    style={{ position: 'absolute', right: 8, top: 20, padding: 8, color: C.inkFaint }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <input className="cwr-input" type={showPwd ? 'text' : 'password'} value={pwd2}
                 onChange={e => { setPwd2(e.target.value); setErr(''); }}
                 onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                 placeholder="Confirm password" />

          {err && (
            <div style={{ marginTop: 12, color: C.rose, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}

          <button onClick={submit} disabled={busy} className="cwr-btn-primary"
                  style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}>
            <UserPlus size={16} /> Create account
          </button>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.lineSoft}`,
                        textAlign: 'center', fontSize: 13, color: C.inkSoft }}>
            Already have an account?{' '}
            <button onClick={onCancel}
                    style={{ color: C.forest, fontWeight: 500, padding: 0,
                             textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ accounts, setAccounts, onBack, showToast }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const target = normalizeEmail(email);
    if (!target) return;
    setBusy(true);
    try {
      const acc = accounts.find(a => normalizeEmail(a.email) === target);
      if (acc) {
        // Mark reset requested — admin will see it and issue a temp password
        await setAccounts(accounts.map(a =>
          a.id === acc.id ? { ...a, resetRequestedAt: new Date().toISOString() } : a
        ));
      }
      // Always show success (no email enumeration)
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="cwr-fade-in" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO_URL} alt="CDU College of Nursing"
               style={{ maxWidth: '100%', height: 56, objectFit: 'contain', marginBottom: 18 }} />
          <h1 className="cwr-display" style={{ fontSize: 28, margin: 0, lineHeight: 1.1 }}>
            Reset your <span className="cwr-italic">password</span>
          </h1>
        </div>

        <div className="cwr-card" style={{ padding: 26 }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 48, height: 48, borderRadius: 12, background: C.forest + '22',
                            color: C.forest, marginBottom: 14 }}>
                <Check size={24} />
              </div>
              <p style={{ color: C.ink, fontSize: 15, margin: 0, marginBottom: 6, fontWeight: 500 }}>
                Request received
              </p>
              <p style={{ color: C.inkSoft, fontSize: 13, margin: 0 }}>
                If an account exists for that email, your program administrator has been notified.
                They will set a temporary password and contact you to share it. You can then sign in
                and change it from your account.
              </p>
              <button onClick={onBack} className="cwr-btn-ghost" style={{ marginTop: 18 }}>
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </div>
          ) : (
            <>
              <p style={{ color: C.inkSoft, fontSize: 13, marginTop: 0, marginBottom: 16 }}>
                Enter the email associated with your account. Your administrator will set a temporary
                password and contact you with it.
              </p>
              <FieldLabel>Email</FieldLabel>
              <input className="cwr-input" type="email" autoFocus value={email}
                     onChange={e => setEmail(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                     placeholder="you@cdrewu.edu" />

              <button onClick={submit} disabled={busy || !email.trim()} className="cwr-btn-primary"
                      style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
                Notify administrator
              </button>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.lineSoft}`,
                            textAlign: 'center', fontSize: 13 }}>
                <button onClick={onBack}
                        style={{ color: C.inkSoft, padding: 4 }}>
                  ← Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.inkSoft }}>
      {children}
    </label>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Faculty form
// ──────────────────────────────────────────────────────────────────────────────
function FacultyApp({ account, accounts, setAccounts, cohorts, students, submissions, setSubmissions, facilities, onLogout, showToast }) {
  const [view, setView] = useState('form');     // 'form' | 'my-subs' | 'success'
  const [lastRef, setLastRef] = useState('');
  const [viewingSub, setViewingSub] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedFlash, setDraftSavedFlash] = useState(false);

  // Compute prefill from this faculty's most recent submission
  const lastMine = useMemo(() => {
    return submissions
      .filter(s => s.accountId === account.accountId ||
                   normalizeName(s.facultyName) === normalizeName(account.name))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
  }, [submissions, account]);

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const emptyData = () => ({
    courseId: lastMine?.courseId || '',
    program:  lastMine?.program  || '',
    cohortId: lastMine?.cohortId || '',
    facultyName: account.name,
    facility: safeLocal.get(LOCAL_KEYS.facility) || lastMine?.facility || '',
    rotationDate: todayISO(),
    facultyPresent: '',
    supervisorNotified: '',
    absentStudentIds: [],
    absencesNotified: {},
    remediationStudentIds: [],
    remediationNotesByStudent: {},
    remediationNotes: '',
    absenceNotes: '',
  });

  const [data, setData] = useState(() => {
    const stored = safeLocal.get(LOCAL_KEYS.draft);
    if (stored) {
      try {
        const draft = JSON.parse(stored);
        // Force the faculty name to match the signed-in account
        return { ...emptyData(), ...draft, facultyName: account.name };
      } catch {}
    }
    return emptyData();
  });

  useEffect(() => {
    const stored = safeLocal.get(LOCAL_KEYS.draft);
    if (stored) {
      try {
        const d = JSON.parse(stored);
        const hasContent = d.courseId || d.cohortId || (d.absentStudentIds?.length) ||
                           (d.remediationStudentIds?.length);
        if (hasContent) setDraftRestored(true);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    if (view !== 'form') return;
    const t = setTimeout(() => {
      try {
        safeLocal.set(LOCAL_KEYS.draft, JSON.stringify(data));
        setDraftSavedFlash(true);
        setTimeout(() => setDraftSavedFlash(false), 1200);
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [data, view]);

  // Remember chosen facility
  useEffect(() => {
    if (data.facility) safeLocal.set(LOCAL_KEYS.facility, data.facility);
  }, [data.facility]);

  const update = (patch) => setData(d => ({ ...d, ...patch }));

  const availableCohorts = useMemo(
    () => cohorts.filter(c => !data.program || c.program === data.program),
    [cohorts, data.program]
  );

  const rosterStudents = useMemo(
    () => students.filter(s => s.cohortId === data.cohortId)
                  .sort((a, b) => a.name.localeCompare(b.name)),
    [students, data.cohortId]
  );

  const canSubmit = data.courseId && data.program && data.cohortId &&
                    data.facultyName.trim() && data.facility.trim() &&
                    data.rotationDate && data.facultyPresent;

  const mySubmissions = useMemo(() => {
    return submissions
      .filter(s => s.accountId === account.accountId ||
                   normalizeName(s.facultyName) === normalizeName(account.name))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }, [submissions, account]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const sub = {
      id: uid(),
      submittedAt: new Date().toISOString(),
      accountId: account.accountId,
      ...data,
    };
    const next = [sub, ...submissions];
    await setSubmissions(next);
    safeLocal.del(LOCAL_KEYS.draft);
    setLastRef(sub.id.slice(0, 8).toUpperCase());
    setView('success');
    showToast('Report submitted successfully');
  };

  const startFresh = () => {
    if (!confirm('Clear all answers and start a fresh report?')) return;
    safeLocal.del(LOCAL_KEYS.draft);
    setData(emptyData());
    setDraftRestored(false);
    showToast('Cleared. Starting fresh.');
  };

  if (view === 'success') {
    return <SuccessScreen refId={lastRef}
                          onAnother={() => {
                            setData({ ...emptyData(), facility: data.facility });
                            setView('form');
                          }}
                          onViewMySubs={() => setView('my-subs')}
                          mySubsCount={mySubmissions.length}
                          onLogout={onLogout} />;
  }

  if (view === 'my-subs') {
    return <MySubmissionsView
              submissions={mySubmissions}
              students={students}
              cohorts={cohorts}
              identity={account.name}
              viewingSub={viewingSub}
              setViewingSub={setViewingSub}
              onBack={() => { setViewingSub(null); setView('form'); }}
              onLogout={onLogout}
            />;
  }

  if (view === 'change-password') {
    return <ChangePasswordView
              account={account}
              setAccounts={setAccounts}
              accounts={accounts}
              onBack={() => setView('form')}
              onLogout={onLogout}
              showToast={showToast}
            />;
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Header onLogout={onLogout} subtitle={`Faculty · ${account.name}`} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: C.paperAlt,
                      borderRadius: 10, width: 'fit-content' }}>
          <TabBtn active icon={<FileText size={16} />} label="New report" />
          <TabBtn icon={<History size={16} />} label="My submissions"
                  count={mySubmissions.length}
                  onClick={() => setView('my-subs')} />
        </div>
        <button onClick={() => setView('change-password')} className="cwr-btn-ghost"
                style={{ padding: '8px 12px', fontSize: 13 }}>
          <KeyRound size={14} /> Change password
        </button>
      </div>

      {draftRestored && (
        <div className="cwr-fade-in" style={{
          padding: '12px 16px', marginBottom: 24,
          background: C.forest + '12', border: `1px solid ${C.forest}44`,
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 13,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.forestDk }}>
            <RefreshCw size={14} />
            We restored your draft from earlier. Continue where you left off, or start over.
          </span>
          <button onClick={startFresh}
                  style={{ color: C.forest, fontSize: 13, fontWeight: 500, padding: 4,
                           textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Start fresh
          </button>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h1 className="cwr-display" style={{ fontSize: 40, margin: 0, lineHeight: 1.05 }}>
          Clinical <span className="cwr-italic">Weekly</span> Report
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12, fontSize: 15, maxWidth: 600 }}>
          Hello {account.name.split(' ')[0]}. Please complete this report for each clinical rotation so we
          can address absences, remediation, and continuous improvement in real time. Reach out to your
          Asst. Program Directors for anything outside this form.
        </p>
        {lastMine && (
          <div style={{ marginTop: 12, padding: '8px 12px', display: 'inline-flex',
                        alignItems: 'center', gap: 8, fontSize: 12, background: C.paperAlt,
                        color: C.inkSoft, borderRadius: 8 }}>
            <Sparkles size={12} />
            Pre-filled from your last report ({COURSES.find(c => c.id === lastMine.courseId)?.name || ''}).
          </div>
        )}
      </div>

      <Section number="1" title="Clinical course">
        <RadioGroup
          options={COURSES.map(c => ({ value: c.id, label: `${c.name}`, sub: c.code }))}
          value={data.courseId}
          onChange={v => update({ courseId: v })}
        />
      </Section>

      <Section number="2" title="Program">
        <RadioGroup
          options={PROGRAMS.map(p => ({ value: p.id, label: p.label }))}
          value={data.program}
          onChange={v => update({ program: v, cohortId: '' })}
        />
      </Section>

      <Section number="3" title="Cohort"
               hint={!data.program ? 'Select a program first.' :
                     availableCohorts.length === 0 ? 'No cohorts available for this program — ask your administrator to create one.' : null}>
        {data.program && availableCohorts.length > 0 && (
          <RadioGroup
            options={availableCohorts.map(c => ({ value: c.id, label: c.name,
              sub: `${students.filter(s => s.cohortId === c.id).length} students` }))}
            value={data.cohortId}
            onChange={v => update({ cohortId: v, absentStudentIds: [], absencesNotified: {}, remediationStudentIds: [], remediationNotesByStudent: {} })}
          />
        )}
      </Section>

      <Section number="4" title="Your name"
               hint="Pulled from your account.">
        <input className="cwr-input" value={data.facultyName} readOnly disabled
               style={{ background: C.paperAlt, cursor: 'not-allowed' }} />
      </Section>

      <Section number="5" title="Facility name"
               hint={facilities.length === 0
                 ? "Type the facility where this rotation took place."
                 : "Pick from the list or type a new one."}>
        {facilities.length > 0 ? (
          <>
            <select className="cwr-input" value={facilities.some(f => f.name === data.facility) ? data.facility : '__custom__'}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '__custom__') update({ facility: '' });
                      else update({ facility: v });
                    }}
                    style={{ marginBottom: facilities.some(f => f.name === data.facility) ? 0 : 10 }}>
              <option value="" disabled>Select a facility…</option>
              {facilities.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
            {!facilities.some(f => f.name === data.facility) && (
              <input className="cwr-input" value={data.facility}
                     onChange={e => update({ facility: e.target.value })}
                     placeholder="Type facility name" />
            )}
          </>
        ) : (
          <input className="cwr-input" value={data.facility}
                 onChange={e => update({ facility: e.target.value })}
                 placeholder="e.g. St. Francis Medical Center" />
        )}
      </Section>

      <Section number="6" title="Clinical rotation date">
        <input type="date" className="cwr-input" value={data.rotationDate}
               onChange={e => update({ rotationDate: e.target.value })}
               max={new Date().toISOString().slice(0, 10)}
               style={{ maxWidth: 260 }} />
      </Section>

      <Section number="7" title="Were you (as faculty member) present for this clinical rotation?"
               hint="If you were absent, confirm that you notified your supervisor and the Clinical Placement Office.">
        <RadioGroup
          options={[
            { value: 'yes', label: 'Yes, I was present' },
            { value: 'no',  label: 'No, I was absent' },
          ]}
          value={data.facultyPresent}
          onChange={v => update({ facultyPresent: v, supervisorNotified: v === 'yes' ? 'na' : '' })}
        />
        {data.facultyPresent === 'no' && (
          <div style={{ marginTop: 14, paddingLeft: 14, borderLeft: `3px solid ${C.terra}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: C.inkSoft }}>
              Did you notify your supervisor and the Clinical Placement Office?
            </div>
            <RadioGroup
              compact
              options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not yet' }]}
              value={data.supervisorNotified}
              onChange={v => update({ supervisorNotified: v })}
            />
          </div>
        )}
      </Section>

      <Section number="8" title="Student absences"
               hint="Check off any students who were absent this rotation. For each, note whether they notified you in advance.">
        {!data.cohortId ? (
          <EmptyHint>Select a cohort to load the roster.</EmptyHint>
        ) : rosterStudents.length === 0 ? (
          <EmptyHint>No students in this cohort yet.</EmptyHint>
        ) : (
          <div>
            <StudentChecklist
              students={rosterStudents}
              checked={data.absentStudentIds}
              onToggle={(sid) => {
                const has = data.absentStudentIds.includes(sid);
                const next = has ? data.absentStudentIds.filter(x => x !== sid) : [...data.absentStudentIds, sid];
                const notif = { ...data.absencesNotified };
                if (has) delete notif[sid];
                update({ absentStudentIds: next, absencesNotified: notif });
              }}
              renderExtra={(s) => {
                if (!data.absentStudentIds.includes(s.id)) return null;
                const val = data.absencesNotified[s.id] || '';
                return (
                  <div style={{ marginTop: 8, marginLeft: 28, display: 'flex', gap: 8 }}>
                    <button type="button"
                            onClick={(e) => { e.stopPropagation();
                              update({ absencesNotified: { ...data.absencesNotified, [s.id]: 'yes' } }); }}
                            className={val === 'yes' ? 'cwr-btn-primary' : 'cwr-btn-ghost'}
                            style={{ padding: '6px 12px', fontSize: 13 }}>
                      <Check size={13} /> Notified
                    </button>
                    <button type="button"
                            onClick={(e) => { e.stopPropagation();
                              update({ absencesNotified: { ...data.absencesNotified, [s.id]: 'no' } }); }}
                            className={val === 'no' ? 'cwr-btn-primary' : 'cwr-btn-ghost'}
                            style={{ padding: '6px 12px', fontSize: 13 }}>
                      <X size={13} /> No-call / no-show
                    </button>
                  </div>
                );
              }}
            />
            <textarea className="cwr-input" rows={2}
              value={data.absenceNotes}
              onChange={e => update({ absenceNotes: e.target.value })}
              placeholder="Optional notes about absences (context, follow-up plans)…"
              style={{ marginTop: 14, resize: 'vertical' }} />
          </div>
        )}
      </Section>

      <Section number="9" title="Students requiring remediation"
               hint="Check any students who are deficient and require remediation. Add a note for each student explaining the deficiency and plan. Ensure a learning contract is established and emailed within 24 hours.">
        {!data.cohortId ? (
          <EmptyHint>Select a cohort to load the roster.</EmptyHint>
        ) : rosterStudents.length === 0 ? (
          <EmptyHint>No students in this cohort yet.</EmptyHint>
        ) : (
          <>
            <StudentChecklist
              students={rosterStudents}
              checked={data.remediationStudentIds}
              onToggle={(sid) => {
                const has = data.remediationStudentIds.includes(sid);
                const nextIds = has
                  ? data.remediationStudentIds.filter(x => x !== sid)
                  : [...data.remediationStudentIds, sid];
                const nextNotes = { ...data.remediationNotesByStudent };
                if (has) delete nextNotes[sid];
                update({ remediationStudentIds: nextIds, remediationNotesByStudent: nextNotes });
              }}
              renderExtra={(s) => {
                if (!data.remediationStudentIds.includes(s.id)) return null;
                const val = data.remediationNotesByStudent[s.id] || '';
                return (
                  <div style={{ marginTop: 8, marginLeft: 28, paddingLeft: 14,
                                borderLeft: `2px solid ${C.amber}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft,
                                  marginBottom: 6, letterSpacing: '0.02em' }}>
                      Notes for {s.name}
                    </div>
                    <textarea className="cwr-input" rows={2}
                      value={val}
                      onChange={e => update({
                        remediationNotesByStudent: { ...data.remediationNotesByStudent, [s.id]: e.target.value }
                      })}
                      placeholder="Describe the deficiency, plan of action, and learning contract status…"
                      style={{ resize: 'vertical', fontSize: 14 }} />
                  </div>
                );
              }}
            />
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.inkSoft, marginBottom: 6,
                            letterSpacing: '0.02em' }}>
                Additional notes <span style={{ fontWeight: 400, color: C.inkFaint }}>(optional, cohort-wide)</span>
              </div>
              <textarea className="cwr-input" rows={2}
                value={data.remediationNotes}
                onChange={e => update({ remediationNotes: e.target.value })}
                placeholder="Any general observations about the cohort, follow-up plans, etc."
                style={{ resize: 'vertical' }} />
            </div>
          </>
        )}
      </Section>

      <div style={{ marginTop: 40, padding: 20, background: C.paperAlt, borderRadius: 12,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: C.inkSoft, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>{canSubmit ? 'Review your responses, then submit.' : 'Complete the required fields to submit.'}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
            color: draftSavedFlash ? C.forest : C.inkFaint,
            transition: 'color .3s',
          }}>
            <Check size={12} /> Draft saved
          </span>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmit} className="cwr-btn-primary">
          <Save size={16} /> Submit report
        </button>
      </div>
    </div>
  );
}

function Section({ number, title, hint, children }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span className="cwr-display" style={{ color: C.terra, fontSize: 14, fontWeight: 600 }}>
          {number.padStart(2, '0')}
        </span>
        <h3 className="cwr-display" style={{ fontSize: 19, margin: 0, fontWeight: 500 }}>
          {title}
        </h3>
      </div>
      {hint && <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 12, marginLeft: 28 }}>{hint}</div>}
      <div style={{ marginLeft: 28 }}>{children}</div>
    </div>
  );
}

function RadioGroup({ options, value, onChange, compact }) {
  return (
    <div className="cwr-radio-row" style={compact ? { flexDirection: 'row', flexWrap: 'wrap' } : null}>
      {options.map(opt => (
        <label key={opt.value}
               className={'cwr-radio' + (value === opt.value ? ' selected' : '')}
               style={compact ? { flex: '0 0 auto' } : null}>
          <input type="radio" checked={value === opt.value}
                 onChange={() => onChange(opt.value)} />
          <span style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span>{opt.label}</span>
            {opt.sub && <span style={{ fontSize: 12, color: C.inkFaint, marginTop: 2 }}>{opt.sub}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

function StudentChecklist({ students, checked, onToggle, renderExtra }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {students.map(s => {
        const isChecked = checked.includes(s.id);
        return (
          <div key={s.id}>
            <label className={'cwr-check' + (isChecked ? ' checked' : '')}>
              <input type="checkbox" checked={isChecked} onChange={() => onToggle(s.id)} />
              <span style={{ flex: 1 }}>{s.name}</span>
            </label>
            {renderExtra && renderExtra(s)}
          </div>
        );
      })}
    </div>
  );
}

function EmptyHint({ children }) {
  return (
    <div style={{ padding: 16, background: C.paperAlt, borderRadius: 8,
                  color: C.inkFaint, fontSize: 13, fontStyle: 'italic' }}>
      {children}
    </div>
  );
}

function SuccessScreen({ refId, onAnother, onViewMySubs, mySubsCount, onLogout }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="cwr-fade-in" style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 64, height: 64, borderRadius: 16, background: C.forest, color: C.paper,
                      marginBottom: 20 }}>
          <CheckCircle2 size={32} />
        </div>
        <h1 className="cwr-display" style={{ fontSize: 32, margin: 0 }}>
          Report <span className="cwr-italic">submitted</span>
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12 }}>
          Thank you. Your weekly clinical report has been recorded and is available to your program administrators.
        </p>
        <div className="cwr-chip" style={{ marginTop: 16 }}>
          <Sparkles size={12} /> Reference: <span className="cwr-mono" style={{ marginLeft: 4 }}>{refId}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <button onClick={onAnother} className="cwr-btn-primary">
            <Plus size={16} /> Submit another
          </button>
          {onViewMySubs && (
            <button onClick={onViewMySubs} className="cwr-btn-ghost">
              <History size={16} /> My submissions{mySubsCount ? ` (${mySubsCount})` : ''}
            </button>
          )}
          <button onClick={onLogout} className="cwr-btn-ghost">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Faculty "My submissions" view
// ──────────────────────────────────────────────────────────────────────────────
function MySubmissionsView({ submissions, students, cohorts, identity, viewingSub, setViewingSub, onBack, onLogout }) {
  if (viewingSub) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
        <Header onLogout={onLogout} subtitle={`Faculty · ${identity}`} />
        <SubmissionDetail
          sub={viewingSub}
          students={students}
          cohorts={cohorts}
          onBack={() => setViewingSub(null)}
          readOnly
          backLabel="Back to my submissions"
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Header onLogout={onLogout} subtitle={`Faculty · ${identity}`} />

      <button onClick={onBack} className="cwr-btn-ghost" style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to new report
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 className="cwr-display" style={{ fontSize: 32, margin: 0, lineHeight: 1.05 }}>
          My <span className="cwr-italic">submissions</span>
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 8, fontSize: 14 }}>
          Showing reports submitted by <strong>{identity}</strong>.
        </p>
      </div>

      {submissions.length === 0 ? (
        <EmptyState icon={<History size={32} />}
                    title="No submissions yet"
                    body="Once you submit a report, it'll appear here for your reference." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {submissions.map(s => {
            const courseName = COURSES.find(c => c.id === s.courseId)?.name || s.courseId;
            const cohortName = cohorts.find(c => c.id === s.cohortId)?.name || '—';
            const abs = s.absentStudentIds?.length || 0;
            const rem = s.remediationStudentIds?.length || 0;
            const facAbs = s.facultyPresent === 'no';
            return (
              <button key={s.id} onClick={() => setViewingSub(s)} className="cwr-card"
                      style={{ textAlign: 'left', padding: 18, cursor: 'pointer',
                               transition: 'border-color .12s, transform .05s',
                               display: 'block', width: '100%' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.inkSoft}
                      onMouseLeave={e => e.currentTarget.style.borderColor = C.line}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                              gap: 12, marginBottom: 8 }}>
                  <div>
                    <div className="cwr-display" style={{ fontSize: 17, marginBottom: 2 }}>
                      {courseName}
                    </div>
                    <div style={{ fontSize: 13, color: C.inkSoft }}>
                      {cohortName} · {s.facility}
                    </div>
                  </div>
                  <ChevronRight size={18} color={C.inkFaint} style={{ flexShrink: 0, marginTop: 4 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10,
                              flexWrap: 'wrap', fontSize: 13, color: C.inkFaint }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> Rotation {fmtDate(s.rotationDate)}
                  </span>
                  <span>·</span>
                  <span>Submitted {fmtDate(s.submittedAt)}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {facAbs && <span className="cwr-chip" style={{ background: C.terra + '22', color: C.terra, borderColor: C.terra + '44' }}>Fac absent</span>}
                    {abs > 0 && <span className="cwr-chip">{abs} absent</span>}
                    {rem > 0 && <span className="cwr-chip" style={{ background: C.amber + '22', color: '#8a6a1f', borderColor: C.amber + '55' }}>{rem} remediation</span>}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Faculty change password
// ──────────────────────────────────────────────────────────────────────────────
function ChangePasswordView({ account, accounts, setAccounts, onBack, onLogout, showToast }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr('');
    if (!current || !next || !confirm) { setErr('Fill in all fields.'); return; }
    if (next.length < 6) { setErr('New password must be at least 6 characters.'); return; }
    if (next !== confirm) { setErr('New passwords do not match.'); return; }
    if (next === current) { setErr('New password must be different.'); return; }

    setBusy(true);
    try {
      const acc = accounts.find(a => a.id === account.accountId);
      if (!acc) { setErr('Account not found. Try signing out and back in.'); return; }
      const currentHash = await hashPassword(current);
      if (currentHash !== acc.passwordHash) {
        setErr('Current password is incorrect.');
        return;
      }
      const nextHash = await hashPassword(next);
      // If admin had flagged a reset, clear it now that the user has set their own password
      const updated = { ...acc, passwordHash: nextHash };
      delete updated.resetRequestedAt;
      await setAccounts(accounts.map(a => a.id === acc.id ? updated : a));
      showToast('Password updated');
      onBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Header onLogout={onLogout} subtitle={`Faculty · ${account.name}`} />

      <button onClick={onBack} className="cwr-btn-ghost" style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="cwr-display" style={{ fontSize: 28, margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
        Change <span className="cwr-italic">password</span>
      </h1>
      <p style={{ color: C.inkSoft, fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        Set a new password for <strong>{account.email}</strong>.
      </p>

      <div className="cwr-card">
        <FieldLabel>Current password</FieldLabel>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input className="cwr-input" type={showPwd ? 'text' : 'password'}
                 value={current} autoFocus
                 onChange={e => { setCurrent(e.target.value); setErr(''); }}
                 placeholder="Or the temporary password your administrator set"
                 style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPwd(s => !s)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                           padding: 8, color: C.inkFaint }}>
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <FieldLabel>New password</FieldLabel>
        <input className="cwr-input" type={showPwd ? 'text' : 'password'}
               value={next}
               onChange={e => { setNext(e.target.value); setErr(''); }}
               placeholder="At least 6 characters"
               style={{ marginBottom: 12 }} />
        <input className="cwr-input" type={showPwd ? 'text' : 'password'}
               value={confirm}
               onChange={e => { setConfirm(e.target.value); setErr(''); }}
               onKeyDown={e => { if (e.key === 'Enter') submit(); }}
               placeholder="Confirm new password" />

        {err && (
          <div style={{ marginTop: 12, color: C.rose, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertCircle size={14} /> {err}
          </div>
        )}

        <button onClick={submit} disabled={busy} className="cwr-btn-primary"
                style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}>
          <Save size={16} /> Update password
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared header
// ──────────────────────────────────────────────────────────────────────────────
function Header({ onLogout, subtitle }) {
  return (
    <div className="cwr-no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingBottom: 24, marginBottom: 32, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src={LOGO_URL} alt="CDU College of Nursing"
             style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        <div style={{ paddingLeft: 14, borderLeft: `1px solid ${C.line}` }}>
          <div className="cwr-display" style={{ fontSize: 15, lineHeight: 1 }}>Clinical Weekly Report</div>
          <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 3 }}>{subtitle}</div>
        </div>
      </div>
      <button onClick={onLogout} className="cwr-btn-ghost">
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin app
// ──────────────────────────────────────────────────────────────────────────────
function AdminApp({ config, setConfig, cohorts, students, setRoster, submissions, setSubmissions, accounts, setAccounts, facilities, setFacilities, onLogout, showToast }) {
  const [tab, setTab] = useState('submissions');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      <Header onLogout={onLogout} subtitle="Administrator console" />

      <div className="cwr-no-print" style={{ display: 'flex', gap: 4, marginBottom: 28, padding: 4, background: C.paperAlt,
                    borderRadius: 10, alignSelf: 'flex-start', width: 'fit-content', flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'submissions'} onClick={() => setTab('submissions')}
                icon={<FileText size={16} />} label="Submissions" count={submissions.length} />
        <TabBtn active={tab === 'rosters'} onClick={() => setTab('rosters')}
                icon={<Users size={16} />} label="Cohorts & rosters" count={cohorts.length} />
        <TabBtn active={tab === 'faculty'} onClick={() => setTab('faculty')}
                icon={<GraduationCap size={16} />} label="Faculty accounts" count={accounts.length} />
        <TabBtn active={tab === 'facilities'} onClick={() => setTab('facilities')}
                icon={<Building size={16} />} label="Facilities" count={facilities.length} />
        <TabBtn active={tab === 'settings'} onClick={() => setTab('settings')}
                icon={<Sliders size={16} />} label="Settings" />
      </div>

      {tab === 'submissions' && (
        <SubmissionsPanel submissions={submissions} setSubmissions={setSubmissions}
                          cohorts={cohorts} students={students} showToast={showToast} />
      )}
      {tab === 'rosters' && (
        <RostersPanel cohorts={cohorts} students={students} setRoster={setRoster} showToast={showToast} />
      )}
      {tab === 'faculty' && (
        <FacultyAccountsPanel accounts={accounts} setAccounts={setAccounts}
                              submissions={submissions} showToast={showToast} />
      )}
      {tab === 'facilities' && (
        <FacilitiesPanel facilities={facilities} setFacilities={setFacilities} showToast={showToast} />
      )}
      {tab === 'settings' && (
        <SettingsPanel config={config} setConfig={setConfig} showToast={showToast} />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, count }) {
  return (
    <button onClick={onClick} className={'cwr-tab' + (active ? ' active' : '')}>
      {icon} {label}
      {count !== undefined && (
        <span style={{
          padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: active ? C.paper + '22' : C.paper,
          color: active ? C.paper : C.inkSoft,
        }}>{count}</span>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Submissions panel
// ──────────────────────────────────────────────────────────────────────────────
function SubmissionsPanel({ submissions, setSubmissions, cohorts, students, showToast }) {
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [statsRange, setStatsRange] = useState('week'); // 'week' | 'month' | 'all'
  const [detail, setDetail] = useState(null);

  const studentMap = useMemo(() => Object.fromEntries(students.map(s => [s.id, s.name])), [students]);
  const cohortMap  = useMemo(() => Object.fromEntries(cohorts.map(c => [c.id, c.name])), [cohorts]);

  // Compute summary stats over the chosen time window
  const stats = useMemo(() => {
    const cutoff = statsRange === 'week'  ? startOfWeek().getTime() :
                   statsRange === 'month' ? startOfMonth().getTime() : 0;
    const inRange = submissions.filter(s => new Date(s.submittedAt).getTime() >= cutoff);
    return {
      total:      inRange.length,
      absences:   inRange.reduce((n, s) => n + (s.absentStudentIds?.length || 0), 0),
      remediation:inRange.reduce((n, s) => n + (s.remediationStudentIds?.length || 0), 0),
      facAbsent:  inRange.filter(s => s.facultyPresent === 'no').length,
    };
  }, [submissions, statsRange]);

  const filtered = submissions.filter(s => {
    if (courseFilter && s.courseId !== courseFilter) return false;
    if (programFilter && s.program !== programFilter) return false;
    if (issuesOnly) {
      const hasIssue = s.facultyPresent === 'no' ||
                       (s.absentStudentIds?.length || 0) > 0 ||
                       (s.remediationStudentIds?.length || 0) > 0;
      if (!hasIssue) return false;
    }
    if (query) {
      const q = query.toLowerCase();
      const hay = [s.facultyName, s.facility, cohortMap[s.cohortId] || '', courseLabel(s.courseId)]
        .join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const exportCSV = () => {
    if (submissions.length === 0) { showToast('No submissions to export', 'error'); return; }
    const headers = [
      'Submitted At', 'Reference', 'Course', 'Program', 'Cohort',
      'Faculty Name', 'Facility', 'Rotation Date',
      'Faculty Present', 'Supervisor Notified',
      'Absent Students', 'Absences w/ Notice', 'Absences w/o Notice',
      'Absence Notes',
      'Remediation Students', 'Remediation Details', 'Remediation Notes',
    ];
    const rows = filtered.map(s => {
      const absNames = s.absentStudentIds.map(id => studentMap[id] || '?');
      const notified = s.absentStudentIds.filter(id => s.absencesNotified?.[id] === 'yes').map(id => studentMap[id] || '?');
      const noNotice = s.absentStudentIds.filter(id => s.absencesNotified?.[id] === 'no').map(id => studentMap[id] || '?');
      const remNames = (s.remediationStudentIds || []).map(id => studentMap[id] || '?');
      const remDetails = (s.remediationStudentIds || []).map(id => {
        const name = studentMap[id] || '?';
        const note = s.remediationNotesByStudent?.[id] || '';
        return note ? `${name}: ${note}` : name;
      });
      return [
        s.submittedAt, s.id.slice(0, 8).toUpperCase(),
        courseLabel(s.courseId), s.program, cohortMap[s.cohortId] || '',
        s.facultyName, s.facility, s.rotationDate,
        s.facultyPresent, s.supervisorNotified || '',
        absNames.join('; '), notified.join('; '), noNotice.join('; '),
        s.absenceNotes || '',
        remNames.join('; '), remDetails.join(' | '), s.remediationNotes || '',
      ];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(v => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-weekly-reports-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filtered.length} submission${filtered.length === 1 ? '' : 's'}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    await setSubmissions(submissions.filter(s => s.id !== id));
    setDetail(null);
    showToast('Submission deleted');
  };

  if (detail) {
    return <SubmissionDetail sub={detail}
                              students={students} cohorts={cohorts}
                              onBack={() => setDetail(null)}
                              onSave={async (next) => {
                                await setSubmissions(submissions.map(s => s.id === next.id ? next : s));
                                setDetail(next);
                                showToast('Submission updated');
                              }}
                              onDelete={() => handleDelete(detail.id)} />;
  }

  return (
    <div className="cwr-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 className="cwr-display" style={{ fontSize: 28, margin: 0 }}>
            Submitted <span className="cwr-italic">reports</span>
          </h2>
          <p style={{ color: C.inkSoft, fontSize: 13, marginTop: 6 }}>
            {filtered.length} of {submissions.length} report{submissions.length === 1 ? '' : 's'} shown
          </p>
        </div>
        <button onClick={exportCSV} className="cwr-btn-primary">
          <FileDown size={16} /> Export CSV
        </button>
      </div>

      {/* Summary banner */}
      {submissions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <TrendingUp size={14} color={C.inkFaint} />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                           textTransform: 'uppercase', color: C.inkFaint }}>
              At a glance
            </span>
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {[
                { id: 'week', label: 'This week' },
                { id: 'month', label: 'This month' },
                { id: 'all', label: 'All time' },
              ].map(r => (
                <button key={r.id} onClick={() => setStatsRange(r.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                          background: statsRange === r.id ? C.ink : 'transparent',
                          color: statsRange === r.id ? C.paper : C.inkSoft,
                          border: `1px solid ${statsRange === r.id ? C.ink : C.line}`,
                          transition: 'all .12s',
                        }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <StatCard label="Reports" value={stats.total} />
            <StatCard label="Student absences" value={stats.absences} accent={stats.absences > 0 ? C.inkSoft : null} />
            <StatCard label="Remediation cases" value={stats.remediation}
                      accent={stats.remediation > 0 ? '#8a6a1f' : null}
                      bg={stats.remediation > 0 ? C.amber + '15' : null} />
            <StatCard label="Faculty absences" value={stats.facAbsent}
                      accent={stats.facAbsent > 0 ? C.terra : null}
                      bg={stats.facAbsent > 0 ? C.terra + '12' : null} />
          </div>

          {/* Action strip — only if anything needs attention */}
          {(stats.facAbsent > 0 || stats.remediation > 0) && (
            <div style={{
              marginTop: 10, padding: '10px 14px',
              background: C.amber + '15', border: `1px solid ${C.amber}44`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, color: C.inkSoft, flexWrap: 'wrap',
            }}>
              <AlertTriangle size={14} color={C.amber} />
              <span>
                {stats.facAbsent > 0 && (
                  <>
                    <strong style={{ color: C.terra }}>{stats.facAbsent}</strong> faculty absence{stats.facAbsent === 1 ? '' : 's'}
                    {stats.remediation > 0 ? ' · ' : ''}
                  </>
                )}
                {stats.remediation > 0 && (
                  <>
                    <strong style={{ color: '#8a6a1f' }}>{stats.remediation}</strong> remediation case{stats.remediation === 1 ? '' : 's'}
                  </>
                )}
                {' '}flagged this {statsRange === 'week' ? 'week' : statsRange === 'month' ? 'month' : 'period'}.
              </span>
              {!issuesOnly && (
                <button onClick={() => setIssuesOnly(true)}
                        style={{ marginLeft: 'auto', color: C.forest, fontSize: 13, fontWeight: 500,
                                 padding: 4, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Show only flagged
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.inkFaint }} />
          <input className="cwr-input" placeholder="Search by faculty, facility, cohort…"
                 value={query} onChange={e => setQuery(e.target.value)}
                 style={{ paddingLeft: 36 }} />
        </div>
        <select className="cwr-input" value={courseFilter}
                onChange={e => setCourseFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 180 }}>
          <option value="">All courses</option>
          {COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="cwr-input" value={programFilter}
                onChange={e => setProgramFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 140 }}>
          <option value="">All programs</option>
          {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
        </select>
        <button onClick={() => setIssuesOnly(v => !v)}
                className={issuesOnly ? 'cwr-btn-primary' : 'cwr-btn-ghost'}>
          <AlertTriangle size={14} /> {issuesOnly ? 'Showing flagged' : 'Flagged only'}
        </button>
      </div>

      {submissions.length === 0 ? (
        <EmptyState icon={<FileText size={32} />}
                    title="No submissions yet"
                    body="When faculty submit weekly reports, they'll show up here." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={32} />}
                    title="No results"
                    body="Try clearing your filters." />
      ) : (
        <>
          <div className="cwr-card cwr-desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="cwr-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Faculty</th>
                  <th>Course</th>
                  <th>Cohort</th>
                  <th>Rotation</th>
                  <th>Issues</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const abs = s.absentStudentIds?.length || 0;
                  const rem = s.remediationStudentIds?.length || 0;
                  const facAbs = s.facultyPresent === 'no';
                  return (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(s)}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{fmtDate(s.submittedAt)}</div>
                        <div style={{ fontSize: 12, color: C.inkFaint }}>
                          {new Date(s.submittedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{s.facultyName}</div>
                        <div style={{ fontSize: 12, color: C.inkFaint }}>{s.facility}</div>
                      </td>
                      <td>
                        <div>{COURSES.find(c => c.id === s.courseId)?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: C.inkFaint }}>{s.program}</div>
                      </td>
                      <td>{cohortMap[s.cohortId] || '—'}</td>
                      <td>{fmtDate(s.rotationDate)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {facAbs && <span className="cwr-chip" style={{ background: C.terra + '22', color: C.terra, borderColor: C.terra + '44' }}>Fac absent</span>}
                          {abs > 0 && <span className="cwr-chip">{abs} absent</span>}
                          {rem > 0 && <span className="cwr-chip" style={{ background: C.amber + '22', color: '#8a6a1f', borderColor: C.amber + '55' }}>{rem} remediation</span>}
                          {!facAbs && abs === 0 && rem === 0 && (
                            <span style={{ fontSize: 12, color: C.inkFaint }}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ChevronRight size={16} color={C.inkFaint} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="cwr-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(s => {
              const abs = s.absentStudentIds?.length || 0;
              const rem = s.remediationStudentIds?.length || 0;
              const facAbs = s.facultyPresent === 'no';
              return (
                <button key={s.id} onClick={() => setDetail(s)} className="cwr-card"
                        style={{ textAlign: 'left', padding: 16, cursor: 'pointer',
                                 display: 'block', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                gap: 10, marginBottom: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>{s.facultyName}</div>
                      <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 2 }}>{s.facility}</div>
                    </div>
                    <ChevronRight size={16} color={C.inkFaint} style={{ flexShrink: 0, marginTop: 3 }} />
                  </div>
                  <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 8 }}>
                    {COURSES.find(c => c.id === s.courseId)?.name || '—'} · {cohortMap[s.cohortId] || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                                fontSize: 12, color: C.inkFaint }}>
                    <Calendar size={12} /> {fmtDate(s.rotationDate)}
                    {(facAbs || abs > 0 || rem > 0) && (
                      <span style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
                        {facAbs && <span className="cwr-chip" style={{ background: C.terra + '22', color: C.terra, borderColor: C.terra + '44' }}>Fac absent</span>}
                        {abs > 0 && <span className="cwr-chip">{abs} absent</span>}
                        {rem > 0 && <span className="cwr-chip" style={{ background: C.amber + '22', color: '#8a6a1f', borderColor: C.amber + '55' }}>{rem} rem.</span>}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SubmissionDetail({ sub, students, cohorts, onBack, onSave, onDelete, readOnly = false, backLabel = 'Back to all submissions' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sub);
  const studentMap = Object.fromEntries(students.map(s => [s.id, s.name]));
  const cohortName = cohorts.find(c => c.id === sub.cohortId)?.name || '—';

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: C.inkFaint, marginBottom: 6 }}>{label}</div>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="cwr-fade-in">
      <button onClick={onBack} className="cwr-btn-ghost cwr-no-print" style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> {backLabel}
      </button>

      <div className="cwr-card">
        {/* Print-only letterhead */}
        <div className="cwr-print-only" style={{
          marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #1e2329',
        }}>
          <img src={LOGO_URL} alt="CDU College of Nursing"
               style={{ height: 56, width: 'auto', objectFit: 'contain', marginBottom: 10 }} />
          <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
                        color: '#555', fontWeight: 600 }}>
            Clinical Weekly Report
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="cwr-display" style={{ fontSize: 26, margin: 0 }}>
              Weekly <span className="cwr-italic">report</span>
            </h2>
            <div style={{ color: C.inkFaint, fontSize: 13, marginTop: 4 }}>
              Submitted {fmtDateTime(sub.submittedAt)} · Ref <span className="cwr-mono">{sub.id.slice(0,8).toUpperCase()}</span>
            </div>
          </div>
          <div className="cwr-no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!editing ? (
              <>
                <button onClick={() => window.print()} className="cwr-btn-ghost">
                  <Printer size={14} /> Print / PDF
                </button>
                {!readOnly && (
                  <>
                    <button onClick={() => { setDraft(sub); setEditing(true); }} className="cwr-btn-ghost">
                      Edit notes
                    </button>
                    <button onClick={onDelete} className="cwr-btn-danger">
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="cwr-btn-ghost">Cancel</button>
                <button onClick={() => { onSave(draft); setEditing(false); }} className="cwr-btn-primary">
                  <Save size={14} /> Save
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 4 }}>
          <Field label="Course">{courseLabel(sub.courseId)}</Field>
          <Field label="Program">{programLabel(sub.program)}</Field>
          <Field label="Cohort">{cohortName}</Field>
          <Field label="Faculty">{sub.facultyName}</Field>
          <Field label="Facility">{sub.facility}</Field>
          <Field label="Rotation date">{fmtDate(sub.rotationDate)}</Field>
        </div>

        <hr className="cwr-divider" />

        <Field label="Faculty present">
          {sub.facultyPresent === 'yes' ? (
            <span style={{ color: C.forest }}>✓ Faculty was present</span>
          ) : (
            <div>
              <div style={{ color: C.terra, fontWeight: 500 }}>Faculty absent</div>
              <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
                Supervisor notified: {sub.supervisorNotified === 'yes' ? 'Yes' : 'Not yet'}
              </div>
            </div>
          )}
        </Field>

        <Field label={`Student absences (${sub.absentStudentIds.length})`}>
          {sub.absentStudentIds.length === 0 ? (
            <div style={{ color: C.inkFaint, fontSize: 14 }}>None reported</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sub.absentStudentIds.map(id => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{studentMap[id] || 'Unknown student'}</span>
                  <span className="cwr-chip" style={{
                    background: sub.absencesNotified?.[id] === 'yes' ? C.forest + '22' : C.rose + '22',
                    color: sub.absencesNotified?.[id] === 'yes' ? C.forest : C.rose,
                    borderColor: 'transparent',
                  }}>
                    {sub.absencesNotified?.[id] === 'yes' ? 'Notified' : 'No call / no show'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {editing ? (
            <textarea className="cwr-input" rows={3} value={draft.absenceNotes || ''}
              onChange={e => setDraft({ ...draft, absenceNotes: e.target.value })}
              placeholder="Notes about absences…"
              style={{ marginTop: 10, resize: 'vertical' }} />
          ) : (
            sub.absenceNotes && (
              <div style={{ marginTop: 10, padding: 12, background: C.paper, borderRadius: 8,
                            fontSize: 14, color: C.inkSoft, whiteSpace: 'pre-wrap' }}>
                {sub.absenceNotes}
              </div>
            )
          )}
        </Field>

        <Field label={`Remediation (${(sub.remediationStudentIds || []).length})`}>
          {!sub.remediationStudentIds || sub.remediationStudentIds.length === 0 ? (
            <div style={{ color: C.inkFaint, fontSize: 14 }}>None reported</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sub.remediationStudentIds.map(id => {
                const noteVal = (editing ? draft : sub).remediationNotesByStudent?.[id] || '';
                return (
                  <div key={id} className="cwr-print-keep" style={{ padding: 12, background: C.paper, borderRadius: 8,
                                          borderLeft: `3px solid ${C.amber}` }}>
                    <div style={{ fontWeight: 500, marginBottom: noteVal || editing ? 6 : 0 }}>
                      {studentMap[id] || 'Unknown student'}
                    </div>
                    {editing ? (
                      <textarea className="cwr-input" rows={2} value={noteVal}
                        onChange={e => setDraft({
                          ...draft,
                          remediationNotesByStudent: {
                            ...(draft.remediationNotesByStudent || {}),
                            [id]: e.target.value
                          }
                        })}
                        placeholder="Notes for this student…"
                        style={{ resize: 'vertical', fontSize: 14, background: C.white }} />
                    ) : (
                      noteVal && (
                        <div style={{ fontSize: 14, color: C.inkSoft, whiteSpace: 'pre-wrap' }}>
                          {noteVal}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {editing ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: C.inkFaint, marginBottom: 6 }}>
                Additional cohort-wide notes
              </div>
              <textarea className="cwr-input" rows={3} value={draft.remediationNotes || ''}
                onChange={e => setDraft({ ...draft, remediationNotes: e.target.value })}
                placeholder="General remediation notes…"
                style={{ resize: 'vertical' }} />
            </div>
          ) : (
            sub.remediationNotes && (
              <div style={{ marginTop: 10, padding: 12, background: C.paper, borderRadius: 8,
                            fontSize: 14, color: C.inkSoft, whiteSpace: 'pre-wrap' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: C.inkFaint, marginBottom: 4 }}>
                  Additional notes
                </div>
                {sub.remediationNotes}
              </div>
            )
          )}
        </Field>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Rosters panel
// ──────────────────────────────────────────────────────────────────────────────
function RostersPanel({ cohorts, students, setRoster, showToast }) {
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newCohort, setNewCohort] = useState({ name: '', program: 'BSN' });

  const selected = cohorts.find(c => c.id === selectedId);
  const cohortStudents = students.filter(s => s.cohortId === selectedId).sort((a, b) => a.name.localeCompare(b.name));

  const addCohort = async () => {
    if (!newCohort.name.trim()) return;
    const c = { id: uid(), name: newCohort.name.trim(), program: newCohort.program, createdAt: new Date().toISOString() };
    await setRoster([...cohorts, c], students);
    setNewCohort({ name: '', program: 'BSN' });
    setCreating(false);
    setSelectedId(c.id);
    showToast('Cohort created');
  };

  const deleteCohort = async (id) => {
    const count = students.filter(s => s.cohortId === id).length;
    if (!confirm(`Delete this cohort and its ${count} student${count === 1 ? '' : 's'}? This cannot be undone.`)) return;
    await setRoster(cohorts.filter(c => c.id !== id), students.filter(s => s.cohortId !== id));
    if (selectedId === id) setSelectedId(null);
    showToast('Cohort deleted');
  };

  return (
    <div className="cwr-fade-in" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'flex-start' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 className="cwr-display" style={{ fontSize: 20, margin: 0 }}>Cohorts</h2>
          <button onClick={() => setCreating(true)} className="cwr-btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }}>
            <Plus size={14} /> New
          </button>
        </div>

        {creating && (
          <div className="cwr-card cwr-fade-in" style={{ padding: 16, marginBottom: 12 }}>
            <input className="cwr-input" placeholder="Cohort name (e.g. BSN Fall 2026)"
                   value={newCohort.name} autoFocus
                   onChange={e => setNewCohort({ ...newCohort, name: e.target.value })}
                   onKeyDown={e => e.key === 'Enter' && addCohort()} />
            <select className="cwr-input" value={newCohort.program}
                    onChange={e => setNewCohort({ ...newCohort, program: e.target.value })}
                    style={{ marginTop: 8 }}>
              {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={addCohort} className="cwr-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Create
              </button>
              <button onClick={() => { setCreating(false); setNewCohort({ name: '', program: 'BSN' }); }} className="cwr-btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}

        {cohorts.length === 0 && !creating ? (
          <EmptyState small icon={<Users size={24} />} title="No cohorts yet"
                      body="Create your first cohort to start adding students." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cohorts.map(c => {
              const n = students.filter(s => s.cohortId === c.id).length;
              const active = c.id === selectedId;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                        style={{
                          padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                          background: active ? C.ink : C.white,
                          color: active ? C.paper : C.ink,
                          border: `1px solid ${active ? C.ink : C.line}`,
                          transition: 'all .12s',
                        }}>
                  <div style={{ fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: active ? C.paper + 'aa' : C.inkFaint, marginTop: 3 }}>
                    {c.program} · {n} student{n === 1 ? '' : 's'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        {!selected ? (
          <EmptyState icon={<UserPlus size={32} />}
                      title="Select a cohort"
                      body="Pick a cohort on the left to view and manage its roster — or create a new one." />
        ) : (
          <RosterEditor cohort={selected} students={cohortStudents}
                        allStudents={students} cohorts={cohorts} setRoster={setRoster}
                        onDeleteCohort={() => deleteCohort(selected.id)}
                        showToast={showToast} />
        )}
      </div>
    </div>
  );
}

function RosterEditor({ cohort, students: cohortStudents, allStudents, cohorts, setRoster, onDeleteCohort, showToast }) {
  const [adding, setAdding] = useState('');
  const [bulk, setBulk] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const add = async () => {
    const name = adding.trim();
    if (!name) return;
    const s = { id: uid(), cohortId: cohort.id, name };
    await setRoster(cohorts, [...allStudents, s]);
    setAdding('');
    showToast('Student added');
  };

  const addBulk = async () => {
    const names = bulk.split(/\n+/).map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    const newStudents = names.map(name => ({ id: uid(), cohortId: cohort.id, name }));
    await setRoster(cohorts, [...allStudents, ...newStudents]);
    setBulk('');
    setBulkOpen(false);
    showToast(`Added ${names.length} student${names.length === 1 ? '' : 's'}`);
  };

  const removeStudent = async (id) => {
    if (!confirm('Remove this student from the cohort?')) return;
    await setRoster(cohorts, allStudents.filter(s => s.id !== id));
    showToast('Student removed');
  };

  const renameStudent = async (id, newName) => {
    if (!newName.trim()) return;
    await setRoster(cohorts, allStudents.map(s => s.id === id ? { ...s, name: newName.trim() } : s));
  };

  return (
    <div className="cwr-fade-in">
      <div className="cwr-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 className="cwr-display" style={{ fontSize: 24, margin: 0 }}>{cohort.name}</h2>
            <div style={{ color: C.inkFaint, fontSize: 13, marginTop: 4 }}>
              {programLabel(cohort.program)} · {cohortStudents.length} student{cohortStudents.length === 1 ? '' : 's'}
            </div>
          </div>
          <button onClick={onDeleteCohort} className="cwr-btn-danger">
            <Trash2 size={14} /> Delete cohort
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="cwr-input" placeholder="Add a student (first and last name)"
                 value={adding} onChange={e => setAdding(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} disabled={!adding.trim()} className="cwr-btn-primary">
            <UserPlus size={16} /> Add
          </button>
          <button onClick={() => setBulkOpen(o => !o)} className="cwr-btn-ghost">
            Bulk add
          </button>
        </div>

        {bulkOpen && (
          <div className="cwr-fade-in" style={{ marginBottom: 16, padding: 14, background: C.paper, borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 8 }}>
              Paste one student per line:
            </div>
            <textarea className="cwr-input" rows={5}
              value={bulk} onChange={e => setBulk(e.target.value)}
              placeholder={'Jane Doe\nJohn Smith\nMaria Garcia'}
              style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={addBulk} disabled={!bulk.trim()} className="cwr-btn-primary">
                Add all
              </button>
              <button onClick={() => { setBulk(''); setBulkOpen(false); }} className="cwr-btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}

        {cohortStudents.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: C.inkFaint, fontStyle: 'italic',
                        background: C.paper, borderRadius: 10 }}>
            No students yet. Add students above to build the roster.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cohortStudents.map((s, i) => (
              <StudentRow key={s.id} student={s} index={i + 1}
                          onRename={(n) => renameStudent(s.id, n)}
                          onRemove={() => removeStudent(s.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentRow({ student, index, onRename, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: C.paper, borderRadius: 8 }}>
      <span style={{ color: C.inkFaint, fontSize: 13, minWidth: 24, textAlign: 'right' }} className="cwr-mono">
        {String(index).padStart(2, '0')}
      </span>
      {editing ? (
        <input className="cwr-input" value={name} autoFocus
               onChange={e => setName(e.target.value)}
               onBlur={() => { onRename(name); setEditing(false); }}
               onKeyDown={e => { if (e.key === 'Enter') { onRename(name); setEditing(false); }
                                 if (e.key === 'Escape') { setName(student.name); setEditing(false); } }}
               style={{ flex: 1, padding: '6px 10px' }} />
      ) : (
        <span style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditing(true)}>
          {student.name}
        </span>
      )}
      <button onClick={onRemove} style={{ color: C.inkFaint, padding: 6, borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = C.rose}
              onMouseLeave={e => e.currentTarget.style.color = C.inkFaint}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Settings panel
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// Faculty accounts panel
// ──────────────────────────────────────────────────────────────────────────────
function FacultyAccountsPanel({ accounts, setAccounts, submissions, showToast }) {
  const [query, setQuery] = useState('');
  const [showDisabled, setShowDisabled] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [tempPwd, setTempPwd] = useState('');
  const [busy, setBusy] = useState(false);

  const submissionCount = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      if (s.accountId) map[s.accountId] = (map[s.accountId] || 0) + 1;
    });
    return map;
  }, [submissions]);

  // Surface pending reset requests first
  const filtered = accounts
    .filter(a => showDisabled || !a.disabled)
    .filter(a => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (a.name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      // Pending resets first
      if (!!b.resetRequestedAt !== !!a.resetRequestedAt) return b.resetRequestedAt ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

  const pendingResetCount = accounts.filter(a => a.resetRequestedAt && !a.disabled).length;

  const toggleDisabled = async (id) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    if (!acc.disabled && !confirm(`Disable ${acc.name}? They will no longer be able to sign in until you re-enable.`)) return;
    await setAccounts(accounts.map(a => a.id === id ? { ...a, disabled: !a.disabled } : a));
    showToast(acc.disabled ? 'Account re-enabled' : 'Account disabled');
  };

  const remove = async (id) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    if (!confirm(`Delete the account for ${acc.name}? Their past submissions will remain, but they will need to register again to log in. This cannot be undone.`)) return;
    await setAccounts(accounts.filter(a => a.id !== id));
    showToast('Account deleted');
  };

  const startReset = (id) => {
    setResettingId(id);
    setTempPwd(genTempPassword());
  };

  const cancelReset = () => {
    setResettingId(null);
    setTempPwd('');
  };

  const saveReset = async () => {
    const acc = accounts.find(a => a.id === resettingId);
    if (!acc || !tempPwd.trim()) return;
    if (tempPwd.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setBusy(true);
    try {
      const hash = await hashPassword(tempPwd);
      const updated = { ...acc, passwordHash: hash };
      delete updated.resetRequestedAt;
      await setAccounts(accounts.map(a => a.id === acc.id ? updated : a));
      showToast(`Password reset for ${acc.name}. Share the temp password with them.`);
      // Keep the panel open so admin can copy the password
    } finally {
      setBusy(false);
    }
  };

  const copyTempPwd = () => {
    try {
      navigator.clipboard.writeText(tempPwd);
      showToast('Copied to clipboard');
    } catch {
      showToast('Could not copy — please select and copy manually', 'error');
    }
  };

  return (
    <div className="cwr-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 className="cwr-display" style={{ fontSize: 28, margin: 0 }}>
          Faculty <span className="cwr-italic">accounts</span>
        </h2>
        <p style={{ color: C.inkSoft, fontSize: 13, marginTop: 6 }}>
          {accounts.length} account{accounts.length === 1 ? '' : 's'} registered.
          Faculty self-register using the registration code in Settings.
        </p>
      </div>

      {pendingResetCount > 0 && (
        <div style={{
          marginBottom: 16, padding: '10px 14px',
          background: C.amber + '15', border: `1px solid ${C.amber}44`,
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: C.inkSoft,
        }}>
          <AlertTriangle size={14} color={C.amber} />
          <span>
            <strong style={{ color: '#8a6a1f' }}>{pendingResetCount}</strong> password reset
            {pendingResetCount === 1 ? '' : 's'} requested. Click <strong>Reset password</strong> on
            highlighted accounts below to issue a temporary password.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.inkFaint }} />
          <input className="cwr-input" placeholder="Search by name or email…"
                 value={query} onChange={e => setQuery(e.target.value)}
                 style={{ paddingLeft: 36 }} />
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 14px',
                        border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={showDisabled}
                 onChange={e => setShowDisabled(e.target.checked)}
                 style={{ accentColor: C.forest }} />
          Show disabled
        </label>
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon={<GraduationCap size={32} />}
                    title="No accounts yet"
                    body="Share your faculty registration code (in Settings) so clinical instructors can create their own accounts." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={32} />} title="No matches"
                    body="Try a different search or toggle 'Show disabled'." />
      ) : (
        <div className="cwr-card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((a, i) => {
            const pending = !!a.resetRequestedAt;
            const isResetting = resettingId === a.id;
            return (
              <div key={a.id} style={{
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.lineSoft}` : 'none',
                background: pending ? C.amber + '10' : 'transparent',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                  opacity: a.disabled ? 0.55 : 1, flexWrap: 'wrap',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 999, background: C.paperAlt,
                    color: C.inkSoft, display: 'grid', placeItems: 'center',
                    fontWeight: 600, fontSize: 14, flexShrink: 0,
                  }}>
                    {a.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {a.name}
                      {a.disabled && <span className="cwr-chip" style={{
                        background: C.rose + '22', color: C.rose, borderColor: 'transparent',
                      }}>Disabled</span>}
                      {pending && <span className="cwr-chip" style={{
                        background: C.amber + '22', color: '#8a6a1f', borderColor: C.amber + '55',
                      }}>Reset requested · {fmtRelative(a.resetRequestedAt)}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.inkFaint,
                                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
                                  overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Mail size={12} /> {a.email}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.inkFaint, textAlign: 'right', flexShrink: 0 }}>
                    {submissionCount[a.id] || 0} report{submissionCount[a.id] === 1 ? '' : 's'}
                    <div style={{ marginTop: 2 }}>Joined {fmtDate(a.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button onClick={() => startReset(a.id)}
                            className={pending ? 'cwr-btn-primary' : 'cwr-btn-ghost'}
                            style={{ padding: '6px 10px', fontSize: 13 }}>
                      <KeyRound size={13} /> Reset password
                    </button>
                    <button onClick={() => toggleDisabled(a.id)} className="cwr-btn-ghost"
                            style={{ padding: '6px 10px', fontSize: 13 }}>
                      <UserX size={13} /> {a.disabled ? 'Enable' : 'Disable'}
                    </button>
                    <button onClick={() => remove(a.id)} className="cwr-btn-danger"
                            style={{ padding: '6px 10px', fontSize: 13 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {isResetting && (
                  <div className="cwr-fade-in" style={{
                    padding: '14px 18px 18px', background: C.paperAlt,
                    borderTop: `1px solid ${C.line}`,
                  }}>
                    <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 10 }}>
                      Set a temporary password for <strong>{a.name}</strong>. Share it with them
                      securely (Slack, phone, in person) — not over email. They can change it after
                      signing in.
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <input className="cwr-input"
                             value={tempPwd}
                             onChange={e => setTempPwd(e.target.value)}
                             onKeyDown={e => { if (e.key === 'Enter') saveReset(); }}
                             style={{ flex: 1, minWidth: 200, fontFamily: 'ui-monospace, monospace' }} />
                      <button onClick={() => setTempPwd(genTempPassword())} className="cwr-btn-ghost"
                              style={{ padding: '9px 12px', fontSize: 13 }}>
                        <RefreshCw size={13} /> New
                      </button>
                      <button onClick={copyTempPwd} className="cwr-btn-ghost"
                              style={{ padding: '9px 12px', fontSize: 13 }}>
                        <ClipboardList size={13} /> Copy
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                      <button onClick={cancelReset} className="cwr-btn-ghost">
                        Cancel
                      </button>
                      <button onClick={saveReset} disabled={busy || !tempPwd.trim()}
                              className="cwr-btn-primary">
                        <Save size={14} /> Save & apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Generate a memorable temporary password like "Pencil-Coffee-47"
function genTempPassword() {
  const words = ['Pencil', 'Lemon', 'Coffee', 'Anchor', 'River', 'Pine', 'Velvet',
                 'Marble', 'Cobalt', 'Saffron', 'Cedar', 'Ember', 'Quartz', 'Linen',
                 'Harbor', 'Maple', 'Citron', 'Onyx', 'Slate', 'Willow'];
  const w1 = words[Math.floor(Math.random() * words.length)];
  let w2 = words[Math.floor(Math.random() * words.length)];
  while (w2 === w1) w2 = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(Math.random() * 90) + 10;
  return `${w1}-${w2}-${n}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Facilities panel
// ──────────────────────────────────────────────────────────────────────────────
function FacilitiesPanel({ facilities, setFacilities, showToast }) {
  const [adding, setAdding] = useState('');
  const [bulk, setBulk] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const add = async () => {
    const name = adding.trim();
    if (!name) return;
    if (facilities.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      showToast('That facility is already in the list', 'error');
      return;
    }
    await setFacilities([...facilities, { id: uid(), name }]);
    setAdding('');
    showToast('Facility added');
  };

  const addBulk = async () => {
    const lines = bulk.split(/\n+/).map(n => n.trim()).filter(Boolean);
    const seen = new Set(facilities.map(f => f.name.toLowerCase()));
    const fresh = [];
    lines.forEach(n => {
      const key = n.toLowerCase();
      if (!seen.has(key)) { seen.add(key); fresh.push({ id: uid(), name: n }); }
    });
    if (fresh.length === 0) { showToast('Nothing new to add', 'error'); return; }
    await setFacilities([...facilities, ...fresh]);
    setBulk(''); setBulkOpen(false);
    showToast(`Added ${fresh.length} facilit${fresh.length === 1 ? 'y' : 'ies'}`);
  };

  const remove = async (id) => {
    if (!confirm('Remove this facility from the dropdown?')) return;
    await setFacilities(facilities.filter(f => f.id !== id));
    showToast('Facility removed');
  };

  const sorted = [...facilities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="cwr-fade-in" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 className="cwr-display" style={{ fontSize: 28, margin: 0 }}>
          Clinical <span className="cwr-italic">facilities</span>
        </h2>
        <p style={{ color: C.inkSoft, fontSize: 13, marginTop: 6 }}>
          Maintain a master list of facilities. Faculty will pick from this dropdown when submitting
          reports, which eliminates typos like "St. Frances" vs "St. Francis".
        </p>
      </div>

      <div className="cwr-card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="cwr-input" placeholder="Add a facility (e.g. St. Francis Medical Center)"
                 value={adding} onChange={e => setAdding(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} disabled={!adding.trim()} className="cwr-btn-primary">
            <Plus size={16} /> Add
          </button>
          <button onClick={() => setBulkOpen(o => !o)} className="cwr-btn-ghost">
            Bulk add
          </button>
        </div>

        {bulkOpen && (
          <div className="cwr-fade-in" style={{ marginBottom: 16, padding: 14, background: C.paperAlt, borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 8 }}>
              Paste one facility per line:
            </div>
            <textarea className="cwr-input" rows={5}
              value={bulk} onChange={e => setBulk(e.target.value)}
              placeholder={'St. Francis Medical Center\nCedars-Sinai\nKaiser Sunset\nMLK Community Hospital'}
              style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={addBulk} disabled={!bulk.trim()} className="cwr-btn-primary">
                Add all
              </button>
              <button onClick={() => { setBulk(''); setBulkOpen(false); }} className="cwr-btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        )}

        {sorted.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: C.inkFaint, fontStyle: 'italic',
                        background: C.paperAlt, borderRadius: 10 }}>
            No facilities yet. Add some above to enable the dropdown picker for faculty.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sorted.map((f, i) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                                       padding: '10px 14px', background: C.paperAlt, borderRadius: 8 }}>
                <Building size={14} color={C.inkFaint} />
                <span style={{ flex: 1 }}>{f.name}</span>
                <button onClick={() => remove(f.id)}
                        style={{ color: C.inkFaint, padding: 6, borderRadius: 6 }}
                        onMouseEnter={e => e.currentTarget.style.color = C.rose}
                        onMouseLeave={e => e.currentTarget.style.color = C.inkFaint}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Settings panel
// ──────────────────────────────────────────────────────────────────────────────
function SettingsPanel({ config, setConfig, showToast }) {
  const [adminPwd, setAdminPwd] = useState(config.adminPassword);
  const [facultyPwd, setFacultyPwd] = useState(config.facultyPassword);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFac, setShowFac] = useState(false);

  const saveAdmin = async () => {
    if (!adminPwd) { showToast('Password cannot be empty', 'error'); return; }
    await setConfig({ ...config, adminPassword: adminPwd });
    showToast('Admin password updated');
  };
  const saveFaculty = async () => {
    if (!facultyPwd) { showToast('Code cannot be empty', 'error'); return; }
    await setConfig({ ...config, facultyPassword: facultyPwd });
    showToast('Registration code updated');
  };

  return (
    <div className="cwr-fade-in" style={{ maxWidth: 640 }}>
      <h2 className="cwr-display" style={{ fontSize: 28, margin: 0, marginBottom: 6 }}>
        Access <span className="cwr-italic">settings</span>
      </h2>
      <p style={{ color: C.inkSoft, fontSize: 14, marginBottom: 24 }}>
        Manage the credentials used to access the portal. Faculty create their own accounts using
        the registration code below.
      </p>

      <div className="cwr-card" style={{ marginBottom: 16 }}>
        <h3 className="cwr-display" style={{ fontSize: 18, margin: 0, marginBottom: 4 }}>Faculty registration code</h3>
        <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 14 }}>
          Share this with clinical instructors so they can create their own account on first visit.
          You can rotate it at any time — existing accounts keep working; only future registrations are affected.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input className="cwr-input" type={showFac ? 'text' : 'password'}
                   value={facultyPwd} onChange={e => setFacultyPwd(e.target.value)}
                   style={{ paddingRight: 40 }} />
            <button onClick={() => setShowFac(s => !s)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                             padding: 8, color: C.inkFaint }}>
              {showFac ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button onClick={saveFaculty} disabled={facultyPwd === config.facultyPassword} className="cwr-btn-primary">
            <Save size={15} /> Update
          </button>
        </div>
      </div>

      <div className="cwr-card" style={{ marginBottom: 16 }}>
        <h3 className="cwr-display" style={{ fontSize: 18, margin: 0, marginBottom: 4 }}>Administrator password</h3>
        <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 14 }}>
          For program directors managing rosters and submissions. Keep this private.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input className="cwr-input" type={showAdmin ? 'text' : 'password'}
                   value={adminPwd} onChange={e => setAdminPwd(e.target.value)}
                   style={{ paddingRight: 40 }} />
            <button onClick={() => setShowAdmin(s => !s)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                             padding: 8, color: C.inkFaint }}>
              {showAdmin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button onClick={saveAdmin} disabled={adminPwd === config.adminPassword} className="cwr-btn-primary">
            <Save size={15} /> Update
          </button>
        </div>
      </div>

      <div style={{ padding: 16, background: C.amber + '15', border: `1px solid ${C.amber}44`,
                    borderRadius: 10, fontSize: 13, color: C.inkSoft }}>
        <strong style={{ color: C.ink }}>Default credentials:</strong> Admin password
        is <span className="cwr-mono">{DEFAULTS.adminPassword}</span>; the default faculty registration
        code is <span className="cwr-mono">{DEFAULTS.facultyPassword}</span>. Change both before sharing
        the link with clinical instructors.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Empty state
// ──────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, bg }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10,
      background: bg || C.white,
      border: `1px solid ${C.line}`,
    }}>
      <div className="cwr-display" style={{
        fontSize: 30, lineHeight: 1, color: accent || C.ink, fontWeight: 500,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: C.inkFaint, marginTop: 6,
      }}>
        {label}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, body, small }) {
  return (
    <div style={{ textAlign: 'center', padding: small ? 24 : 60, color: C.inkFaint,
                  background: C.white, border: `1px dashed ${C.line}`, borderRadius: 12 }}>
      <div style={{ display: 'inline-flex', padding: small ? 10 : 14, borderRadius: 12,
                    background: C.paperAlt, color: C.inkSoft, marginBottom: 12 }}>
        {icon}
      </div>
      <div className="cwr-display" style={{ fontSize: small ? 15 : 18, color: C.ink, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>{body}</div>
    </div>
  );
}
