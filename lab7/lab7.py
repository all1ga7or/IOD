"""
Лабораторна робота №7
Визначення максимально можливого прискорення і ефективності системи
Варіант 15: Рисунок 5 — граф алгоритму
"""

import sys
import io
from fractions import Fraction

# --- Windows cp1251 fix ---
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stdin  = io.TextIOWrapper(sys.stdin.buffer,  encoding='utf-8', errors='replace')
except Exception:
    pass

try:
    import networkx as nx
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    HAS_GRAPHICS = True
except ImportError:
    HAS_GRAPHICS = False


# ─────────── Дані варіанту 15 (Рисунок 5) ───────────

def get_variant_15_defaults():
    """Повертає N, n, s і структуру графа для Рисунку 5."""
    N = 20   # загальна кількість операцій
    n = 10   # послідовних (критичний шлях)
    s = 5    # ширина алгоритму = кількість процесорів

    # Граф Рисунку 5 — вершини 1..20, розбиті по ярусах:
    #   Ярус 1:  {1}
    #   Ярус 2:  {2}
    #   Ярус 3:  {3, 4, 5, 6, 7}   ← ширина 5
    #   Ярус 4:  {8, 9}            ← продовження гілок 3→8, 7→9
    #   Ярус 5:  {10}              ← збір
    #   Ярус 6:  {11}
    #   Ярус 7:  {12, 13, 14, 15, 16}  ← ширина 5
    #   Ярус 8:  {17, 18}          ← продовження гілок 12→17, 16→18
    #   Ярус 9:  {19}              ← збір
    #   Ярус 10: {20}
    tiers = {
        1:  [1],
        2:  [2],
        3:  [3, 4, 5, 6, 7],
        4:  [8, 9],
        5:  [10],
        6:  [11],
        7:  [12, 13, 14, 15, 16],
        8:  [17, 18],
        9:  [19],
        10: [20],
    }

    edges = [
        (1, 2),
        # ярус 2 → ярус 3
        (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
        # продовження гілок (ярус 3 → ярус 4)
        (3, 8), (7, 9),
        # короткі гілки прямо до збору (ярус 3 → ярус 5)
        (4, 10), (5, 10), (6, 10),
        # довгі гілки до збору (ярус 4 → ярус 5)
        (8, 10), (9, 10),
        # ярус 5 → ярус 6
        (10, 11),
        # ярус 6 → ярус 7
        (11, 12), (11, 13), (11, 14), (11, 15), (11, 16),
        # продовження гілок (ярус 7 → ярус 8)
        (12, 17), (16, 18),
        # короткі гілки прямо до збору (ярус 7 → ярус 9)
        (13, 19), (14, 19), (15, 19),
        # довгі гілки до збору (ярус 8 → ярус 9)
        (17, 19), (18, 19),
        # ярус 9 → ярус 10
        (19, 20),
    ]

    critical_path = [1, 2, 3, 8, 10, 11, 12, 17, 19, 20]

    return N, n, s, tiers, edges, critical_path


def generate_representative_structure(N, n, s):
    """
    Generates a representative graph structure for given N, n, s.
    n - number of tiers (critical path).
    N - total vertices.
    s - max width (processors).
    """
    # 1. Create n tiers. Each has at least 1 node (the critical chain).
    tiers = {i: [i] for i in range(1, n + 1)}
    
    # 2. Distribute leftover N-n nodes into tiers (prefer middle tiers).
    remaining = N - n
    curr_node = n + 1
    
    # Target middle tiers (2 to n-1) to preserve critical path length n.
    target_tiers = list(range(2, n)) if n > 2 else [1, n] if n > 1 else [1]
    
    # Keep filling until we run out of nodes or space (width s)
    while remaining > 0:
        added_in_round = 0
        for t in target_tiers:
            if remaining <= 0: break
            if len(tiers[t]) < s:
                tiers[t].append(curr_node)
                curr_node += 1
                remaining -= 1
                added_in_round += 1
        if added_in_round == 0: break # No more space in tiers satisfying width s/path n

    # Edges logic
    edges = []
    # Main critical chain edges
    for i in range(1, n):
        edges.append((i, i + 1))
    
    # Connect extra nodes
    for t, nodes in tiers.items():
        for node in nodes[1:]: # These are the parallel nodes
            if t > 1:
                # Connected FROM lead node of previous tier
                edges.append((tiers[t-1][0], node))
            if t < n:
                # Connected TO lead node of next tier
                edges.append((node, tiers[t+1][0]))
            elif t == n and n > 1:
                 # If extra node in last tier, connect from previous
                 edges.append((tiers[t-1][0], node))

    critical_path = list(range(1, n + 1))
    return tiers, edges, critical_path


# ─────────── Обчислення за Амдалом ───────────

def amdahl_speedup(beta, s):
    """Другий закон Амдала: R_s = s / (β·s + 1 − β)."""
    return Fraction(s) / (beta * s + (1 - beta))


def amdahl_efficiency(R_s, s):
    """Ефективність: E = R_s / s."""
    return Fraction(R_s) / s


def amdahl_max_speedup(beta):
    """Третій закон Амдала: R_max = 1/β."""
    if beta == 0:
        return float('inf')
    return Fraction(1) / beta


# ─────────── Режими введення ───────────

def input_manual():
    """Ручне введення параметрів через консоль."""
    print("\n" + "=" * 55)
    print("  ВВЕДЕННЯ ПАРАМЕТРІВ")
    print("=" * 55)

    while True:
        try:
            N = int(input("\n  Кількість операцій (N): "))
            if N < 1:
                print("  N має бути ≥ 1!")
                continue
            break
        except ValueError:
            print("  Потрібне ціле число!")

    while True:
        try:
            n = int(input("  Послідовних операцій (n): "))
            if n < 1 or n > N:
                print(f"  n має бути від 1 до {N}!")
                continue
            break
        except ValueError:
            print("  Ціле число!")

    while True:
        try:
            s = int(input("  Кількість процесорів (s): "))
            if s < 1:
                print("  s має бути ≥ 1!")
                continue
            break
        except ValueError:
            print("  Ціле число!")

    return N, n, s


def load_from_file(path):
    """
    Зчитування параметрів з текстового файлу.
    Формат файлу — три рядки:
        N=20
        n=10
        s=5
    """
    params = {}
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                params[key.strip().lower()] = int(val.strip())

    N = params.get('n_total') or params.get('n', None)
    # Handle ambiguity: if both 'n' and 'n_seq' present, n is total
    n_seq = params.get('n_seq') or params.get('n', None)
    s = params.get('s', None)

    # Fallback: ordered values
    if N is None or n_seq is None or s is None:
        # try positional
        with open(path, 'r', encoding='utf-8') as f:
            vals = []
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' not in line:
                    try:
                        vals.append(int(line))
                    except ValueError:
                        pass
            if len(vals) >= 3:
                N, n_seq, s = vals[0], vals[1], vals[2]

    if N is None or n_seq is None or s is None:
        raise ValueError(
            "Не вдалося прочитати параметри. Формат файлу:\n"
            "  N_total=20\n  n_seq=10\n  s=5"
        )

    return N, n_seq, s


# ─────────── Візуалізація ───────────

def visualize_graph(tiers, edges, critical_path, N, n, s, beta, R_s, E, title_suffix=""):
    """Builds a layered graph visualization."""
    if not HAS_GRAPHICS:
        print("\n  ! matplotlib / networkx missing. Install: pip install matplotlib networkx")
        return

    G = nx.DiGraph()
    for tier_nodes in tiers.values():
        for node in tier_nodes:
            G.add_node(node)
    for u, v in edges:
        G.add_edge(u, v)

    # Position calculation based on tiers
    pos = {}
    for tier_idx, nodes in tiers.items():
        x = tier_idx * 2.5
        count = len(nodes)
        for i, node in enumerate(nodes):
            y = (count - 1) / 2.0 - i
            pos[node] = (x, y)

    crit_set = set(critical_path)
    tier_palette = ['#5DADE2', '#48C9B0', '#F4D03F', '#EB984E', '#AF7AC5', '#A569BD', '#52BE80']
    
    node_colors = []
    node_edge_colors = []
    for node in G.nodes:
        if node in crit_set:
            node_colors.append('#E74C3C') # Red for critical path
            node_edge_colors.append('white')
        else:
            # Color by tier
            for t_idx, t_nodes in tiers.items():
                if node in t_nodes:
                    node_colors.append(tier_palette[(t_idx - 1) % len(tier_palette)])
                    node_edge_colors.append('#BBBBBB')
                    break
            else:
                node_colors.append('#AAAAAA')
                node_edge_colors.append('#BBBBBB')

    fig, ax = plt.subplots(figsize=(15, 8))
    fig.patch.set_facecolor('#1a1a2e')
    ax.set_facecolor('#1a1a2e')

    nx.draw_networkx_edges(G, pos, ax=ax, edge_color='#888888', arrows=True, arrowsize=15, 
                           width=1.2, alpha=0.7, connectionstyle='arc3,rad=0.04')

    # Bold edges for critical path
    crit_edges = list(zip(critical_path[:-1], critical_path[1:]))
    nx.draw_networkx_edges(G, pos, edgelist=crit_edges, ax=ax, edge_color='#E74C3C', 
                           arrows=True, arrowsize=18, width=2.5, alpha=1.0)

    nx.draw_networkx_nodes(G, pos, ax=ax, node_color=node_colors, node_size=600, 
                           edgecolors=node_edge_colors, linewidths=1.5)

    nx.draw_networkx_labels(G, pos, {n:str(n) for n in G.nodes}, ax=ax, 
                            font_size=8, font_color='white', font_weight='bold')

    handles = [mpatches.Patch(color='#E74C3C', label='Kryt. shliakh'), 
               mpatches.Patch(color='#5DADE2', label='Paral. operatsii')]
    ax.legend(handles=handles, loc='upper left', fontsize=9, facecolor='#2a2a4e', labelcolor='white')

    info = f"N={N}, n={n}, s={s}, R={float(R_s):.3f}, E={float(E)*100:.1f}%"
    ax.set_title(f"Graph Visualization {title_suffix}\n{info}", color='white', fontweight='bold', pad=10)

    ax.axis('off')
    plt.tight_layout()
    # Save with unique name
    out_name = "graph_variant15.png" if "15" in title_suffix else "graph_custom.png"
    plt.savefig(out_name, dpi=120, bbox_inches='tight', facecolor='#1a1a2e')
    plt.show()
    print(f"\n  [Saved: {out_name}]")


# ─────────── Виведення результатів ───────────

def print_report(N, n, s, beta, R_s, E, R_max):
    """Форматований вивід усіх обчислень."""
    print("\n" + "=" * 55)
    print("  РЕЗУЛЬТАТИ  (закони Амдала)")
    print("=" * 55)

    print(f"\n  Загальна кількість операцій:  N = {N}")
    print(f"  Послідовних операцій:         n = {n}")
    print(f"  Кількість процесорів:         s = {s}")

    print(f"\n{'-' * 55}")
    print(f"  Частка послідовних обчислень:")
    print(f"    β = n / N = {n} / {N} = {beta}")
    print(f"    β = {float(beta):.4f}")

    print(f"\n{'-' * 55}")
    print(f"  Прискорення (2-й закон Амдала):")
    print(f"    R_s = s / (b*s + (1 - b))")
    denom = beta * s + (1 - beta)
    print(f"    R_{s} = {s} / ({beta}·{s} + {1 - beta})")
    print(f"        = {s} / ({beta * s} + {1 - beta})")
    print(f"        = {s} / {denom}")
    print(f"        = {R_s}")
    print(f"    R_{s} = {float(R_s):.4f}")

    print(f"\n{'-' * 55}")
    print(f"  Hranychne pryskorennia (3-j zakon Amdala):")
    print(f"    R_max = 1 / b = 1 / {beta} = {R_max}")
    print(f"    R_{s} = {float(R_s):.4f} < {float(R_max):.4f}  [OK]")

    print(f"\n{'-' * 55}")
    print(f"  Efektyvnist:")
    print(f"    E = R_s / s = {R_s} / {s} = {E}")
    print(f"    E = {float(E):.4f}  ({float(E)*100:.2f}%)")

    print(f"\n{'-' * 55}")
    print(f"  Minimalna kilkist procesoriv:")
    print(f"    s_min = shyryna alhorytmu = {s}")

    print(f"\n{'=' * 55}")
    print(f"  +--------------------------------------------+")
    print(f"  |  N = {N:<5}  n = {n:<5}  s = {s:<5}         |")
    print(f"  |  b = {str(beta):<10}                       |")
    print(f"  |  R_{s} = {str(R_s):<10}  = {float(R_s):<10.4f}    |")
    print(f"  |  R_max = {str(R_max):<10}                   |")
    print(f"  |  E   = {str(E):<10}  = {float(E)*100:<6.2f}%    |")
    print(f"  +--------------------------------------------+")


# ─────────── Головна функція ───────────

def main():
    print("=" * 57)
    print("  Laboratorna robota #7")
    print("  Pryskorennia i efektyvnist za zakonamy Amdala")
    print("  Intelektualna obrobka danykh")
    print("=" * 57)

    print("\nOberit rezhym:")
    print("  1 -- Variant 15 (Rysunok 5, avtomatychno)")
    print("  2 -- Vvesty parametry vruchnu")
    print("  3 -- Zchytaty z fajlu")

    choice = input("\n[1/2/3]: ").strip()

    tiers = None
    graph_edges = None
    critical_path = None

    if choice == '2':
        N, n, s = input_manual()
    elif choice == '3':
        path = input("\n  Шлях до файлу: ").strip()
        try:
            N, n, s = load_from_file(path)
            print(f"\n  Завантажено: N={N}, n={n}, s={s}")
        except Exception as e:
            print(f"\n  Помилка: {e}")
            return
    else:
        N, n, s, tiers, graph_edges, critical_path = get_variant_15_defaults()
        print("\n  Zavantazheno: variant 15 (Rysunok 5)")

    # Обчислення
    beta = Fraction(n, N)
    R_s = amdahl_speedup(beta, s)
    E = amdahl_efficiency(R_s, s)
    R_max = amdahl_max_speedup(beta)

    # Виведення
    print_report(N, n, s, beta, R_s, E, R_max)

    # Vizualizatsiia
    print(f"\n{'=' * 55}")
    print(f"  VIZUALIZATSIIA")
    print(f"{'=' * 55}")
    
    if not tiers or not graph_edges:
        # Generate structure for custom input
        tiers, graph_edges, critical_path = generate_representative_structure(N, n, s)
        suffix = f"(Custom N={N}, n={n}, s={s})"
    else:
        suffix = "(Variant 15)"

    try:
        visualize_graph(
            tiers, graph_edges, critical_path,
            N, n, s, beta, R_s, E, title_suffix=suffix
        )
    except Exception as e:
        print(f"  Graf error: {e}")


if __name__ == '__main__':
    main()
