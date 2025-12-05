import pytest
from solver_interface import parse_solver_output

def test_parse_solver_output_simple():
    output = """
Generated Random Board: KBBNRKRNRNQNRB B
Initial Board:
+---+---+---+---+
| K | B | B | N | 
+---+---+---+---+
| R | K | R | N |
+---+---+---+---+
| R | N | Q | N |
+---+---+---+---+
| R | B |   | B |
+---+---+---+---+
"""
    boards = parse_solver_output(output)
    assert len(boards) == 1
    assert boards[0] == "KBBNRKRNRNQNRB B"

def test_parse_solver_output_multiple_moves():
    output = """
Initial Board:
+---+---+---+---+
| K |   |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+

Move 1:
+---+---+---+---+
|   | K |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
|   |   |   |   |
+---+---+---+---+
"""
    boards = parse_solver_output(output)
    assert len(boards) == 2
    assert boards[0] == "K               "
    assert boards[1] == " K              "

def test_parse_solver_output_empty():
    boards = parse_solver_output("")
    assert len(boards) == 0
