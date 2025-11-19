CXX = g++
CXXFLAGS = -O3 -std=c++17 -pthread

all: queens_quadrille_solver

queens_quadrille_solver: queens_quadrille_solver.cpp
	$(CXX) $(CXXFLAGS) -o queens_quadrille_solver queens_quadrille_solver.cpp

clean:
	rm -f queens_quadrille_solver queens_quadrille_solver.exe
