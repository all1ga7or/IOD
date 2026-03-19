import { sql } from '@vercel/postgres';

// 20 об'єктів (серіалів) для голосування
const OBJECTS_SEED = [
  "Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Chernobyl",
  "Stranger Things", "True Detective", "Fargo", "The Office", "Friends",
  "Dark", "Peaky Blinders", "Better Call Saul", "Black Mirror", "Sherlock",
  "Narcos", "The Mandalorian", "Succession", "The Boys", "Severance"
];

/**
 * Ініціалізація таблиць та початкових даних.
 * Ідемпотентна — безпечно викликати повторно.
 */
export async function ensureDatabase() {
  try {
    // Створення таблиць
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

    // Seed об'єктів (тільки якщо таблиця порожня)
    const { rows: objectCount } = await sql`SELECT COUNT(*) as cnt FROM objects`;
    if (parseInt(objectCount[0].cnt) === 0) {
      for (const name of OBJECTS_SEED) {
        await sql`INSERT INTO objects (name) VALUES (${name})`;
      }
    }

    // Seed викладача
    await sql`
      INSERT INTO experts (name, role)
      VALUES ('Викладач', 'teacher')
      ON CONFLICT (name) DO NOTHING
    `;

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Отримати або створити експерта за ім'ям
 */
export async function getOrCreateExpert(name) {
  await ensureDatabase();

  // Спробувати знайти
  const { rows: existing } = await sql`
    SELECT id, name, role FROM experts WHERE name = ${name}
  `;

  if (existing.length > 0) {
    return existing[0];
  }

  // Створити нового
  const { rows: created } = await sql`
    INSERT INTO experts (name) VALUES (${name})
    RETURNING id, name, role
  `;

  return created[0];
}

/**
 * Отримати всі об'єкти для голосування
 */
export async function getObjects() {
  await ensureDatabase();
  const { rows } = await sql`SELECT id, name FROM objects ORDER BY id`;
  return rows;
}

/**
 * Перевірити чи експерт вже голосував
 */
export async function hasVoted(expertId) {
  const { rows } = await sql`
    SELECT COUNT(*) as cnt FROM votes WHERE expert_id = ${expertId}
  `;
  return parseInt(rows[0].cnt) > 0;
}

/**
 * Зберегти голос експерта
 */
export async function submitVote(expertId, rank1Id, rank2Id, rank3Id) {
  await sql`
    INSERT INTO votes (expert_id, rank1_id, rank2_id, rank3_id)
    VALUES (${expertId}, ${rank1Id}, ${rank2Id}, ${rank3Id})
  `;
}

/**
 * Отримати всі результати (для адмін-панелі)
 */
export async function getResults() {
  await ensureDatabase();

  // Протокол: хто як голосував
  const { rows: protocol } = await sql`
    SELECT
      e.name as expert_name,
      o1.name as rank1_name,
      o2.name as rank2_name,
      o3.name as rank3_name,
      v.created_at
    FROM votes v
    JOIN experts e ON v.expert_id = e.id
    JOIN objects o1 ON v.rank1_id = o1.id
    JOIN objects o2 ON v.rank2_id = o2.id
    JOIN objects o3 ON v.rank3_id = o3.id
    ORDER BY v.created_at ASC
  `;

  // Агреговані результати: бали кожного об'єкта
  // 1 місце = 3 бали, 2 місце = 2 бали, 3 місце = 1 бал
  const { rows: scores } = await sql`
    SELECT
      o.id,
      o.name,
      COALESCE(SUM(
        CASE
          WHEN v.rank1_id = o.id THEN 3
          WHEN v.rank2_id = o.id THEN 2
          WHEN v.rank3_id = o.id THEN 1
          ELSE 0
        END
      ), 0) as total_score,
      COALESCE(SUM(CASE WHEN v.rank1_id = o.id THEN 1 ELSE 0 END), 0) as first_place,
      COALESCE(SUM(CASE WHEN v.rank2_id = o.id THEN 1 ELSE 0 END), 0) as second_place,
      COALESCE(SUM(CASE WHEN v.rank3_id = o.id THEN 1 ELSE 0 END), 0) as third_place,
      COALESCE(SUM(
        CASE
          WHEN v.rank1_id = o.id THEN 1
          WHEN v.rank2_id = o.id THEN 1
          WHEN v.rank3_id = o.id THEN 1
          ELSE 0
        END
      ), 0) as total_mentions
    FROM objects o
    LEFT JOIN votes v ON v.rank1_id = o.id OR v.rank2_id = o.id OR v.rank3_id = o.id
    GROUP BY o.id, o.name
    ORDER BY total_score DESC
  `;

  // Статистика
  const { rows: stats } = await sql`
    SELECT
      (SELECT COUNT(DISTINCT expert_id) FROM votes) as voted_count,
      (SELECT COUNT(*) FROM experts WHERE role = 'expert') as total_experts,
      (SELECT COUNT(*) FROM votes) as total_votes
  `;

  return {
    protocol,
    scores,
    stats: stats[0]
  };
}

export { sql };
