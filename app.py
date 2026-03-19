from flask import Flask, render_template, request, redirect, url_for, session
import sqlite3

app = Flask(__name__)
app.secret_key = 'super_secret_key' # Замініть на надійний ключ

def get_db_connection():
    conn = sqlite3.connect('series.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        name = request.form['name']
        conn = get_db_connection()
        expert = conn.execute('SELECT * FROM experts WHERE name = ?', (name,)).fetchone()
        
        if not expert:
            # Автоматична реєстрація нового експерта
            cursor = conn.execute('INSERT INTO experts (name) VALUES (?)', (name,))
            conn.commit()
            expert_id = cursor.lastrowid
            role = 'expert'
        else:
            expert_id = expert['id']
            role = expert['role']
            
        conn.close()
        session['expert_id'] = expert_id
        session['expert_name'] = name
        session['role'] = role
        
        if role == 'teacher':
            return redirect(url_for('teacher_protocol'))
        return redirect(url_for('lab1'))
        
    return render_template('index.html')

@app.route('/lab1', methods=['GET', 'POST'])
def lab1():
    if 'expert_id' not in session:
        return redirect(url_for('login'))
        
    conn = get_db_connection()
    if request.method == 'POST':
        rank1 = request.form.get('rank1')
        rank2 = request.form.get('rank2')
        rank3 = request.form.get('rank3')
        
        # Захист від однакових виборів
        if len(set([rank1, rank2, rank3])) < 3:
            return "Помилка: Виберіть 3 різні серіали", 400
            
        conn.execute('INSERT INTO lab1_votes (expert_id, rank1_id, rank2_id, rank3_id) VALUES (?, ?, ?, ?)',
                     (session['expert_id'], rank1, rank2, rank3))
        conn.commit()
        conn.close()
        return redirect(url_for('lab2'))
        
    series = conn.execute('SELECT * FROM series').fetchall()
    conn.close()
    return render_template('lab1.html', series=series)

@app.route('/lab2', methods=['GET', 'POST'])
def lab2():
    if 'expert_id' not in session:
        return redirect(url_for('login'))
        
    conn = get_db_connection()
    if request.method == 'POST':
        selected_heuristics = request.form.getlist('heuristics')
        for h_id in selected_heuristics:
            conn.execute('INSERT INTO lab2_votes (expert_id, heuristic_id) VALUES (?, ?)',
                         (session['expert_id'], h_id))
        conn.commit()
        conn.close()
        return "Дякуємо за ваш голос! Ваші результати збережено."
        
    heuristics = conn.execute('SELECT * FROM heuristics').fetchall()
    conn.close()
    return render_template('lab2.html', heuristics=heuristics)

@app.route('/teacher')
def teacher_protocol():
    if session.get('role') != 'teacher':
        return "У доступі відмовлено. Лише для викладача.", 403
        
    conn = get_db_connection()
    # Протокол голосування за серіали (ядро лідерів)
    votes_lab1 = conn.execute('''
        SELECT e.name as expert, s1.name as rank1, s2.name as rank2, s3.name as rank3
        FROM lab1_votes lv
        JOIN experts e ON lv.expert_id = e.id
        JOIN series s1 ON lv.rank1_id = s1.id
        JOIN series s2 ON lv.rank2_id = s2.id
        JOIN series s3 ON lv.rank3_id = s3.id
    ''').fetchall()
    
    # Популярність евристик
    heuristics_pop = conn.execute('''
        SELECT h.code, h.description, COUNT(lv.id) as votes
        FROM heuristics h
        LEFT JOIN lab2_votes lv ON h.id = lv.heuristic_id
        GROUP BY h.id
        ORDER BY votes DESC
    ''').fetchall()
    conn.close()
    
    return render_template('teacher.html', votes_lab1=votes_lab1, heuristics_pop=heuristics_pop)

if __name__ == '__main__':
    app.run(debug=True)