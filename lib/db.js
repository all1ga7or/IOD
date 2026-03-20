import fs from 'fs';
import path from 'path';

// ===== 20 об'єктів (серіалів) для голосування ЛР1 =====
const OBJECTS_SEED = [
  "Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Chernobyl",
  "Stranger Things", "True Detective", "Fargo", "The Office", "Friends",
  "Dark", "Peaky Blinders", "Better Call Saul", "Black Mirror", "Sherlock",
  "Narcos", "The Mandalorian", "Succession", "The Boys", "Severance"
];

// ===== ЛР2: Підмножина 14 об'єктів (результат ЛР1) =====
const LAB2_OBJECTS_SUBSET = [
  { id: 1, name: "Breaking Bad" },
  { id: 2, name: "Game of Thrones" },
  { id: 3, name: "The Sopranos" },
  { id: 5, name: "Chernobyl" },
  { id: 6, name: "Stranger Things" },
  { id: 7, name: "True Detective" },
  { id: 8, name: "Fargo" },
  { id: 11, name: "Dark" },
  { id: 12, name: "Peaky Blinders" },
  { id: 13, name: "Better Call Saul" },
  { id: 14, name: "Black Mirror" },
  { id: 15, name: "Sherlock" },
  { id: 18, name: "Succession" },
  { id: 19, name: "The Boys" }
];

// ===== ЛР2: 7 евристик (Е1-Е5 базові + Е6, Е7 власні) =====
const HEURISTICS = [
  { id: 1, code: "Е1", description: "Участь лише в одному МП на 3-му місці", detail: "Об'єкт був обраний лише одним експертом і лише на 3-ю позицію — мінімальна підтримка" },
  { id: 2, code: "Е2", description: "Участь лише в одному МП на 2-му місці", detail: "Об'єкт був обраний лише одним експертом і лише на 2-гу позицію — слабка підтримка" },
  { id: 3, code: "Е3", description: "Участь лише в одному МП на 1-му місці", detail: "Об'єкт був обраний лише одним експертом і лише на 1-шу позицію — підтримка лише однієї особи" },
  { id: 4, code: "Е4", description: "Участь у 2-х МП лише на 3-му місці", detail: "Об'єкт двічі опинився на останній позиції — стабільно низька оцінка" },
  { id: 5, code: "Е5", description: "Участь в одному МП на 3-му місці та ще в одному на 2-му місці", detail: "Об'єкт набрав лише 3 бали (1+2) від двох експертів — недостатня підтримка" },
  { id: 6, code: "Е6", description: "Загальний зважений бал менше 3", detail: "Власна евристика: (1-ше×3 + 2-ге×2 + 3-тє×1) < 3 — сумарна привабливість занадто низька" },
  { id: 7, code: "Е7", description: "Менше 2 згадувань загалом", detail: "Власна евристика: об'єкт обрали менше ніж 2 експерти — брак широкої підтримки" }
];

