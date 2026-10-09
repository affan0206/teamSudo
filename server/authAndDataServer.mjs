import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createInitialSyntheticDataset,
  DEFAULT_RISK_THRESHOLDS,
} from './initialSeedState.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACCOUNTS_PATH = path.join(__dirname, 'provisionedAccounts.json');
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'academic-insight-data')
  : path.join(__dirname, '.data');
const STORE_PATH = path.join(DATA_DIR, 'cohort_store.json');
const SECRET_PATH = path.join(DATA_DIR, 'session_secret.txt');

const FALLBACK_PROVISIONED_ACCOUNTS = [
  {
    id: 'usr-fac-001',
    email: 'aris.thorne@demo.university.edu',
    fullName: 'Dr. Aris Thorne',
    role: 'FACULTY',
    studentId: null,
    department: 'Computer Science & Engineering',
    assignedTitle: 'Faculty Advisor & Academic Coordinator',
    passwordSalt: 'd423fc9c2ff89c7329b146d003735791',
    passwordHash:
      '57b9bdce96f46ef2ac4b4e0164f9f155ac65258e69bdc537e01d24f6830aa83472524f8657d25c4a9002467e210608bd709d44b7fa2ab598d807f6163c594c89',
  },
  {
    id: 'usr-stu-001',
    email: 'aarav.mehta@demo.university.edu',
    fullName: 'Aarav Mehta',
    role: 'STUDENT',
    studentId: 'stu-001',
    department: 'Computer Science & Engineering',
    assignedTitle: 'B.Tech CSE · Semester 4 (CS2024-001)',
    passwordSalt: '485955eb200f2aed819779e0dcb99742',
    passwordHash:
      '026be9464fe5e25ef303e1f48210acb784d5a202e6a3c94c451172684d142e718ee3355e5982f93e7ec7c1d85eded69a1f47d655c11d82f6f1b20f3faa28723c',
  },
  {
    id: 'usr-stu-007',
    email: 'rohan.deshmukh@demo.university.edu',
    fullName: 'Rohan Deshmukh',
    role: 'STUDENT',
    studentId: 'stu-007',
    department: 'Computer Science & Engineering',
    assignedTitle: 'B.Tech CSE · Semester 4 (CS2024-007)',
    passwordSalt: '9633f505962b7c822619062e8fdc070e',
    passwordHash:
      'c3f0aad2197d19b463c79dba8f9846a5aa7317da237a394c022a81073dae715f3b6f332846e08e0f24c969defb0f23b104499b78c8ce27dae74e0dea4057e28c',
  },
  {
    id: 'usr-stu-015',
    email: 'priya.sundaram@demo.university.edu',
    fullName: 'Priya Sundaram',
    role: 'STUDENT',
    studentId: 'stu-015',
    department: 'Computer Science & Engineering',
    assignedTitle: 'B.Tech CSE · Semester 4 (CS2024-015)',
    passwordSalt: 'adb163db16a21aae33875312c04bdb52',
    passwordHash:
      '436534c7f5f87f098c7730c5ac3f021ee2106ef883dc486eb0cb8825a50ea05f63633fe4ebe10d77bbcc4e1262ec1fa677bc09a2767951b435a83735d350f8d7',
  },
];

let memoryStateFallback = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore on read-only serverless fs
  }
}

