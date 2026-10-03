"""Exact 3-qubit Quantum Fourier Transform.

Uses the standard decomposition:
H, controlled-R2, controlled-R3, H, controlled-R2, H,
followed by a final swap for bit reversal.
"""

from __future__ import annotations
import cmath
import math
from typing import Sequence

SQRT8 = math.sqrt(8.0)


def qft3_matrix() -> list[list[complex]]:
    """Return the exact 8x8 QFT matrix."""
    return [
        [cmath.exp(2j * math.pi * x * y / 8.0) / SQRT8 for y in range(8)]
        for x in range(8)
    ]


def apply_qft3(state: Sequence[complex]) -> list[complex]:
    """Apply QFT_8 to an 8-amplitude state vector."""
    if len(state) != 8:
        raise ValueError("3-qubit QFT requires exactly 8 amplitudes.")
    return [
        sum(qft3_matrix()[x][y] * state[x] for x in range(8))
        for y in range(8)
    ]


def basis_state(index: int) -> list[complex]:
    """Return computational basis state |index>, 0 <= index < 8."""
    if not 0 <= index < 8:
        raise ValueError("Basis index must be in [0, 7].")
    state = [0j] * 8
    state[index] = 1 + 0j
    return state