// ===== ЛР2: Mock-голоси 21 експерта (кожен обирає 2-3 об'єкти) =====
// Формат: { expertName, picks: [{objectId, rank}] } де rank 1=найкращий, 2=середній, 3=нижчий
function generateMockLab2Votes() {
  const expertNames = [
    "Іванов І.", "Петренко О.", "Сидоренко К.", "Коваленко М.", "Шевченко Д.",
    "Бондаренко В.", "Ткаченко Л.", "Кравченко С.", "Олійник А.", "Мельник Т.",
    "Захарченко Р.", "Литвиненко Н.", "Гончаренко Ю.", "Мороз П.", "Савченко Г.",
    "Руденко Є.", "Поліщук Б.", "Тимошенко Ж.", "Хоменко Ф.", "Павленко Х.",
    "Викладач Проф."
  ];

  // Заздалегідь визначені голоси (детерміновані для відтворюваності)
  const voteData = [
    // Експерт 1-5: переважно популярні серіали
    { picks: [{ objectId: 1, rank: 1 }, { objectId: 2, rank: 2 }, { objectId: 5, rank: 3 }] },
    { picks: [{ objectId: 1, rank: 1 }, { objectId: 13, rank: 2 }] },
    { picks: [{ objectId: 1, rank: 1 }, { objectId: 7, rank: 2 }, { objectId: 11, rank: 3 }] },
    { picks: [{ objectId: 2, rank: 1 }, { objectId: 6, rank: 2 }, { objectId: 12, rank: 3 }] },
    { picks: [{ objectId: 5, rank: 1 }, { objectId: 1, rank: 2 }] },
    // Експерт 6-10
    { picks: [{ objectId: 6, rank: 1 }, { objectId: 19, rank: 2 }, { objectId: 18, rank: 3 }] },
    { picks: [{ objectId: 7, rank: 1 }, { objectId: 5, rank: 2 }, { objectId: 13, rank: 3 }] },
    { picks: [{ objectId: 11, rank: 1 }, { objectId: 1, rank: 2 }, { objectId: 7, rank: 3 }] },
    { picks: [{ objectId: 12, rank: 1 }, { objectId: 2, rank: 2 }] },
    { picks: [{ objectId: 13, rank: 1 }, { objectId: 6, rank: 2 }, { objectId: 1, rank: 3 }] },
    // Експерт 11-15
    { picks: [{ objectId: 19, rank: 1 }, { objectId: 18, rank: 2 }, { objectId: 5, rank: 3 }] },
    { picks: [{ objectId: 1, rank: 1 }, { objectId: 19, rank: 2 }, { objectId: 6, rank: 3 }] },
    { picks: [{ objectId: 2, rank: 1 }, { objectId: 7, rank: 2 }] },
    { picks: [{ objectId: 5, rank: 1 }, { objectId: 11, rank: 2 }, { objectId: 3, rank: 3 }] },
    { picks: [{ objectId: 18, rank: 1 }, { objectId: 13, rank: 2 }, { objectId: 12, rank: 3 }] },
    // Експерт 16-20
    { picks: [{ objectId: 6, rank: 1 }, { objectId: 2, rank: 2 }, { objectId: 14, rank: 3 }] },
    { picks: [{ objectId: 19, rank: 1 }, { objectId: 1, rank: 2 }] },
    { picks: [{ objectId: 7, rank: 1 }, { objectId: 12, rank: 2 }, { objectId: 15, rank: 3 }] },
    { picks: [{ objectId: 11, rank: 1 }, { objectId: 5, rank: 2 }, { objectId: 8, rank: 3 }] },
    { picks: [{ objectId: 13, rank: 1 }, { objectId: 18, rank: 2 }, { objectId: 2, rank: 3 }] },
    // Викладач (21-й)
    { picks: [{ objectId: 1, rank: 1 }, { objectId: 5, rank: 2 }, { objectId: 19, rank: 3 }] }
  ];

  return expertNames.map((name, i) => ({
    expertName: name,
    expertId: i + 1,
    picks: voteData[i].picks
  }));
}

// ===== Статистика об'єктів за mock-голосами =====
function computeObjectStats(votes, objects) {
  return objects.map(obj => {
    let first = 0, second = 0, third = 0;
    votes.forEach(v => {
      v.picks.forEach(p => {
        if (p.objectId === obj.id) {
          if (p.rank === 1) first++;
          else if (p.rank === 2) second++;
          else if (p.rank === 3) third++;
        }
      });
    });
    return {
      id: obj.id,
      name: obj.name,
      first_place: first,
      second_place: second,
      third_place: third,
      total_score: first * 3 + second * 2 + third * 1,
      total_mentions: first + second + third
    };
  }).sort((a, b) => b.total_score - a.total_score);
}

