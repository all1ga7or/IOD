"""
Лабораторна робота №6
Визначення характеристик систем функціональних пристроїв (продовження)
Варіант 15: Граф ФП=1, продуктивності з варіанту 5 (Таблиця 1 ЛР6)
"""

import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import sys
from fractions import Fraction


def get_default_variant_15():
    """Дані для варіанту 15 (Граф ФП=1, стовпець 5 таблиці ЛР6)."""
    productivities = {
        0: 6, 1: 9, 2: 5, 3: 7, 4: 12, 5: 8,
        6: 5, 7: 5, 8: 9, 9: 5, 10: 15,
        11: 9, 12: 7, 13: 8, 14: 5
    }

    # Граф ФП=1 — три підсистеми
    subsystems = {
        1: [0, 1, 2, 3, 4, 5],
        2: [6, 7, 8, 9, 10],
        3: [11, 12, 13, 14]
    }

    edges = [
        (2, 1),
        (1, 0), (1, 3),
        (0, 4), (3, 4),
        (4, 5),
        (9, 6), (9, 7),
        (6, 7), (6, 10), (6, 8),
        (7, 8),
        (13, 14), (13, 11), (13, 12),
        (14, 12), (11, 12)
    ]

    return productivities, subsystems, edges


def input_custom_data():
    """Інтерактивне введення довільних параметрів системи."""
    print("\n" + "=" * 60)
    print("  ВВЕДЕННЯ ПАРАМЕТРІВ ВРУЧНУ")
    print("=" * 60)

    while True:
        try:
            n = int(input("\nКількість функціональних пристроїв: "))
            if n < 1:
                print("Мінімум один пристрій!")
                continue
            break
        except ValueError:
            print("Потрібне ціле число!")

    productivities = {}
    print(f"\nВкажіть пікові продуктивності для {n} пристроїв:")
    for i in range(n):
        while True:
            try:
                val = float(input(f"  π_{i} = "))
                if val <= 0:
                    print("  Продуктивність повинна бути > 0!")
                    continue
                productivities[i] = val
                break
            except ValueError:
                print("  Невірний формат числа!")

    while True:
        try:
            num_sub = int(input(f"\nКількість підсистем: "))
            if num_sub < 1:
                print("Щонайменше одна!")
                continue
            break
        except ValueError:
            print("Введіть число!")

    subsystems = {}
    used = set()
    for s in range(1, num_sub + 1):
        while True:
            raw = input(f"\nНомери пристроїв підсистеми {s} (через пробіл): ")
            try:
                nodes = list(map(int, raw.split()))
                bad = [nd for nd in nodes if nd not in productivities]
                if bad:
                    print(f"  Невідомі номери: {bad}")
                    continue
                dup = set(nodes) & used
                if dup:
                    print(f"  Вже зайняті іншою підсистемою: {dup}")
                    continue
                subsystems[s] = nodes
                used.update(nodes)
                break
            except ValueError:
                print("  Числа через пробіл!")

    edges = []
    print(f"\nРебра графа (формат: 'звідки куди'). Порожній рядок = кінець:")
    while True:
        raw = input("  Ребро: ").strip()
        if not raw:
            break
        try:
            parts = raw.split()
            if len(parts) != 2:
                print("  Потрібно два числа!")
                continue
            u, v = int(parts[0]), int(parts[1])
            if u not in productivities or v not in productivities:
                print("  Немає такого пристрою!")
                continue
            edges.append((u, v))
        except ValueError:
            print("  Помилка формату!")

    return productivities, subsystems, edges


def compute_loads(productivities, subsystems):
    """Розрахунок завантаженостей і реальної продуктивності за Амдалом."""
    results = {}

    for sid, devices in subsystems.items():
        pi_vals = {d: productivities[d] for d in devices}
        pi_real = min(pi_vals.values())

        loads = {}
        for d in devices:
            loads[d] = Fraction(pi_real).limit_denominator(1000) / \
                       Fraction(productivities[d]).limit_denominator(1000)

        real_prod = len(devices) * pi_real

        results[sid] = {
            'devices': devices,
            'pi_values': pi_vals,
            'pi_real': pi_real,
            'loads': loads,
            'real_productivity': real_prod,
            'bottleneck': [d for d in devices if productivities[d] == pi_real]
        }

    return results


def compute_system_metrics(results, productivities):
    """Обчислення завантаженості системи (ρ) та прискорення (S)."""
    total_peak = sum(productivities.values())
    total_real = sum(r['real_productivity'] for r in results.values())
    max_pi = max(productivities.values())

    rho = total_real / total_peak if total_peak > 0 else 0
    speedup = total_real / max_pi if max_pi > 0 else 0

    return {
        'total_peak': total_peak,
        'total_real': total_real,
        'rho': rho,
        'max_pi': max_pi,
        'speedup': speedup
    }