function getServerSigningSecret() {
  if (process.env.ACADEMIC_INSIGHT_SESSION_SECRET) {
    return process.env.ACADEMIC_INSIGHT_SESSION_SECRET;
  }
  if (process.env.VERCEL) {
    return 'academic-insight-vercel-hmac-secret-2026-cse';
  }
  ensureDataDir();
  try {
    if (fs.existsSync(SECRET_PATH)) {
      const existing = fs.readFileSync(SECRET_PATH, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_PATH, generated, 'utf8');
    return generated;
  } catch {
    return 'academic-insight-fallback-hmac-secret-2026-cse';
  }
}

const SESSION_SECRET = getServerSigningSecret();
const revokedTokenIds = new Set();

function loadProvisionedAccounts() {
  try {
    if (fs.existsSync(ACCOUNTS_PATH)) {
      const raw = fs.readFileSync(ACCOUNTS_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // Use fallback accounts
  }
  return FALLBACK_PROVISIONED_ACCOUNTS;
}

function loadServerState() {
  ensureDataDir();
  try {
    if (fs.existsSync(STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
      if (
        parsed &&
        parsed.dataset &&
        Array.isArray(parsed.dataset.students) &&
        parsed.thresholds
      ) {
        memoryStateFallback = parsed;
        return parsed;
      }
    }
  } catch {
    // Re-seed if corrupted or unavailable
  }
  if (memoryStateFallback) {
    return memoryStateFallback;
  }
  const initial = {
    dataset: createInitialSyntheticDataset(),
    thresholds: { ...DEFAULT_RISK_THRESHOLDS },
  };
  saveServerState(initial);
  return initial;
}

function saveServerState(state) {
  memoryStateFallback = state;
  ensureDataDir();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Ignore write errors in read-only environments; memoryStateFallback holds state
  }
}

function toPublicUserProfile(account) {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    studentId: account.role === 'STUDENT' ? account.studentId : null,
    department: account.department,
    assignedTitle: account.assignedTitle,
  };
}

function signSessionToken(account) {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    jti: crypto.randomUUID(),
    sub: account.id,
    iat: nowSec,
    exp: nowSec + 60 * 60 * 12, // 12 hours
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sigB64}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Authentication required. Please sign in.',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Invalid session token format.',
    };
  }

  const [payloadB64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBufA = Buffer.from(providedSig);
  const sigBufB = Buffer.from(expectedSig);
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Session signature verification failed.',
    };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Malformed session payload.',
    };
  }

  if (!payload.jti || revokedTokenIds.has(payload.jti)) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Session has been signed out or revoked.',
    };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < nowSec) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Session expired. Please sign in again.',
    };
  }

  // Resolve user identity and role strictly from server-controlled account table
  const accounts = loadProvisionedAccounts();
  const account = accounts.find((a) => a.id === payload.sub);
  if (!account) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Account no longer exists.',
    };
  }

  return {
    status: 200,
    authenticated: true,
    user: toPublicUserProfile(account),
    token,
  };
}

export function authenticateUserCredentials(email, password) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const rawPassword = String(password ?? '');

  if (!normalizedEmail || !rawPassword) {
    return {
      status: 400,
      authenticated: false,
      user: null,
      error: 'Email and password are required.',
    };
  }

  const accounts = loadProvisionedAccounts();
  const account = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

  if (!account) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Invalid email or password.',
    };
  }

  const computedHash = crypto.scryptSync(rawPassword, account.passwordSalt, 64);
  const storedHash = Buffer.from(account.passwordHash, 'hex');

  if (
    computedHash.length !== storedHash.length ||
    !crypto.timingSafeEqual(computedHash, storedHash)
  ) {
    return {
      status: 401,
      authenticated: false,
      user: null,
      error: 'Invalid email or password.',
    };
  }

  const token = signSessionToken(account);
  return {
    status: 200,
    authenticated: true,
    user: toPublicUserProfile(account),
    token,
  };
}

export function revokeSessionToken(token) {
  if (token && typeof token === 'string' && token.includes('.')) {
    try {
      const [payloadB64] = token.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      if (payload?.jti) {
        revokedTokenIds.add(payload.jti);
      }
    } catch {
      // Ignore malformed token on logout
    }
  }
  return { status: 200, revoked: true };
}

export function requestPasswordResetNotice(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return {
      status: 400,
      message: '',
      error: 'Please enter a valid institutional email address.',
    };
  }
  return {
    status: 200,
    message:
      'If an authorized account matches this institutional email, password reset instructions have been queued.',
  };
}

