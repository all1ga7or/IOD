"""
ЛАБОРАТОРНА РОБОТА №2 — Демонстрація Генетичного Алгоритму (GA)
для задачі ранжування об'єктів на основі експертних оцінок.

Запуск: python lab2_demo.py
"""
import random

# ===== 1. ВИХІДНІ ДАНІ =====
OBJECTS = [
    "Breaking Bad", "Game of Thrones", "The Sopranos", "The Wire", "Chernobyl",
    "Stranger Things", "True Detective", "Fargo", "The Office", "Friends",
    "Dark", "Peaky Blinders", "Better Call Saul", "Black Mirror"
]

def generate_votes(expert_count=21):
    """Генерація голосів: кожен експерт обирає ТОП-3 серіали."""
    votes = []
    for i in range(expert_count):
        picks = random.sample(range(len(OBJECTS)), 3)
        votes.append({
            "expert": f"Експерт {i+1}",
            "picks": [
                {"id": picks[0], "rank": 1},
                {"id": picks[1], "rank": 2},
                {"id": picks[2], "rank": 3}
            ]
        })
    return votes

# ===== 2. ЕВРИСТИЧНЕ ВІДСІЮВАННЯ =====
def compute_stats(objects, votes):
    stats = []
    for i, name in enumerate(objects):
        first  = sum(1 for v in votes for p in v['picks'] if p['id'] == i and p['rank'] == 1)
        second = sum(1 for v in votes for p in v['picks'] if p['id'] == i and p['rank'] == 2)
        third  = sum(1 for v in votes for p in v['picks'] if p['id'] == i and p['rank'] == 3)
        score = first * 3 + second * 2 + third * 1
        mentions = first + second + third
        stats.append({"id": i, "name": name, "first": first, "second": second,
                       "third": third, "score": score, "mentions": mentions})
    stats.sort(key=lambda x: x['score'], reverse=True)
    return stats

def apply_heuristics(stats):
    print("\n" + "="*60)
    print("КРОК 1: ЕВРИСТИЧНЕ ВІДСІЮВАННЯ (з 14 до ≤10 об'єктів)")
    print("="*60)

    print(f"\n{'Об`єкт':<20} {'1-ше':>5} {'2-ге':>5} {'3-тє':>5} {'Бал':>5} {'Згад.':>6}")
    print("-" * 52)
    for s in stats:
        print(f"{s['name']:<20} {s['first']:>5} {s['second']:>5} {s['third']:>5} {s['score']:>5} {s['mentions']:>6}")

    remaining = stats[:]
    eliminated = []

    # Відсіюємо найгірших, поки не залишиться 10
    while len(remaining) > 10:
        worst = remaining[-1]
        eliminated.append(worst)
        remaining = remaining[:-1]
        reason = ""
        if worst['mentions'] < 2:
            reason = "Е7: менше 2 згадувань"
        elif worst['score'] < 3:
            reason = "Е6: зважений бал < 3"
        elif worst['third'] == 1 and worst['second'] == 0 and worst['first'] == 0:
            reason = "Е1: лише 1 МП на 3-му місці"
        else:
            reason = "Найнижчий загальний бал"
        print(f"\n  ✗ Вилучено: {worst['name']} (бал={worst['score']}) — {reason}")

    print(f"\n→ Залишилось {len(remaining)} об'єктів для фінального ранжування.")
    return remaining

# ===== 3. ГЕНЕТИЧНИЙ АЛГОРИТМ (Метрика Кука) =====
def fitness(perm, objects, votes):
    """Відстань Кука: сумарне абсолютне відхилення рангів."""
    dist = 0
    # perm - масив індексів об'єктів
    rank_in_perm = {}
    for i, idx in enumerate(perm):
        obj_id = objects[idx]['id']
        rank_in_perm[obj_id] = i + 1

    for v in votes:
        for p in v['picks']:
            obj_id = p['id']
            if obj_id in rank_in_perm:
                dist += abs(rank_in_perm[obj_id] - p['rank'])
    
    # GA максимізує функцію, тому повертаємо від'ємну відстань Кука
    return -dist

def pmx_crossover(p1, p2):
    """Partially Matched Crossover — оператор схрещування для перестановок."""
    n = len(p1)
    start = random.randint(0, n - 2)
    end = random.randint(start + 1, n)

    child = [None] * n
    used = set()

    # Копіюємо ділянку від Батька 1
    for i in range(start, end):
        child[i] = p1[i]
        used.add(p1[i])

    # Заповнюємо решту від Батька 2
    j = 0
    for i in range(n):
        if child[i] is None:
            while p2[j] in used:
                j += 1
            child[i] = p2[j]
            used.add(p2[j])
            j += 1

    return child

def swap_mutation(perm):
    """Мутація: обмін двох випадкових генів."""
    n = len(perm)
    a, b = random.sample(range(n), 2)
    perm[a], perm[b] = perm[b], perm[a]
    return perm

