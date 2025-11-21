FROM python:3.9-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source code
COPY . .

# Compile solver
RUN g++ -O3 queens_quadrille_solver.cpp -o queens_quadrille_solver

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 10000

# Run Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]