def find_incompatibility(results, productivities):
    """Пошук несумісності та її джерел."""
    total_peak = sum(productivities.values())
    total_real = sum(r['real_productivity'] for r in results.values())
    delta = total_peak - total_real

    causes = []
    for sid, data in results.items():
        bv = data['pi_real']
        for d in data['devices']:
            if productivities[d] != bv:
                causes.append({
                    'subsystem': sid,
                    'device': d,
                    'peak': productivities[d],
                    'actual': bv,
                    'wasted': productivities[d] - bv
                })

    return delta, total_peak, total_real, causes


def suggest_compatible(results, productivities):
    """Формування двох варіантів сумісної конфігурації."""
    # Варіант А: зниження до мінімуму
    low = dict(productivities)
    for sid, data in results.items():
        for d in data['devices']:
            low[d] = data['pi_real']

    # Варіант Б: підвищення до максимуму
    high = dict(productivities)
    for sid, data in results.items():
        top = max(data['pi_values'].values())
        for d in data['devices']:
            high[d] = top

    return low, high


def visualize_graph(productivities, subsystems, edges, results):
    """Побудова орієнтованого графа системи."""
    G = nx.DiGraph()

    for d, pi in productivities.items():
        G.add_node(d, productivity=pi)
    for u, v in edges:
        G.add_edge(u, v)

    palette = ['#4FC3F7', '#81C784', '#FFB74D', '#CE93D8', '#EF5350']

    fig, ax = plt.subplots(1, 1, figsize=(14, 8))
    fig.patch.set_facecolor('#1a1a2e')
    ax.set_facecolor('#1a1a2e')

    # Позиції для ФП=1 (ручне розміщення)
    pos = {}
    if 0 in productivities and len(productivities) == 15:
        # Підсистема 1
        pos[2] = (1.5, 5)
        pos[1] = (1.5, 4)
        pos[0] = (0.5, 3)
        pos[3] = (2.5, 3)
        pos[4] = (1.5, 2)
        pos[5] = (1.5, 1)
        # Підсистема 2
        pos[9] = (5.5, 5)
        pos[6] = (4.5, 3.5)
        pos[7] = (6.5, 3.5)
        pos[10] = (4.5, 1.5)
        pos[8] = (6.0, 1.5)
        # Підсистема 3
        pos[13] = (9.5, 5)
        pos[14] = (8.5, 3.5)
        pos[11] = (10.5, 3.5)
        pos[12] = (9.5, 1.5)

    missing = [n for n in G.nodes if n not in pos]
    if missing:
        auto_pos = nx.spring_layout(G.subgraph(missing), seed=42)
        for n, p in auto_pos.items():
            pos[n] = (p[0] * 3 + 12, p[1] * 3 + 3)

    node_colors = []
    for node in G.nodes:
        for sid, devices in subsystems.items():
            if node in devices:
                ci = (sid - 1) % len(palette)
                clr = palette[ci]
                if results and node in results[sid]['bottleneck']:
                    clr = '#FF6B6B'
                node_colors.append(clr)
                break
        else:
            node_colors.append('#AAAAAA')

    nx.draw_networkx_edges(G, pos, ax=ax, edge_color='#CCCCCC',
                           arrows=True, arrowsize=18, arrowstyle='-|>',
                           connectionstyle='arc3,rad=0.05',
                           width=1.5, alpha=0.8)

    nx.draw_networkx_nodes(G, pos, ax=ax, node_color=node_colors,
                           node_size=900, edgecolors='white',
                           linewidths=2)

    labels = {}
    for node in G.nodes:
        pi = productivities.get(node, '?')
        labels[node] = f"{node}\nπ={pi}"
    nx.draw_networkx_labels(G, pos, labels, ax=ax,
                            font_size=8, font_color='white',
                            font_weight='bold')

    legend_handles = []
    for sid in sorted(subsystems.keys()):
        ci = (sid - 1) % len(palette)
        patch = mpatches.Patch(color=palette[ci],
                               label=f'Підсистема {sid}')
        legend_handles.append(patch)
    legend_handles.append(mpatches.Patch(color='#FF6B6B',
                                         label='Вузьке місце'))
    ax.legend(handles=legend_handles, loc='upper left',
              fontsize=9, facecolor='#2a2a4e', edgecolor='white',
              labelcolor='white')

    ax.set_title('Граф системи ФП — Варіант 15 (ФП=1), ЛР6',
                 fontsize=14, color='white', fontweight='bold', pad=15)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('graph_fp1_variant15_lr6.png', dpi=150, bbox_inches='tight',
                facecolor='#1a1a2e')
    plt.show()
    print("\n[Збережено: graph_fp1_variant15_lr6.png]")


