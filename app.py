import os
from flask import Flask, render_template, request, jsonify
import solver_interface

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        board_str = solver_interface.generate_random_board()
        return jsonify({"board": board_str})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json
    board = data.get('board')
    targets = data.get('targets', [])
    
    if not board:
        return jsonify({"error": "No board provided"}), 400
        
    # If board is a list (from previous solution steps), join it
    if isinstance(board, list):
        board = "".join(board)
        
    try:
        moves, time_ms, output = solver_interface.solve_board(board, targets)
        return jsonify({
            "moves": moves,
            "time": time_ms,
            "raw_output": output
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
