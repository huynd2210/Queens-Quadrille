import os
import subprocess
import json
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

SOLVER_PATH = os.path.join(os.getcwd(), "queens_quadrille_solver.exe")

def parse_solver_output(output):
    lines = output.strip().split('\n')
    moves = []
    current_board = []
    parsing_board = False
    
    # Simple parsing logic: look for +---+ lines
    # This is a bit fragile, but works for the current output format
    
    # We need to extract the board states.
    # The output contains "Move X:" followed by the board.
    
    # Let's iterate and collect boards
    
    full_output = "\n".join(lines)
    # Split by "Move "
    parts = full_output.split("Move ")
    
    # The first part might contain "Initial Board:"
    if "Initial Board:" in parts[0]:
        initial_part = parts[0].split("Initial Board:")[1]
        # Extract the first board
        # A board is 9 lines (4 rows + 5 separators)
        # Actually, let's just regex or simple line scanning for the grid
        pass

    # Better approach: Scan lines, capture 4x4 grids
    
    captured_boards = []
    current_grid = []
    
    for line in lines:
        if "+---+" in line:
            continue
        if line.strip().startswith("|"):
            # It's a row
            # | Q | K | B | B |
            # Remove | and split
            # Handle trailing whitespace by stripping first
            row_content = line.strip().strip("|").split("|")
            # Clean up whitespace
            row_clean = [x.strip() if x.strip() else " " for x in row_content]
            # row_clean should be length 4
            # Reconstruct row string for internal rep if needed, or just keep 2D
            current_grid.extend(row_clean)
            
            if len(current_grid) == 16:
                captured_boards.append(current_grid)
                current_grid = []
                
    return captured_boards

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate():
    # We can use the solver exe with "random" argument to get a board
    # But the solver also solves it immediately. 
    # We just want the board string.
    # Let's just run it and parse the "Generated Random Board: ..." line
    
    # Ensure MSYS2 bin is in PATH for DLLs
    env = os.environ.copy()
    msys_bin = r"C:\msys64\ucrt64\bin"
    if msys_bin not in env["PATH"]:
        env["PATH"] = msys_bin + os.pathsep + env["PATH"]

    try:
        # Run with a dummy target to just get the board? 
        # Actually, we can just run `queens_quadrille_solver.exe random` and grab the first line
        result = subprocess.run([SOLVER_PATH, "random"], capture_output=True, text=True, env=env)
        output = result.stdout
        
        board_str = ""
        for line in output.split('\n'):
            if line.startswith("Generated Random Board: "):
                # Extract board string, preserving spaces but removing newlines
                board_str = line[len("Generated Random Board: "):].strip('\r\n')
                break
        
        if not board_str:
            return jsonify({"error": "Could not generate board"}), 500
            
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
        
    # Construct command
    cmd = [SOLVER_PATH, board]
    
    if targets:
        # Join targets with comma
        targets_str = ",".join(map(str, targets))
        cmd.append(targets_str)
    else:
        # Default to 15 if no targets provided, or handle as per solver default
        pass

    # Ensure MSYS2 bin is in PATH for DLLs
    env = os.environ.copy()
    msys_bin = r"C:\msys64\ucrt64\bin"
    if msys_bin not in env["PATH"]:
        env["PATH"] = msys_bin + os.pathsep + env["PATH"]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env)
        output = result.stdout
        
        # Parse output to get moves
        moves = parse_solver_output(output)
        
        # Also extract time if possible
        time_ms = 0.0
        for line in output.split('\n'):
            if "Total Time:" in line:
                try:
                    time_ms = float(line.split(":")[1].strip().replace("ms", ""))
                except:
                    pass
                    
        return jsonify({
            "moves": moves,
            "time": time_ms,
            "raw_output": output
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
