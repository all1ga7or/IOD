"""
Лабораторна робота №5
Визначення характеристик систем функціональних пристроїв
Варіант 15: Граф ФП=1, продуктивності з варіанту 5
"""

import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import sys
from fractions import Fraction


def get_default_variant_15():
    """Повертає дані для варіанту 15 (Граф ФП=1, продуктивності з варіанту 5)."""
    # Продуктивності з таблиці 1, варіант 5
    productivities = {
        0: 5, 1: 15, 2: 4, 3: 8, 4: 10, 5: 8,
        6: 5, 7: 7, 8: 6, 9: 9, 10: 12,
        11: 8, 12: 5, 13: 9, 14: 7
    }

    # Граф ФП=1 (Рисунок 3) — три підсистеми
    # Підсистема 1: вузли 0,1,2,3,4,5
    # Підсистема 2: вузли 6,7,8,9,10
    # Підсистема 3: вузли 11,12,13,14
    subsystems = {
        1: [0, 1, 2, 3, 4, 5],
        2: [6, 7, 8, 9, 10],
        3: [11, 12, 13, 14]
    }

    # Ребра графа ФП=1
    edges = [
        (0, 1),
        (1, 2), (1, 3),
        (2, 4), (3, 4),
        (4, 5),
        (9, 6), (9, 7),
        (6, 7), (6, 10), (6, 8),
        (7, 8),
        (13, 14), (13, 11), (13, 12),
        (14, 12), (11, 12)
    ]

    return productivities, subsystems, edges


def input_custom_data():
    """Інтерактивне введення даних користувачем."""
    print("\n" + "=" * 60)
    print("  ІНТЕРАКТИВНИЙ РЕЖИМ ВВЕДЕННЯ ДАНИХ")
    print("=" * 60)

    # Кількість пристроїв
    while True:
        try:
            n = int(input("\nСкільки всього функціональних пристроїв? "))
            if n < 1:
                print("Потрібен хоча б один пристрій!")
                continue
            break
        except ValueError:
            print("Введіть ціле число!")

    # Продуктивності
    productivities = {}
    print(f"\nВведіть пікові продуктивності для {n} пристроїв:")
    for i in range(n):
        while True:
            try:
                val = float(input(f"  π_{i} = "))
                if val <= 0:
                    print("  Продуктивність має бути додатною!")
                    continue
                productivities[i] = val
                break
            except ValueError:
                print("  Некоректне число!")

    # Підсистеми
    while True:
        try:
            num_sub = int(input(f"\nСкільки незалежних підсистем? "))
            if num_sub < 1:
                print("Має бути хоча б одна підсистема!")
                continue
            break
        except ValueError:
            print("Введіть ціле число!")

    subsystems = {}
    used_nodes = set()
    for s in range(1, num_sub + 1):
        while True:
            raw = input(f"\nПристрої підсистеми {s} (через пробіл): ")
            try:
                nodes = list(map(int, raw.split()))
                invalid = [nd for nd in nodes if nd not in productivities]
                if invalid:
                    print(f"  Невідомі пристрої: {invalid}")
                    continue
                overlap = set(nodes) & used_nodes
                if overlap:
                    print(f"  Пристрої {overlap} вже належать іншій підсистемі!")
                    continue
                subsystems[s] = nodes
                used_nodes.update(nodes)
                break
            except ValueError:
                print("  Вводьте числа через пробіл!")

    # Ребра
    edges = []
    print(f"\nВведіть ребра графа (формат: 'з куди', порожній рядок — завершити):")
    while True:
        raw = input("  Ребро: ").strip()
        if not raw:
            break
        try:
            parts = raw.split()
            if len(parts) != 2:
                print("  Формат: два числа через пробіл (напр.: 0 1)")
                continue
            u, v = int(parts[0]), int(parts[1])
            if u not in productivities or v not in productivities:
                print("  Такого пристрою не існує!")
                continue
            edges.append((u, v))
        except ValueError:
            print("  Некоректний формат!")

    return productivities, subsystems, edges


def compute_loads(productivities, subsystems):
    """
    Обчислення завантаженостей та реальної продуктивності
    за першим законом Амдала.
    """
    results = {}

    for sub_id, devices in subsystems.items():
        pi_values = {d: productivities[d] for d in devices}
        pi_real = min(pi_values.values())

        loads = {}
        for d in devices:
            loads[d] = Fraction(pi_real).limit_denominator(1000) / Fraction(productivities[d]).limit_denominator(1000)

        real_prod = len(devices) * pi_real

        results[sub_id] = {
            'devices': devices,
            'pi_values': pi_values,
            'pi_real': pi_real,
            'loads': loads,
            'real_productivity': real_prod,
            'bottleneck': [d for d in devices if productivities[d] == pi_real]
        }

    return results


