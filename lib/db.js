import fs from 'fs';
import path from 'path';

// ===== 20 об'єктів (серіалів) для голосування =====
const OBJECTS_SEED = [
  "Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Chernobyl",
  "Stranger Things", "True Detective", "Fargo", "The Office", "Friends",
  "Dark", "Peaky Blinders", "Better Call Saul", "Black Mirror", "Sherlock",
  "Narcos", "The Mandalorian", "Succession", "The Boys", "Severance"
];

// ================================================================
//  Визначення режиму: Neon Postgres або локальний JSON-файл
//  Якщо DATABASE_URL встановлений — використовуємо Neon Postgres
//  Інакше — локальний JSON-файл (для розробки)
// ================================================================

function isPostgresMode() {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

// ================================================================
//  JSON FILE DATABASE (для локальної розробки без PostgreSQL)
// ================================================================

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading DB file:', e);
  }
  return null;
}

function writeDB(data) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getDB() {
  let db = readDB();
  if (!db) {
    db = {
      experts: [
        { id: 1, name: 'Викладач', role: 'teacher', created_at: new Date().toISOString() }
      ],
      objects: OBJECTS_SEED.map((name, i) => ({ id: i + 1, name })),
      votes: [],
      nextExpertId: 2,
      nextVoteId: 1
    };
    writeDB(db);
  }
  return db;
}

// --- JSON implementations ---

function json_getOrCreateExpert(name) {
  const db = getDB();
  let expert = db.experts.find(e => e.name === name);
  if (expert) return expert;

  expert = {
    id: db.nextExpertId++,
    name,
    role: 'expert',
    created_at: new Date().toISOString()
  };
  db.experts.push(expert);
  writeDB(db);
  return expert;
}

function json_getObjects() {
  return getDB().objects;
}

function json_hasVoted(expertId) {
  return getDB().votes.some(v => v.expert_id === expertId);
}

function json_submitVote(expertId, rank1Id, rank2Id, rank3Id) {
  const db = getDB();
  db.votes.push({
    id: db.nextVoteId++,
    expert_id: expertId,
    rank1_id: rank1Id,
    rank2_id: rank2Id,
    rank3_id: rank3Id,
    created_at: new Date().toISOString()
  });
  writeDB(db);
}

function json_getResults() {
  const db = getDB();

  const protocol = db.votes.map(v => ({
    expert_name: db.experts.find(e => e.id === v.expert_id)?.name || 'Unknown',
    rank1_name: db.objects.find(o => o.id === v.rank1_id)?.name || '?',
    rank2_name: db.objects.find(o => o.id === v.rank2_id)?.name || '?',
    rank3_name: db.objects.find(o => o.id === v.rank3_id)?.name || '?',
    created_at: v.created_at
  }));

  const scores = db.objects.map(o => {
    let first_place = 0, second_place = 0, third_place = 0;
    db.votes.forEach(v => {
      if (v.rank1_id === o.id) first_place++;
      if (v.rank2_id === o.id) second_place++;
      if (v.rank3_id === o.id) third_place++;
    });
    return {
      id: o.id,
      name: o.name,
      total_score: first_place * 3 + second_place * 2 + third_place,
      first_place,
      second_place,
      third_place,
      total_mentions: first_place + second_place + third_place
    };
  }).sort((a, b) => b.total_score - a.total_score);

  const votedExperts = new Set(db.votes.map(v => v.expert_id));
  const stats = {
    voted_count: votedExperts.size,
    total_experts: db.experts.filter(e => e.role === 'expert').length,
    total_votes: db.votes.length
  };

  return { protocol, scores, stats };
}

// ================================================================
//  NEON POSTGRES (для продакшену на Vercel)
// ================================================================

let neonPool = null;

async function getNeonPool() {
  if (!neonPool) {
    const { neon } = await import('@neondatabase/serverless');
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    neonPool = neon(connectionString);
  }
  return neonPool;
}