def run_genetic_algorithm(objects, votes, pop_size=50, generations=200, mutation_rate=0.15):
    print("\n" + "="*60)
    print("КРОК 2: ГЕНЕТИЧНИЙ АЛГОРИТМ (GA)")
    print("="*60)

    n = len(objects)

    # Параметри
    print(f"\nПараметри GA:")
    print(f"  Розмір популяції:    {pop_size}")
    print(f"  Кількість поколінь:  {generations}")
    print(f"  Ймовірність мутації: {mutation_rate*100:.0f}%")
    print(f"  Оператор кросовера:  PMX (Partially Matched Crossover)")
    print(f"  Селекція:            Top-50% (елітизм)")
    print(f"  Фітнес-функція:      Мінімізація відстаней Кука (Cook distance)")

    # Ініціалізація популяції
    indices = list(range(n))
    population = [random.sample(indices, n) for _ in range(pop_size)]

    best_perm = population[0][:]
    best_fit = fitness(best_perm, objects, votes)

    print(f"\n{'Покоління':>10} │ {'Метрика Кука':>15} │ Статус")
    print('-' * 50)

    for gen in range(generations):
        # Оцінка
        scored = [(p, fitness(p, objects, votes)) for p in population]
        scored.sort(key=lambda x: x[1], reverse=True)

        if scored[0][1] > best_fit:
            best_fit = scored[0][1]
            best_perm = scored[0][0][:]

        # Логування
        if gen % 40 == 0 or gen == generations - 1:
            status = "← локальний оптимум" if gen > 0 and scored[0][1] == best_fit else ""
            print(f"{gen:>10} | {abs(best_fit):>15.0f} | {status}")

        # Селекція: Топ-50%
        survivors = [s[0] for s in scored[:pop_size // 2]]
        next_gen = [s[:] for s in survivors]

        # Схрещування + Мутація
        while len(next_gen) < pop_size:
            p1 = random.choice(survivors)
            p2 = random.choice(survivors)
            child = pmx_crossover(p1, p2)
            if random.random() < mutation_rate:
                child = swap_mutation(child)
            next_gen.append(child)

        population = next_gen

    print('-' * 50)
    return [objects[i] for i in best_perm], best_fit

# ===== ГОЛОВНИЙ ЗАПУСК =====
def main():
    print('+' + '='*58 + '+')
    print("|  ЛАБОРАТОРНА РОБОТА №2 — Генетичний Алгоритм (GA)        |")
    print("|  Дисципліна: Інтелектуальна обробка даних                 |")
    print("|  Тема: Технології розподіленої обробки даних              |")
    print('+' + '='*58 + '+')
    print(f"\nПочаткова множина: {len(OBJECTS)} об'єктів (серіалів)")
    print(f"Кількість експертів: 21")

    random.seed(42)  # Фіксований seed для відтворюваності
    votes = generate_votes(21)

    # Показуємо голоси
    print("\nГолоси експертів (фрагмент):")
    for v in votes[:5]:
        picks_str = ", ".join(f"{p['rank']}→{OBJECTS[p['id']]}" for p in v['picks'])
        print(f"  {v['expert']}: {picks_str}")
    print(f"  ... (ще {len(votes)-5} експертів)")

    # Крок 1: Евристичне відсіювання
    stats = compute_stats(OBJECTS, votes)
    subset = apply_heuristics(stats)

    # Крок 2: Генетичний алгоритм з ПОВНИМИ РЯНЖУВАННЯМИ
    print("\nГенерація повних ранжувань експертів для фінальної підмножини...")
    full_votes = []
    for i in range(21):
        shuffled = subset[:]
        random.shuffle(shuffled)
        picks = [{"id": obj['id'], "rank": rank + 1} for rank, obj in enumerate(shuffled)]
        full_votes.append({"expert": f"Експерт {i+1}", "picks": picks})
        
    final_ranking, best_fitness = run_genetic_algorithm(subset, full_votes)

    # Результат
    print("\n" + '+' + '='*64 + '+')
    print("|  ФІНАЛЬНИЙ КОМПРОМІСНИЙ РЕЙТИНГ (Результат GA)                 |")
    print('+' + '='*64 + '+')
    for i, obj in enumerate(final_ranking):
        # Для кожного об'єкта розрахуємо сумарне відхилення Кука для наглядності
        obj_cook = 0
        for v in full_votes:
            for p in v['picks']:
                if p['id'] == obj['id']:
                    obj_cook += abs(p['rank'] - (i + 1))

        medal = "[1]" if i == 0 else "[2]" if i == 1 else "[3]" if i == 2 else f"{i+1:2}."
        print(f"|  {medal} {obj['name']:<40} (сумарне відхилення: {obj_cook:>3}) |")
    print('+' + '='*64 + '+')
    print(f"|  Мінімальна метрика Кука: {abs(best_fitness):<35.0f} |")
    print('+' + '='*64 + '+')

if __name__ == "__main__":
    main()
