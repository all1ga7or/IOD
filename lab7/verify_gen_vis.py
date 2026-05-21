import sys
import os
# Mock HAS_GRAPHICS to False for simple logic test, or handle it
from lab7 import generate_representative_structure, visualize_graph, amdahl_speedup, amdahl_efficiency
from fractions import Fraction

def test_custom_generation():
    print("Testing Custom Graph Generation...")
    N, n, s = 15, 7, 3
    tiers, edges, critical_path = generate_representative_structure(N, n, s)
    
    print(f"Nodes in tiers: {sum(len(t) for t in tiers.values())} (Expected {N})")
    print(f"Max width: {max(len(t) for t in tiers.values())} (Expected <= {s})")
    print(f"Path length: {len(critical_path)} (Expected {n})")
    
    beta = Fraction(n, N)
    R_s = amdahl_speedup(beta, s)
    E = amdahl_efficiency(R_s, s)

    # Save visualization (without plt.show blocking)
    try:
        import matplotlib
        matplotlib.use('Agg') # Non-blocking backend
        visualize_graph(tiers, edges, critical_path, N, n, s, beta, R_s, E, title_suffix="Test Verification")
        if os.path.exists('graph_custom.png'):
            print("Visualization file 'graph_custom.png' created successfully.")
        else:
            print("Failed to create 'graph_custom.png'.")
    except Exception as e:
        print(f"Graphics test skipped or failed: {e}")

if __name__ == "__main__":
    test_custom_generation()