def print_results(results, productivities):
    """Виведення усіх результатів у консоль."""
    print("\n" + "=" * 60)
    print("  РЕЗУЛЬТАТИ АНАЛІЗУ СИСТЕМИ")
    print("=" * 60)

    for sid in sorted(results.keys()):
        data = results[sid]
        print(f"\n{'─' * 50}")
        print(f"  Підсистема {sid}: {data['devices']}")
        print(f"{'─' * 50}")
        print(f"  Продуктивності: ", end="")
        print(", ".join(f"π_{d}={data['pi_values'][d]}" for d in data['devices']))
        print(f"  Робоча продуктивність π^({sid}) = {data['pi_real']}")
        print(f"  Bottleneck: {data['bottleneck']}")

        print(f"\n  Завантаженості:")
        for d in data['devices']:
            load = data['loads'][d]
            pct = float(load) * 100
            filled = int(pct / 5)
            bar = '█' * filled + '░' * (20 - filled)
            print(f"    p_{d} = {load} = {pct:.1f}%  [{bar}]")

        print(f"\n  r_{sid} = {len(data['devices'])} × {data['pi_real']} "
              f"= {data['real_productivity']}")

    # Метрики системи
    metrics = compute_system_metrics(results, productivities)
    print(f"\n{'=' * 60}")
    print(f"  ХАРАКТЕРИСТИКИ СИСТЕМИ")
    print(f"{'=' * 60}")
    print(f"  Пікова продуктивність:     Π = {metrics['total_peak']}")
    print(f"  Реальна продуктивність:    r = {metrics['total_real']}")
    print(f"  Завантаженість системи:    ρ = {metrics['total_real']}/{metrics['total_peak']}"
          f" = {metrics['rho']:.4f} ({metrics['rho']*100:.1f}%)")
    print(f"  Макс. продуктивність:      max(πᵢ) = {metrics['max_pi']}")
    print(f"  Прискорення:               S = {metrics['total_real']}/{metrics['max_pi']}"
          f" = {metrics['speedup']:.2f}")

    # Несумісність
    delta, _, _, causes = find_incompatibility(results, productivities)
    print(f"\n{'=' * 60}")
    print(f"  НЕСУМІСНІСТЬ")
    print(f"{'=' * 60}")
    print(f"  δ = Π − r = {metrics['total_peak']} − {metrics['total_real']} = {delta}")

    if causes:
        print(f"\n  Джерела втрат:")
        for c in sorted(causes, key=lambda x: x['wasted'], reverse=True):
            print(f"    • Пристрій {c['device']} (підсист. {c['subsystem']}): "
                  f"π={c['peak']}, реально={c['actual']}, "
                  f"втрата={c['wasted']}")
        sub_totals = {}
        for c in causes:
            sub_totals[c['subsystem']] = sub_totals.get(c['subsystem'], 0) + c['wasted']
        print(f"\n  По підсистемах:")
        for sid in sorted(sub_totals):
            print(f"    Підсистема {sid}: {sub_totals[sid]}")
        print(f"    Сума: {sum(sub_totals.values())} (контроль: δ={delta})")
    else:
        print("  Система повністю сумісна!")

    # Сумісні конфігурації
    low, high = suggest_compatible(results, productivities)
    print(f"\n{'=' * 60}")
    print(f"  СУМІСНА КОНФІГУРАЦІЯ")
    print(f"{'=' * 60}")

    print(f"\n  Варіант А (вирівнювання донизу):")
    for d in sorted(low.keys()):
        mark = " ← змінено" if low[d] != productivities[d] else ""
        print(f"    π_{d} = {low[d]}{mark}")
    total_low = sum(low.values())
    print(f"  Π = r = {total_low}, δ = 0, ρ = 100%")

    print(f"\n  Варіант Б (вирівнювання догори):")
    for d in sorted(high.keys()):
        mark = " ← змінено" if high[d] != productivities[d] else ""
        print(f"    π_{d} = {high[d]}{mark}")
    total_high = sum(high.values())
    print(f"  Π = r = {total_high}, δ = 0, ρ = 100%")


def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Лабораторна робота №6                                  ║")
    print("║  Характеристики систем ФП (продовження)                 ║")
    print("║  Інтелектуальна обробка даних                           ║")
    print("╚══════════════════════════════════════════════════════════╝")

    print("\nРежим:")
    print("  1 — Варіант 15 (автоматично)")
    print("  2 — Власні дані")

    choice = input("\n[1/2]: ").strip()

    if choice == '2':
        productivities, subsystems, edges = input_custom_data()
    else:
        productivities, subsystems, edges = get_default_variant_15()
        print("\n  Завантажено: варіант 15 (ФП=1, стовпець 5 таблиці ЛР6)")

    results = compute_loads(productivities, subsystems)
    print_results(results, productivities)

    print(f"\n{'=' * 60}")
    print(f"  ГРАФ СИСТЕМИ")
    print(f"{'=' * 60}")
    try:
        visualize_graph(productivities, subsystems, edges, results)
    except Exception as e:
        print(f"  Не вдалося побудувати граф: {e}")
        print("  Встановіть бібліотеки: pip install matplotlib networkx")


if __name__ == '__main__':
    main()