// ===== Застосування евристик для фільтрації =====
function applyHeuristicsFilter(heuristicCodes, objectStats) {
  const steps = [];
  let remaining = [...objectStats];

  for (const code of heuristicCodes) {
    const eliminated = [];
    const kept = [];

    for (const obj of remaining) {
      let shouldEliminate = false;
      let reason = '';

      switch (code) {
        case 'Е1':
          // Участь лише в одному МП на 3 місці
          if (obj.third_place === 1 && obj.second_place === 0 && obj.first_place === 0) {
            shouldEliminate = true;
            reason = `лише 1 МП на 3-му місці (бал: ${obj.total_score})`;
          }
          break;
        case 'Е2':
          // Участь лише в одному МП на 2 місці
          if (obj.second_place === 1 && obj.first_place === 0 && obj.third_place === 0) {
            shouldEliminate = true;
            reason = `лише 1 МП на 2-му місці (бал: ${obj.total_score})`;
          }
          break;
        case 'Е3':
          // Участь лише в одному МП на 1 місці
          if (obj.first_place === 1 && obj.second_place === 0 && obj.third_place === 0) {
            shouldEliminate = true;
            reason = `лише 1 МП на 1-му місці (бал: ${obj.total_score})`;
          }
          break;
        case 'Е4':
          // Участь у 2х МП на 3 місці
          if (obj.third_place === 2 && obj.second_place === 0 && obj.first_place === 0) {
            shouldEliminate = true;
            reason = `2 МП лише на 3-му місці (бал: ${obj.total_score})`;
          }
          break;
        case 'Е5':
          // Участь в одному МП на 3 місці та ще в одному на 2 місці
          if (obj.third_place === 1 && obj.second_place === 1 && obj.first_place === 0) {
            shouldEliminate = true;
            reason = `1 МП на 3-му + 1 МП на 2-му (бал: ${obj.total_score})`;
          }
          break;
        case 'Е6':
          // Загальний зважений бал менше 3
          if (obj.total_score < 3) {
            shouldEliminate = true;
            reason = `загальний бал ${obj.total_score} < 3`;
          }
          break;
        case 'Е7':
          // Менше 2 згадувань загалом
          if (obj.total_mentions < 2) {
            shouldEliminate = true;
            reason = `${obj.total_mentions} згадування (< 2)`;
          }
          break;
      }

      if (shouldEliminate) {
        eliminated.push({ ...obj, reason });
      } else {
        kept.push(obj);
      }
    }

    steps.push({
      heuristic: code,
      description: HEURISTICS.find(h => h.code === code)?.description || code,
      before_count: remaining.length,
      eliminated,
      after_count: kept.length
    });

    remaining = kept;

    // Якщо вже ≤10, зупиняємося
    if (remaining.length <= 10) break;
  }

  return { steps, finalObjects: remaining };
}

