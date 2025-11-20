import os
import subprocess

SOLVER_PATH = os.path.join(os.getcwd(), "queens_quadrille_solver.exe")

env = os.environ.copy()
msys_bin = r"C:\msys64\ucrt64\bin"
if msys_bin not in env["PATH"]:
    env["PATH"] = msys_bin + os.pathsep + env["PATH"]

print("Testing solver execution...")
try:
    result = subprocess.run([SOLVER_PATH, "random"], capture_output=True, text=True, env=env)
    print("Return Code:", result.returncode)
    print("Stdout:", result.stdout[:200]) # Print first 200 chars
    print("Stderr:", result.stderr)
except Exception as e:
    print("Exception:", e)