/**
 * Enforces database/server-level Row Level Security:
 * - Unauthenticated requests are rejected with 401.
 * - STUDENT role can ONLY access their own single student record, scores, attendance, and interventions.
 *   If a student attempts to request another studentId, it is rejected with 403 Forbidden.
 * - FACULTY role receives the authorized cohort dataset.
 */
export function getAuthorizedDatasetForSession(token, requestedStudentIdOverride = null) {
  const auth = verifySessionToken(token);
  if (!auth.authenticated || !auth.user) {
    return { status: 401, error: auth.error || 'Authentication required.' };
  }

  const state = loadServerState();
  const { dataset, thresholds } = state;

  if (auth.user.role === 'STUDENT') {
    const ownStudentId = auth.user.studentId;
    if (!ownStudentId) {
      return {
        status: 403,
        error: 'Student profile is not bound to an active enrollment record.',
      };
    }

    if (
      requestedStudentIdOverride &&
      requestedStudentIdOverride !== ownStudentId
    ) {
      return {
        status: 403,
        error: 'Forbidden: Students cannot access another student’s academic records.',
      };
    }

    const scopedDataset = {
      students: dataset.students.filter((s) => s.id === ownStudentId),
      subjects: dataset.subjects,
      assessments: dataset.assessments,
      scores: dataset.scores.filter((s) => s.studentId === ownStudentId),
      attendance: dataset.attendance.filter((a) => a.studentId === ownStudentId),
      interventions: dataset.interventions.filter((i) => i.studentId === ownStudentId),
    };

    return {
      status: 200,
      user: auth.user,
      dataset: scopedDataset,
      thresholds,
    };
  }

  // FACULTY role
  return {
    status: 200,
    user: auth.user,
    dataset,
    thresholds,
  };
}

function requireFacultySession(token) {
  const auth = verifySessionToken(token);
  if (!auth.authenticated || !auth.user) {
    return { ok: false, status: 401, error: auth.error || 'Authentication required.' };
  }
  if (auth.user.role !== 'FACULTY') {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: Faculty authorization is required for this action.',
    };
  }
  return { ok: true, user: auth.user };
}

export function serverUpsertAssessmentScore(token, input) {
  const guard = requireFacultySession(token);
  if (!guard.ok) return { status: guard.status, error: guard.error };

  const state = loadServerState();
  const { dataset } = state;
  const { studentId, assessmentId, marksObtained, status } = input;

  const assessment = dataset.assessments.find((a) => a.id === assessmentId);
  if (!assessment) {
    return { status: 400, error: 'Selected assessment does not exist.' };
  }

  if (marksObtained !== null && marksObtained !== undefined) {
    const num = Number(marksObtained);
    if (Number.isNaN(num) || num < 0) {
      return { status: 400, error: 'Marks obtained cannot be negative.' };
    }
    if (num > assessment.maxMarks) {
      return {
        status: 400,
        error: `Marks (${num}) cannot exceed maximum marks (${assessment.maxMarks}) for ${assessment.title}.`,
      };
    }
  }

  const now = new Date().toISOString();
  const nextScores = [...dataset.scores];
  const existingIdx = nextScores.findIndex(
    (s) => s.studentId === studentId && s.assessmentId === assessmentId
  );

  const normalizedMarks =
    marksObtained === null || marksObtained === undefined
      ? null
      : Math.round(Number(marksObtained) * 100) / 100;

  const updatedRecord = {
    id: existingIdx >= 0 ? nextScores[existingIdx].id : `scr-${studentId}-${assessmentId}`,
    studentId,
    assessmentId,
    marksObtained: normalizedMarks,
    status:
      normalizedMarks === null
        ? status === 'EXCUSED'
          ? 'EXCUSED'
          : 'MISSING'
        : 'GRADED',
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    nextScores[existingIdx] = updatedRecord;
  } else {
    nextScores.push(updatedRecord);
  }

  const nextDataset = { ...dataset, scores: nextScores };
  saveServerState({ ...state, dataset: nextDataset });

  return {
    status: 200,
    user: guard.user,
    dataset: nextDataset,
    thresholds: state.thresholds,
  };
}