// ===== Еволюційний алгоритм: Імітація відпалу (Simulated Annealing) =====
function runSimulatedAnnealing(objects, votes) {
  if (objects.length === 0) return { ranking: [], iterations: [] };

  const n = objects.length;
  const objIds = objects.map(o => o.id);

  // Побудова матриці переваг з голосів експертів
  const prefMatrix = {};
  for (const id of objIds) prefMatrix[id] = {};
  for (const id1 of objIds) {
    for (const id2 of objIds) {
      prefMatrix[id1][id2] = 0;
    }
  }

  votes.forEach(vote => {
    const ranked = vote.picks
      .filter(p => objIds.includes(p.objectId))
      .sort((a, b) => a.rank - b.rank);
    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        prefMatrix[ranked[i].objectId][ranked[j].objectId]++;
      }
    }
  });

  // Fitness: Kendall tau (кількість узгоджених пар)
  function fitness(perm) {
    let score = 0;
    for (let i = 0; i < perm.length; i++) {
      for (let j = i + 1; j < perm.length; j++) {
        score += prefMatrix[perm[i]][perm[j]] || 0;
      }
    }
    return score;
  }

  // Початкова перестановка — сортування за сумарним балом
  let current = [...objIds].sort((a, b) => {
    const sa = objects.find(o => o.id === a);
    const sb = objects.find(o => o.id === b);
    return (sb?.total_score || 0) - (sa?.total_score || 0);
  });
  let currentFit = fitness(current);
  let best = [...current];
  let bestFit = currentFit;

  const iterations = [];
  let T = 100.0;
  const coolingRate = 0.995;
  const minT = 0.01;
  const maxIter = 2000;

  for (let iter = 0; iter < maxIter && T > minT; iter++) {
    // Генерація сусіда: випадковий swap
    const newPerm = [...current];
    const i = Math.floor(Math.random() * n);
    let j = Math.floor(Math.random() * n);
    while (j === i) j = Math.floor(Math.random() * n);
    [newPerm[i], newPerm[j]] = [newPerm[j], newPerm[i]];

    const newFit = fitness(newPerm);
    const delta = newFit - currentFit;

    if (delta > 0 || Math.random() < Math.exp(delta / T)) {
      current = newPerm;
      currentFit = newFit;
    }

    if (currentFit > bestFit) {
      best = [...current];
      bestFit = currentFit;
    }

    T *= coolingRate;

    // Логування кожні 100 ітерацій
    if (iter % 100 === 0) {
      iterations.push({
        iteration: iter,
        temperature: parseFloat(T.toFixed(4)),
        currentFitness: currentFit,
        bestFitness: bestFit
      });
    }
  }

  // Формуємо фінальний рейтинг
  const ranking = best.map((id, idx) => {
    const obj = objects.find(o => o.id === id);
    return {
      rank: idx + 1,
      id,
      name: obj?.name || `Object ${id}`,
      total_score: obj?.total_score || 0,
      total_mentions: obj?.total_mentions || 0
    };
  });

  return { ranking, iterations, bestFitness: bestFit };
}


// ================================================================
//  Визначення режиму: Neon Postgres або локальний JSON-файл
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
      lab2_heuristic_votes: [],
      nextExpertId: 2,
      nextVoteId: 1,
      nextLab2VoteId: 1
    };
    writeDB(db);
  }
  // Ensure lab2 fields exist on legacy DB files
  if (!db.lab2_heuristic_votes) {
    db.lab2_heuristic_votes = [];
    db.nextLab2VoteId = 1;
    writeDB(db);
  }
  return db;
}

// --- JSON implementations (ЛР1) ---

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

// --- JSON implementations (ЛР2) ---

function json_getHeuristics() {
  return HEURISTICS;
}

function json_getLab2Objects() {
  return LAB2_OBJECTS_SUBSET;
}

function json_getLab2MockVotes() {
  return generateMockLab2Votes();
}

function json_hasVotedLab2(expertId) {
  const db = getDB();
  return db.lab2_heuristic_votes.some(v => v.expert_id === expertId);
}

function json_submitHeuristicVote(expertId, heuristicIds) {
  // heuristicIds = [{id, rank}] where rank 1=best(3pts), 2=medium(2pts), 3=least(1pt)
  const db = getDB();
  for (const entry of heuristicIds) {
    db.lab2_heuristic_votes.push({
      id: db.nextLab2VoteId++,
      expert_id: expertId,
      heuristic_id: entry.id,
      rank: entry.rank,
      created_at: new Date().toISOString()
    });
  }
  writeDB(db);
}

