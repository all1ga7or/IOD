import math
import sys

def calculate_speedup_amdahl(l, beta):
    """
    S = l / (l * beta + 1 - beta)
    """
    return l / (l * beta + 1 - beta)

def calculate_processors_needed(target_ratio, beta):
    """
    l >= (a / (1 - a)) * ((1 - beta) / beta)
    where a is the target ratio of Smax
    """
    if target_ratio >= 1.0:
        return float('inf')
    a = target_ratio
    l = (a / (1 - a)) * ((1 - beta) / beta)
    return math.ceil(l)

def solve_for_l(s_target, beta):
    """
    s_target = l / (l * beta + 1 - beta)
    l = s_target * (1 - beta) / (1 - s_target * beta)
    """
    denom = 1 - s_target * beta
    if denom <= 0:
        return None
    l = s_target * (1 - beta) / denom
    return l

def print_results(beta, s_given, a1, a2):
    parallel = 1 - beta
    s_max = 1 / beta if beta > 0 else float('inf')
    
    print(f"\n--- Результати аналізу ---")
    print(f"Частка паралельних обчислень (1 - beta): {parallel:.2f}")
    print(f"Частка послідовних обчислень (beta): {beta:.2f}")
    print(f"Теоретичне граничне прискорення (Smax): {s_max:.3f}")
    
    print(f"\n1. Перевірка заданого прискорення S = {s_given}:")
    l_calc = solve_for_l(s_given, beta)
    if l_calc is None or l_calc <= 0:
        print(f"   [!] Несумісність: Задане прискорення {s_given} неможливе.")
        print(f"       Причина: S={s_given} > Smax={s_max:.3f}.")
    else:
        print(f"   Кількість процесорів для S={s_given}: {l_calc:.2f} (прибл. {math.ceil(l_calc)})")

    print(f"\n2. Розрахунок процесорів для діапазону {a1*100}% - {a2*100}% від Smax:")
    l_min = calculate_processors_needed(a1, beta)
    l_max = calculate_processors_needed(a2, beta)
    print(f"   Для {a1*100}% Smax ({a1*s_max:.2f}): l >= {l_min}")
    print(f"   Для {a2*100}% Smax ({a2*s_max:.2f}): l >= {l_max}")

def run_interactive():
    print("Введіть дані для розрахунку:")
    try:
        parallel = float(input("Частка паралельних обчислень (1 - beta): "))
        s_given = float(input("Задане максимальне прискорення (S): "))
        a1 = float(input("Нижня межа граничного прискорення (a1, напр. 0.65): "))
        a2 = float(input("Верхня межа граничного прискорення (a2, напр. 0.90): "))
        
        beta = 1 - parallel
        print_results(beta, s_given, a1, a2)
    except ValueError:
        print("Помилка: Введіть числові значення.")

def run_file(filename):
    try:
        with open(filename, 'r') as f:
            lines = f.readlines()
            # Expecting CSV or Space-separated: parallel s_given a1 a2
            for line in lines:
                parts = line.split()
                if len(parts) >= 4:
                    parallel = float(parts[0])
                    s_given = float(parts[1])
                    a1 = float(parts[2])
                    a2 = float(parts[3])
                    beta = 1 - parallel
                    print(f"\nОбробка рядка: {line.strip()}")
                    print_results(beta, s_given, a1, a2)
    except Exception as e:
        print(f"Помилка при читанні файлу: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_file(sys.argv[1])
    else:
        mode = input("Оберіть режим (1 - інтерактивний, 2 - з файлу): ")
        if mode == '1':
            run_interactive()
        elif mode == '2':
            fname = input("Введіть ім'я файлу (напр. input.txt): ")
            run_file(fname)
        else:
            print("Невірний вибір.")