export function serverUpsertAttendanceRecord(token, input) {
  const guard = requireFacultySession(token);
  if (!guard.ok) return { status: guard.status, error: guard.error };

  const { studentId, subjectId, classesAttended, classesHeld } = input;
  const attNum = Number(classesAttended);
  const heldNum = Number(classesHeld);

  if (!Number.isInteger(attNum) || !Number.isInteger(heldNum)) {
    return {
      status: 400,
      error: 'Classes attended and classes held must be whole integers.',
    };
  }
  if (attNum < 0 || heldNum <= 0) {
    return {
      status: 400,
      error: 'Classes attended must be >= 0 and classes held must be > 0.',
    };
  }
  if (attNum > heldNum) {
    return {
      status: 400,
      error: `Classes attended (${attNum}) cannot exceed classes held (${heldNum}).`,
    };
  }

  const state = loadServerState();
  const { dataset } = state;
  const now = new Date().toISOString();
  const nextAttendance = [...dataset.attendance];
  const existingIdx = nextAttendance.findIndex(
    (a) => a.studentId === studentId && a.subjectId === subjectId
  );

  const updatedRecord = {
    id: existingIdx >= 0 ? nextAttendance[existingIdx].id : `att-${studentId}-${subjectId}`,
    studentId,
    subjectId,
    classesAttended: attNum,
    classesHeld: heldNum,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    nextAttendance[existingIdx] = updatedRecord;
  } else {
    nextAttendance.push(updatedRecord);
  }

  const nextDataset = { ...dataset, attendance: nextAttendance };
  saveServerState({ ...state, dataset: nextDataset });

  return {
    status: 200,
    user: guard.user,
    dataset: nextDataset,
    thresholds: state.thresholds,
  };
}

export function serverCreateInterventionRecord(token, input) {
  const guard = requireFacultySession(token);
  if (!guard.ok) return { status: guard.status, error: guard.error };

  if (!String(input.actionTitle ?? '').trim()) {
    return { status: 400, error: 'Intervention action title is required.' };
  }
  if (!String(input.assignedFaculty ?? '').trim()) {
    return { status: 400, error: 'Assigned faculty member is required.' };
  }
  if (!input.followUpDate) {
    return { status: 400, error: 'Follow-up date is required.' };
  }

  const state = loadServerState();
  const { dataset } = state;
  const now = new Date();
  const newIntervention = {
    id: `int-${Date.now()}`,
    studentId: input.studentId,
    subjectId: input.subjectId || null,
    riskLevelAtCreation: input.riskLevelAtCreation || 'MEDIUM',
    triggerFactors: Array.isArray(input.triggerFactors) ? input.triggerFactors : [],
    actionTitle: String(input.actionTitle).trim(),
    description: String(input.description ?? '').trim(),
    assignedFaculty: String(input.assignedFaculty).trim(),
    status: input.status ?? 'PLANNED',
    createdDate: now.toISOString().split('T')[0],
    followUpDate: input.followUpDate,
    outcomeNotes: String(input.outcomeNotes ?? '').trim(),
    updatedAt: now.toISOString(),
  };

  const nextDataset = {
    ...dataset,
    interventions: [newIntervention, ...dataset.interventions],
  };
  saveServerState({ ...state, dataset: nextDataset });

  return {
    status: 200,
    user: guard.user,
    dataset: nextDataset,
    thresholds: state.thresholds,
    intervention: newIntervention,
  };
}