function json_getLab2Results() {
  const db = getDB();
  const votes = generateMockLab2Votes();
  const objectStats = computeObjectStats(votes, LAB2_OBJECTS_SUBSET);

  // Частота голосування за евристики (зважена: 1-ше місце=3б, 2-ге=2б, 3-тє=1б)
  const heuristicFrequency = HEURISTICS.map(h => {
    const votesForH = db.lab2_heuristic_votes.filter(v => v.heuristic_id === h.id);
    const weighted_score = votesForH.reduce((sum, v) => {
      const r = v.rank || 1;
      return sum + (r === 1 ? 3 : r === 2 ? 2 : 1);
    }, 0);
    const first_place = votesForH.filter(v => v.rank === 1).length;
    const second_place = votesForH.filter(v => v.rank === 2).length;
    const third_place = votesForH.filter(v => v.rank === 3).length;
    return { ...h, vote_count: votesForH.length, weighted_score, first_place, second_place, third_place };
  }).sort((a, b) => b.weighted_score - a.weighted_score);

  // Протокол голосування за евристики
  const heuristicProtocol = [];
  const groupedByExpert = {};
  db.lab2_heuristic_votes.forEach(v => {
    if (!groupedByExpert[v.expert_id]) {
      groupedByExpert[v.expert_id] = { expert_id: v.expert_id, heuristics: [], created_at: v.created_at };
    }
    const h = HEURISTICS.find(h2 => h2.id === v.heuristic_id);
    if (h) groupedByExpert[v.expert_id].heuristics.push({ code: h.code, rank: v.rank });
  });
  for (const eid of Object.keys(groupedByExpert)) {
    const entry = groupedByExpert[eid];
    const expert = db.experts.find(e => e.id === parseInt(eid));
    heuristicProtocol.push({
      expert_name: expert?.name || `Експерт ${eid}`,
      heuristics: entry.heuristics.sort((a, b) => a.rank - b.rank),
      created_at: entry.created_at
    });
  }

  // Топ-евристики (за зваженим балом - беремо до 3)
  const topHeuristics = heuristicFrequency
    .filter(h => h.weighted_score > 0)
    .slice(0, 3)
    .map(h => h.code);

  // Фільтрація
  const filterResult = applyHeuristicsFilter(
    topHeuristics.length > 0 ? topHeuristics : ['Е7', 'Е6', 'Е1'],
    objectStats
  );

  // Еволюційний алгоритм на відфільтрованих об'єктах
  const evolutionResult = runSimulatedAnnealing(filterResult.finalObjects, votes);

  const totalExperts = db.lab2_heuristic_votes.length > 0
    ? new Set(db.lab2_heuristic_votes.map(v => v.expert_id)).size
    : 0;

  return {
    mockVotes: votes,
    objectStats,
    heuristicFrequency,
    heuristicProtocol,
    filterResult,
    evolutionResult,
    stats: {
      total_objects: LAB2_OBJECTS_SUBSET.length,
      total_mock_experts: 21,
      heuristic_voters: totalExperts,
      final_objects: filterResult.finalObjects.length
    }
  };
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
  // ЛР2: таблиця голосів за евристики (з рангом)
  await sql`
    CREATE TABLE IF NOT EXISTS lab2_heuristic_votes (
      id SERIAL PRIMARY KEY,
      expert_id INTEGER REFERENCES experts(id),
      heuristic_id INTEGER NOT NULL,
      rank INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  // Міграція: додати колонку rank якщо таблиця вже існувала без неї
  try {
    await sql`ALTER TABLE lab2_heuristic_votes ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 1`;
  } catch (e) {
    // Ігноруємо — колонка вже існує
  }
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

// --- Postgres implementations (ЛР2) ---

async function pg_hasVotedLab2(expertId) {
  const sql = await getNeonPool();
  await pg_ensureDatabase();
  const result = await sql`SELECT COUNT(*) as cnt FROM lab2_heuristic_votes WHERE expert_id = ${expertId}`;
  return parseInt(result[0].cnt) > 0;
}

async function pg_submitHeuristicVote(expertId, heuristicIds) {
  // heuristicIds = [{id, rank}]
  const sql = await getNeonPool();
  await pg_ensureDatabase();
  for (const entry of heuristicIds) {
    await sql`INSERT INTO lab2_heuristic_votes (expert_id, heuristic_id, rank) VALUES (${expertId}, ${entry.id}, ${entry.rank})`;
  }
}

async function pg_getLab2Results() {
  const sql = await getNeonPool();
  await pg_ensureDatabase();

  const votes = generateMockLab2Votes();
  const objectStats = computeObjectStats(votes, LAB2_OBJECTS_SUBSET);

  // Голоси за евристики з БД (з рангами)
  const hVotes = await sql`SELECT expert_id, heuristic_id, rank, created_at FROM lab2_heuristic_votes ORDER BY created_at`;

  const heuristicFrequency = HEURISTICS.map(h => {
    const votesForH = hVotes.filter(v => parseInt(v.heuristic_id) === h.id);
    const weighted_score = votesForH.reduce((sum, v) => {
      const r = parseInt(v.rank) || 1;
      return sum + (r === 1 ? 3 : r === 2 ? 2 : 1);
    }, 0);
    const first_place = votesForH.filter(v => parseInt(v.rank) === 1).length;
    const second_place = votesForH.filter(v => parseInt(v.rank) === 2).length;
    const third_place = votesForH.filter(v => parseInt(v.rank) === 3).length;
    return { ...h, vote_count: votesForH.length, weighted_score, first_place, second_place, third_place };
  }).sort((a, b) => b.weighted_score - a.weighted_score);

  // Протокол
  const heuristicProtocol = [];
  const grouped = {};
  for (const v of hVotes) {
    const eid = v.expert_id;
    if (!grouped[eid]) grouped[eid] = { heuristics: [], created_at: v.created_at };
    const h = HEURISTICS.find(h2 => h2.id === parseInt(v.heuristic_id));
    if (h) grouped[eid].heuristics.push({ code: h.code, rank: parseInt(v.rank) });
  }
  for (const eid of Object.keys(grouped)) {
    const expertRes = await sql`SELECT name FROM experts WHERE id = ${parseInt(eid)}`;
    heuristicProtocol.push({
      expert_name: expertRes[0]?.name || `Експерт ${eid}`,
      heuristics: grouped[eid].heuristics.sort((a, b) => a.rank - b.rank),
      created_at: grouped[eid].created_at
    });
  }

  const topHeuristics = heuristicFrequency
    .filter(h => h.weighted_score > 0)
    .slice(0, 3)
    .map(h => h.code);

  const filterResult = applyHeuristicsFilter(
    topHeuristics.length > 0 ? topHeuristics : ['Е7', 'Е6', 'Е1'],
    objectStats
  );

  const evolutionResult = runSimulatedAnnealing(filterResult.finalObjects, votes);

  const totalExperts = hVotes.length > 0
    ? new Set(hVotes.map(v => v.expert_id)).size
    : 0;

  return {
    mockVotes: votes,
    objectStats,
    heuristicFrequency,
    heuristicProtocol,
    filterResult,
    evolutionResult,
    stats: {
      total_objects: LAB2_OBJECTS_SUBSET.length,
      total_mock_experts: 21,
      heuristic_voters: totalExperts,
      final_objects: filterResult.finalObjects.length
    }
  };
}


// ================================================================
//  EXPORTS — автоматично обирається реалізація
// ================================================================

// ЛР1
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

// ЛР2
export async function getHeuristics() {
  return HEURISTICS;
}

export async function getLab2Objects() {
  return LAB2_OBJECTS_SUBSET;
}

export async function getLab2MockVotes() {
  return generateMockLab2Votes();
}

export async function hasVotedLab2(expertId) {
  if (isPostgresMode()) return pg_hasVotedLab2(expertId);
  return json_hasVotedLab2(expertId);
}

export async function submitHeuristicVote(expertId, heuristicIds) {
  if (isPostgresMode()) return pg_submitHeuristicVote(expertId, heuristicIds);
  return json_submitHeuristicVote(expertId, heuristicIds);
}

export async function getLab2Results() {
  if (isPostgresMode()) return pg_getLab2Results();
  return json_getLab2Results();
}
