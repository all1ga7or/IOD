import sys
import io
from lab7 import get_variant_15_defaults, amdahl_speedup, amdahl_efficiency, amdahl_max_speedup, print_report
from fractions import Fraction

# Ensure UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_variant_15():
    print("Testing Lab 7 - Variant 15 (Figure 5)")
    N, n, s, tiers, edges, critical_path = get_variant_15_defaults()
    
    beta = Fraction(n, N)
    R_s = amdahl_speedup(beta, s)
    E = amdahl_efficiency(R_s, s)
    R_max = amdahl_max_speedup(beta)
    
    print_report(N, n, s, beta, R_s, E, R_max)
    
    # Assertions for correctness
    assert N == 20
    assert n == 10
    assert s == 5
    assert beta == 0.5
    assert float(R_s) == 5/3
    assert float(E) == 1/3
    assert R_max == 2
    
    print("\nVerification successful: All calculations match expected values.")

if __name__ == "__main__":
    test_variant_15()