export function serverUpdateInterventionRecord(token, input) {
  const guard = requireFacultySession(token);
  if (!guard.ok) return { status: guard.status, error: guard.error };

  const state = loadServerState();
  const { dataset } = state;
  const idx = dataset.interventions.findIndex((i) => i.id === input.interventionId);
  if (idx < 0) {
    return { status: 404, error: 'Intervention record not found.' };
  }

  const now = new Date().toISOString();
  const updated = {
    ...dataset.interventions[idx],
    status: input.status,
    outcomeNotes: String(input.outcomeNotes ?? '').trim(),
    followUpDate: input.followUpDate ?? dataset.interventions[idx].followUpDate,
    updatedAt: now,
  };

  const nextInterventions = [...dataset.interventions];
  nextInterventions[idx] = updated;
  const nextDataset = { ...dataset, interventions: nextInterventions };
  saveServerState({ ...state, dataset: nextDataset });

  return {
    status: 200,
    user: guard.user,
    dataset: nextDataset,
    thresholds: state.thresholds,
  };
}

export function serverCommitValidatedCsvRows(token, validRows) {
  const guard = requireFacultySession(token);
  if (!guard.ok) return { status: guard.status, error: guard.error };

  if (!Array.isArray(validRows)) {
    return { status: 400, error: 'Invalid CSV rows payload.' };
  }

  let appliedCount = 0;
  for (const row of validRows) {
    if (!row || !row.isValid || !row.studentId || !row.subjectId) continue;
    if (row.recordType === 'SCORE' && row.assessmentId) {
      const res = serverUpsertAssessmentScore(token, {
        studentId: row.studentId,
        assessmentId: row.assessmentId,
        marksObtained: row.marksObtained ?? null,
        status: row.marksObtained === null ? 'MISSING' : 'GRADED',
      });
      if (res.status === 200) appliedCount += 1;
    } else if (
      row.recordType === 'ATTENDANCE' &&
      row.classesAttended !== undefined &&
      row.classesHeld !== undefined
    ) {
      const res = serverUpsertAttendanceRecord(token, {
        studentId: row.studentId,
        subjectId: row.subjectId,
        classesAttended: row.classesAttended,
        classesHeld: row.classesHeld,
      });
      if (res.status === 200) appliedCount += 1;
    }
  }

  const finalState = loadServerState();
  return {
    status: 200,
    user: guard.user,
    dataset: finalState.dataset,
    thresholds: finalState.thresholds,
    appliedCount,
  };
}

export function serverSaveRiskThresholds(token, thresholds) {
  const guard = requireFacultySession(token);
  if (!guard.ok) return { status: guard.status, error: guard.error };

  if (
    !thresholds ||
    thresholds.criticalAttendancePct >= thresholds.warningAttendancePct ||
    thresholds.passingScorePct >= thresholds.borderlineScorePct ||
    thresholds.severeDropPoints <= thresholds.moderateDropPoints
  ) {
    return { status: 400, error: 'Invalid risk threshold bounds.' };
  }

  const state = loadServerState();
  const nextThresholds = { ...DEFAULT_RISK_THRESHOLDS, ...thresholds };
  saveServerState({ ...state, thresholds: nextThresholds });

  return {
    status: 200,
    user: guard.user,
    dataset: state.dataset,
    thresholds: nextThresholds,
  };
}

export function serverResetDemoDataset(token) {
  const guard = requireFacultySession(token);
  if (!guard.ok) return { status: guard.status, error: guard.error };

  const fresh = {
    dataset: createInitialSyntheticDataset(),
    thresholds: { ...DEFAULT_RISK_THRESHOLDS },
  };
  saveServerState(fresh);

  return {
    status: 200,
    user: guard.user,
    dataset: fresh.dataset,
    thresholds: fresh.thresholds,
  };
}

// =============================================================================
// HTTP MIDDLEWARE FOR VITE DEV & PREVIEW SERVERS
// =============================================================================

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

function extractRequestToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers['cookie']);
  return cookies['ai_session'] || null;
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

