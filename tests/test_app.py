import pytest
from unittest.mock import patch, MagicMock

def test_index(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Queen's Quadrille" in response.data

@patch('solver_interface.generate_random_board')
def test_generate_api(mock_generate, client):
    mock_generate.return_value = "KBBNRKRNRNQNRB B"
    response = client.post('/api/generate')
    assert response.status_code == 200
    assert response.json == {"board": "KBBNRKRNRNQNRB B"}

@patch('solver_interface.generate_random_board')
def test_generate_api_error(mock_generate, client):
    mock_generate.side_effect = Exception("Solver failed")
    response = client.post('/api/generate')
    assert response.status_code == 500
    assert "Solver failed" in response.json['error']

@patch('solver_interface.solve_board')
def test_solve_api(mock_solve, client):
    mock_solve.return_value = (['move1'], 123.45, "raw output")
    response = client.post('/api/solve', json={"board": "test_board"})
    assert response.status_code == 200
    assert response.json['moves'] == ['move1']
    assert response.json['time'] == 123.45

@patch('solver_interface.solve_board')
def test_solve_api_no_board(mock_solve, client):
    response = client.post('/api/solve', json={})
    assert response.status_code == 400
    assert "No board provided" in response.json['error']
