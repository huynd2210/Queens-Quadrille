import os
import subprocess
import platform

if platform.system() == "Windows":
    SOLVER_NAME = "queens_quadrille_solver.exe"
else:
    SOLVER_NAME = "queens_quadrille_solver"

SOLVER_PATH = os.path.join(os.getcwd(), SOLVER_NAME)

def get_msys_env():
    env = os.environ.copy()
    msys_bin = r"C:\msys64\ucrt64\bin"
    if msys_bin not in env["PATH"]:
        env["PATH"] = msys_bin + os.pathsep + env["PATH"]
    return env

def run_solver_command(args):
    """
    Executes the solver with the given arguments.
    Returns the stdout output or raises an exception.
    """
    env = get_msys_env()
    try:
        result = subprocess.run([SOLVER_PATH] + args, capture_output=True, text=True, env=env)
        if result.returncode != 0:
            raise Exception(f"Solver failed with code {result.returncode}: {result.stderr}")
        return result.stdout
    except FileNotFoundError:
        raise Exception(f"Solver executable not found at {SOLVER_PATH}")
    except Exception as e:
        raise e

def parse_solver_output(output):
    lines = output.strip().split('\n')
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
            current_grid.extend(row_clean)
            
            if len(current_grid) == 16:
                captured_boards.append("".join(current_grid))
                current_grid = []
                
    return captured_boards

def generate_random_board():
    """
    Runs the solver with 'random' argument and extracts the generated board string.
    """
    output = run_solver_command(["random"])
    
    for line in output.split('\n'):
        if line.startswith("Generated Random Board: "):
            # Extract board string, preserving spaces but removing newlines
            return line[len("Generated Random Board: "):].strip('\r\n')
    
    raise Exception("Could not find generated board in output")

def solve_board(board_str, targets=None):
    """
    Runs the solver on the given board string.
    Returns a tuple (moves, time_ms, raw_output).
    """
    cmd_args = [board_str]
    if targets:
        # Join targets with comma
        targets_str = ",".join(map(str, targets))
        cmd_args.append(targets_str)
        
    output = run_solver_command(cmd_args)
    moves = parse_solver_output(output)
    
    time_ms = 0.0
    for line in output.split('\n'):
        if "Total Time:" in line:
            try:
                time_ms = float(line.split(":")[1].strip().replace("ms", ""))
            except:
                pass
                
    return moves, time_ms, output