export async function handleApiHttpRequest(req, res) {
  const rawUrl = req.url || '';
  const urlObj = new URL(rawUrl, 'http://localhost');
  const pathname = urlObj.pathname;
  const method = (req.method || 'GET').toUpperCase();
  const token = extractRequestToken(req);

  try {
    // 1. POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = authenticateUserCredentials(body.email, body.password);
      if (result.authenticated && result.token) {
        return sendJson(
          res,
          result.status,
          {
            authenticated: true,
            user: result.user,
            token: result.token,
          },
          {
            'Set-Cookie': `ai_session=${encodeURIComponent(
              result.token
            )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`,
          }
        );
      }
      return sendJson(res, result.status, {
        authenticated: false,
        user: null,
        error: result.error,
      });
    }

    // 2. GET /api/auth/session
    if (pathname === '/api/auth/session' && method === 'GET') {
      const result = verifySessionToken(token);
      return sendJson(res, result.status, {
        authenticated: result.authenticated,
        user: result.user,
        error: result.error,
      });
    }

    // 3. POST /api/auth/logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      revokeSessionToken(token);
      return sendJson(
        res,
        200,
        { authenticated: false, user: null },
        {
          'Set-Cookie':
            'ai_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        }
      );
    }

    // 4. POST /api/auth/reset-password
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = requestPasswordResetNotice(body.email);
      return sendJson(res, result.status, result);
    }

    // 5. GET /api/data
    if (pathname === '/api/data' && method === 'GET') {
      const requestedStudentId = urlObj.searchParams.get('studentId');
      const result = getAuthorizedDatasetForSession(token, requestedStudentId);
      return sendJson(res, result.status, result);
    }

    // 6. POST /api/data/score
    if (pathname === '/api/data/score' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = serverUpsertAssessmentScore(token, body);
      return sendJson(res, result.status, result);
    }

    // 7. POST /api/data/attendance
    if (pathname === '/api/data/attendance' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = serverUpsertAttendanceRecord(token, body);
      return sendJson(res, result.status, result);
    }

    // 8. POST /api/data/interventions
    if (pathname === '/api/data/interventions' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = serverCreateInterventionRecord(token, body);
      return sendJson(res, result.status, result);
    }

    // 9. PATCH /api/data/interventions
    if (pathname === '/api/data/interventions' && method === 'PATCH') {
      const body = await readJsonBody(req);
      const result = serverUpdateInterventionRecord(token, body);
      return sendJson(res, result.status, result);
    }

    // 10. POST /api/data/csv
    if (pathname === '/api/data/csv' && method === 'POST') {
      const body = await readJsonBody(req);
      const result = serverCommitValidatedCsvRows(token, body.validRows);
      return sendJson(res, result.status, result);
    }

    // 11. PUT /api/data/thresholds
    if (pathname === '/api/data/thresholds' && method === 'PUT') {
      const body = await readJsonBody(req);
      const result = serverSaveRiskThresholds(token, body.thresholds);
      return sendJson(res, result.status, result);
    }

    // 12. POST /api/data/reset
    if (pathname === '/api/data/reset' && method === 'POST') {
      const result = serverResetDemoDataset(token);
      return sendJson(res, result.status, result);
    }

    return sendJson(res, 404, { error: 'API endpoint not found.' });
  } catch (err) {
    return sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

function attachApiMiddleware(middlewares) {
  middlewares.use(async (req, res, next) => {
    const rawUrl = req.url || '';
    if (!rawUrl.startsWith('/api/')) {
      return next();
    }
    return handleApiHttpRequest(req, res);
  });
}

export function verifyPublicStudyNotePdfOnDisk(relativeUrl) {
  if (!relativeUrl || typeof relativeUrl !== 'string') {
    return { exists: false, isValidPdf: false };
  }
  const cleanRel = relativeUrl.replace(/^\/+/, '');
  const fullPath = path.join(__dirname, '..', 'public', cleanRel);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, isValidPdf: false };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  return {
    exists: true,
    isValidPdf: content.startsWith('%PDF-1.4') && content.includes('%%EOF'),
  };
}

export function createAcademicInsightRbacPlugin() {
  return {
    name: 'academic-insight-rbac-server',
    configureServer(server) {
      attachApiMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachApiMiddleware(server.middlewares);
    },
  };
}
