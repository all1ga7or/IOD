import sqlite3

def init_db():
    conn = sqlite3.connect('series.db')
    c = conn.cursor()

    # Таблиця експертів
    c.execute('''CREATE TABLE IF NOT EXISTS experts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    role TEXT DEFAULT 'expert'
                 )''')

    # Таблиця об'єктів (Серіали)
    c.execute('''CREATE TABLE IF NOT EXISTS series (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT
                 )''')

    # Таблиця результатів Лаб 1 (Анонімно для інших, доступно викладачу)
    c.execute('''CREATE TABLE IF NOT EXISTS lab1_votes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    expert_id INTEGER,
                    rank1_id INTEGER,
                    rank2_id INTEGER,
                    rank3_id INTEGER
                 )''')

    # Таблиця евристик (Лаб 2)
    c.execute('''CREATE TABLE IF NOT EXISTS heuristics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT,
                    description TEXT
                 )''')

    # Таблиця результатів Лаб 2
    c.execute('''CREATE TABLE IF NOT EXISTS lab2_votes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    expert_id INTEGER,
                    heuristic_id INTEGER
                 )''')

    # Заповнення 20 об'єктами
    series_list = [
        "Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Chernobyl",
        "Stranger Things", "True Detective", "Fargo", "The Office", "Friends",
        "Dark", "Peaky Blinders", "Better Call Saul", "Black Mirror", "Sherlock",
        "Narcos", "The Mandalorian", "Succession", "The Boys", "Severance"
    ]
    c.execute("SELECT COUNT(*) FROM series")
    if c.fetchone()[0] == 0:
        for s in series_list:
            c.execute("INSERT INTO series (name) VALUES (?)", (s,))

    # Заповнення евристик (Е1-Е5 + 2 власні)
    heuristics_list = [
        ("Е1", "Участь в одному МП на 3 місці"),
        ("Е2", "Участь в одному МП на 2 місці"),
        ("Е3", "Участь в одному МП на 1 місці"),
        ("Е4", "Участь в 2х МП на 3 місці"),
        ("Е5", "Участь в одному МП на 3 місці та ще в одному на 2 місці"),
        ("Е6", "Власна: Серіал не отримав жодного голосу від експертів з високим рейтингом"),
        ("Е7", "Власна: Загальна кількість балів (1м=3б, 2м=2б, 3м=1б) менша за 3")
    ]
    c.execute("SELECT COUNT(*) FROM heuristics")
    if c.fetchone()[0] == 0:
        for h in heuristics_list:
            c.execute("INSERT INTO heuristics (code, description) VALUES (?, ?)", (h[0], h[1]))

    # Додаємо викладача
    c.execute("INSERT OR IGNORE INTO experts (name, role) VALUES ('Teacher', 'teacher')")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Базу даних успішно ініціалізовано.")