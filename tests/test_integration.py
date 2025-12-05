import pytest
import solver_interface
import os

# Skip if solver executable is missing
@pytest.mark.skipif(not os.path.exists(solver_interface.SOLVER_PATH), reason="Solver executable not found")
def test_real_generate_random_board():
    board = solver_interface.generate_random_board()
    assert len(board) == 16
    # Should contain valid characters
    valid_chars = set("KQBNR ")
    assert all(c in valid_chars for c in board)

@pytest.mark.skipif(not os.path.exists(solver_interface.SOLVER_PATH), reason="Solver executable not found")
def test_real_solve_board():
    # Use a known simple board or random one
    # Let's try to solve a random board. It might fail if unsolvable, but the command should run.
    # Actually, let's use the example from test_solver.py output if possible, or just a simple one.
    # "KBBNRKRNRNQNRB B"
    board = "KBBNRKRNRNQNRB B"
    moves, time_ms, output = solver_interface.solve_board(board)
    
    # We expect some output
    assert output is not None
    # If it found a solution, moves should be a list of boards
    # If no solution, it might be empty or contain just initial board?
    # The solver prints "No solution found" or similar?
    # Let's just check that it didn't crash.
    assert isinstance(moves, list)
    assert isinstance(time_ms, float)