async function pg_ensureDatabase() {
  const sql = await getNeonPool();
  await sql`
    CREATE TABLE IF NOT EXISTS experts (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'expert',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS objects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      expert_id INTEGER REFERENCES experts(id),
      rank1_id INTEGER REFERENCES objects(id),
      rank2_id INTEGER REFERENCES objects(id),
      rank3_id INTEGER REFERENCES objects(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  const result = await sql`SELECT COUNT(*) as cnt FROM objects`;
  if (parseInt(result[0].cnt) === 0) {
    for (const name of OBJECTS_SEED) {
      await sql`INSERT INTO objects (name) VALUES (${name})`;
    }
  }
  await sql`INSERT INTO experts (name, role) VALUES ('Викладач', 'teacher') ON CONFLICT (name) DO NOTHING`;
}

async function pg_getOrCreateExpert(name) {
  const sql = await getNeonPool();
  await pg_ensureDatabase();
  const existing = await sql`SELECT id, name, role FROM experts WHERE name = ${name}`;
  if (existing.length > 0) return existing[0];
  const created = await sql`INSERT INTO experts (name) VALUES (${name}) RETURNING id, name, role`;
  return created[0];
}

async function pg_getObjects() {
  const sql = await getNeonPool();
  await pg_ensureDatabase();
  return await sql`SELECT id, name FROM objects ORDER BY id`;
}

async function pg_hasVoted(expertId) {
  const sql = await getNeonPool();
  const result = await sql`SELECT COUNT(*) as cnt FROM votes WHERE expert_id = ${expertId}`;
  return parseInt(result[0].cnt) > 0;
}

async function pg_submitVote(expertId, rank1Id, rank2Id, rank3Id) {
  const sql = await getNeonPool();
  await sql`INSERT INTO votes (expert_id, rank1_id, rank2_id, rank3_id) VALUES (${expertId}, ${rank1Id}, ${rank2Id}, ${rank3Id})`;
}

async function pg_getResults() {
  const sql = await getNeonPool();
  await pg_ensureDatabase();

  const protocol = await sql`
    SELECT e.name as expert_name, o1.name as rank1_name, o2.name as rank2_name, o3.name as rank3_name, v.created_at
    FROM votes v
    JOIN experts e ON v.expert_id = e.id
    JOIN objects o1 ON v.rank1_id = o1.id
    JOIN objects o2 ON v.rank2_id = o2.id
    JOIN objects o3 ON v.rank3_id = o3.id
    ORDER BY v.created_at ASC
  `;

  const scores = await sql`
    SELECT o.id, o.name,
      COALESCE(SUM(CASE WHEN v.rank1_id = o.id THEN 3 WHEN v.rank2_id = o.id THEN 2 WHEN v.rank3_id = o.id THEN 1 ELSE 0 END), 0) as total_score,
      COALESCE(SUM(CASE WHEN v.rank1_id = o.id THEN 1 ELSE 0 END), 0) as first_place,
      COALESCE(SUM(CASE WHEN v.rank2_id = o.id THEN 1 ELSE 0 END), 0) as second_place,
      COALESCE(SUM(CASE WHEN v.rank3_id = o.id THEN 1 ELSE 0 END), 0) as third_place,
      COALESCE(SUM(CASE WHEN v.rank1_id = o.id OR v.rank2_id = o.id OR v.rank3_id = o.id THEN 1 ELSE 0 END), 0) as total_mentions
    FROM objects o
    LEFT JOIN votes v ON v.rank1_id = o.id OR v.rank2_id = o.id OR v.rank3_id = o.id
    GROUP BY o.id, o.name
    ORDER BY total_score DESC
  `;

  const statsResult = await sql`
    SELECT
      (SELECT COUNT(DISTINCT expert_id) FROM votes) as voted_count,
      (SELECT COUNT(*) FROM experts WHERE role = 'expert') as total_experts,
      (SELECT COUNT(*) FROM votes) as total_votes
  `;

  return { protocol, scores, stats: statsResult[0] };
}

// ================================================================
//  EXPORTS — автоматично обирається реалізація
// ================================================================

export async function getOrCreateExpert(name) {
  if (isPostgresMode()) return pg_getOrCreateExpert(name);
  return json_getOrCreateExpert(name);
}

export async function getObjects() {
  if (isPostgresMode()) return pg_getObjects();
  return json_getObjects();
}

export async function hasVoted(expertId) {
  if (isPostgresMode()) return pg_hasVoted(expertId);
  return json_hasVoted(expertId);
}

export async function submitVote(expertId, rank1Id, rank2Id, rank3Id) {
  if (isPostgresMode()) return pg_submitVote(expertId, rank1Id, rank2Id, rank3Id);
  return json_submitVote(expertId, rank1Id, rank2Id, rank3Id);
}

export async function getResults() {
  if (isPostgresMode()) return pg_getResults();
  return json_getResults();
}