def find_incompatibility(results, productivities):
    """Знаходження несумісності та її причин."""
    total_peak = sum(productivities.values())
    total_real = sum(r['real_productivity'] for r in results.values())
    incompatibility = total_peak - total_real

    causes = []
    for sub_id, data in results.items():
        bottleneck_val = data['pi_real']
        for d in data['devices']:
            if productivities[d] != bottleneck_val:
                wasted = productivities[d] - bottleneck_val
                causes.append({
                    'subsystem': sub_id,
                    'device': d,
                    'peak': productivities[d],
                    'actual': bottleneck_val,
                    'wasted': wasted
                })

    return incompatibility, total_peak, total_real, causes


def suggest_compatible(results, productivities):
    """Запропонувати значення продуктивностей для сумісної системи."""
    suggestion = dict(productivities)
    for sub_id, data in results.items():
        target = data['pi_real']
        for d in data['devices']:
            suggestion[d] = target
    return suggestion


def visualize_graph(productivities, subsystems, edges, results):
    """Візуалізація графа системи функціональних пристроїв."""
    G = nx.DiGraph()

    for d, pi in productivities.items():
        G.add_node(d, productivity=pi)
    for u, v in edges:
        G.add_edge(u, v)

    colors_palette = ['#4FC3F7', '#81C784', '#FFB74D', '#CE93D8', '#EF5350']

    fig, ax = plt.subplots(1, 1, figsize=(14, 8))
    fig.patch.set_facecolor('#1a1a2e')
    ax.set_facecolor('#1a1a2e')

    # Позиції вузлів (ручне розташування для ФП=1)
    pos = {}
    # Підсистема 1
    if 0 in productivities:
        pos[0] = (1.5, 5)
        pos[1] = (1.5, 4)
        pos[2] = (0.5, 3)
        pos[3] = (2.5, 3)
        pos[4] = (1.5, 2)
        pos[5] = (1.5, 1)

    # Підсистема 2
    if 9 in productivities:
        pos[9] = (5.5, 5)
        pos[6] = (4.5, 3.5)
        pos[7] = (6.5, 3.5)
        if 10 in productivities:
            pos[10] = (4.5, 1.5)
        pos[8] = (5.5, 1.5)

    # Підсистема 3
    if 13 in productivities:
        pos[13] = (9.5, 5)
        pos[14] = (8.5, 3.5)
        pos[11] = (10.5, 3.5)
        pos[12] = (9.5, 1.5)

    # Якщо є вузли без позицій, розташувати авто
    missing = [n for n in G.nodes if n not in pos]
    if missing:
        auto_pos = nx.spring_layout(G.subgraph(missing), seed=42)
        for n, p in auto_pos.items():
            pos[n] = (p[0] * 3 + 12, p[1] * 3 + 3)

    node_colors = []
    for node in G.nodes:
        for sub_id, devices in subsystems.items():
            if node in devices:
                cidx = (sub_id - 1) % len(colors_palette)
                color = colors_palette[cidx]
                # Bottleneck виділяємо яскравіше
                if results and node in results[sub_id]['bottleneck']:
                    color = '#FF6B6B'
                node_colors.append(color)
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

    # Легенда
    legend_handles = []
    for sub_id in sorted(subsystems.keys()):
        cidx = (sub_id - 1) % len(colors_palette)
        patch = mpatches.Patch(color=colors_palette[cidx],
                               label=f'Підсистема {sub_id}')
        legend_handles.append(patch)
    legend_handles.append(mpatches.Patch(color='#FF6B6B',
                                         label='Вузьке місце (bottleneck)'))
    ax.legend(handles=legend_handles, loc='upper left',
              fontsize=9, facecolor='#2a2a4e', edgecolor='white',
              labelcolor='white')

    ax.set_title('Граф системи функціональних пристроїв (Варіант 15, ФП=1)',
                 fontsize=14, color='white', fontweight='bold', pad=15)
    ax.axis('off')
    plt.tight_layout()
    plt.savefig('graph_fp1_variant15.png', dpi=150, bbox_inches='tight',
                facecolor='#1a1a2e')
    plt.show()
    print("\n[Граф збережено у файл graph_fp1_variant15.png]")


def print_results(results, productivities):
    """Виведення результатів обчислень."""
    print("\n" + "=" * 60)
    print("  РЕЗУЛЬТАТИ ОБЧИСЛЕНЬ")
    print("=" * 60)

    for sub_id in sorted(results.keys()):
        data = results[sub_id]
        print(f"\n{'─' * 50}")
        print(f"  Підсистема {sub_id}: пристрої {data['devices']}")
        print(f"{'─' * 50}")
        print(f"  Пікові продуктивності: ", end="")
        print(", ".join(f"π_{d}={data['pi_values'][d]}" for d in data['devices']))
        print(f"  Реальна продуктивність підсистеми (π^({sub_id})): "
              f"min = {data['pi_real']}")
        print(f"  Вузьке місце: пристрої {data['bottleneck']}")

        print(f"\n  Завантаженості пристроїв:")
        for d in data['devices']:
            load = data['loads'][d]
            pct = float(load) * 100
            bar_len = int(pct / 5)
            bar = '█' * bar_len + '░' * (20 - bar_len)
            print(f"    p_{d} = {load} = {pct:.1f}%  [{bar}]")

        print(f"\n  r_{sub_id} = {len(data['devices'])} × {data['pi_real']} "
              f"= {data['real_productivity']}")

    # Загальна продуктивність
    total_real = sum(r['real_productivity'] for r in results.values())
    total_peak = sum(productivities.values())
    print(f"\n{'=' * 60}")
    print(f"  ЗАГАЛЬНА ПРОДУКТИВНІСТЬ СИСТЕМИ")
    print(f"{'=' * 60}")
    print(f"  Пікова (сумарна): Π = {total_peak}")
    print(f"  Реальна:          r = {total_real}")
    print(f"  Ефективність:     η = {total_real}/{total_peak} "
          f"= {total_real/total_peak:.4f} ({total_real/total_peak*100:.1f}%)")

    # Несумісність
    incomp, _, _, causes = find_incompatibility(results, productivities)
    print(f"\n{'=' * 60}")
    print(f"  НЕСУМІСНІСТЬ СИСТЕМИ")
    print(f"{'=' * 60}")
    print(f"  Несумісність (δ): Π - r = {total_peak} - {total_real} = {incomp}")

    if causes:
        print(f"\n  Причини несумісності:")
        for c in causes:
            print(f"    • Пристрій {c['device']} (підсистема {c['subsystem']}): "
                  f"π={c['peak']}, працює з π={c['actual']}, "
                  f"втрачає {c['wasted']} од. продуктивності")
    else:
        print("  Система повністю сумісна!")

    # Пропозиція для сумісної системи
    suggestion = suggest_compatible(results, productivities)
    print(f"\n{'=' * 60}")
    print(f"  СУМІСНА КОНФІГУРАЦІЯ (пропозиція)")
    print(f"{'=' * 60}")
    print(f"  Щоб усунути несумісність, продуктивності мають бути:")
    for d in sorted(suggestion.keys()):
        changed = " ← змінено" if suggestion[d] != productivities[d] else ""
        print(f"    π_{d} = {suggestion[d]}{changed}")

    total_compatible = sum(suggestion.values())
    print(f"\n  При цьому: Π_сумісна = {total_compatible}, r_сумісна = {total_compatible}")
    print(f"  Несумісність = 0, ефективність = 100%")


def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Лабораторна робота №5                                  ║")
    print("║  Визначення характеристик систем ФП                     ║")
    print("║  Інтелектуальна обробка даних                           ║")
    print("╚══════════════════════════════════════════════════════════╝")

    print("\nОберіть режим роботи:")
    print("  1 — Варіант 15 (за замовчуванням)")
    print("  2 — Введення даних вручну")

    choice = input("\nВаш вибір [1/2]: ").strip()

    if choice == '2':
        productivities, subsystems, edges = input_custom_data()
    else:
        productivities, subsystems, edges = get_default_variant_15()
        print("\n  Завантажено варіант 15 (Граф ФП=1, продуктивності з варіанту 5)")

    # Обчислення
    results = compute_loads(productivities, subsystems)

    # Виведення
    print_results(results, productivities)

    # Візуалізація
    print(f"\n{'=' * 60}")
    print(f"  ВІЗУАЛІЗАЦІЯ ГРАФА")
    print(f"{'=' * 60}")
    try:
        visualize_graph(productivities, subsystems, edges, results)
    except Exception as e:
        print(f"  Помилка візуалізації: {e}")
        print("  Переконайтесь, що встановлено matplotlib та networkx")
        print("  pip install matplotlib networkx")


if __name__ == '__main__':
    main()
