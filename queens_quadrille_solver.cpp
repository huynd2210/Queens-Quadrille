#include <iostream>
#include <string>
#include <vector>
#include <queue>
#include <unordered_set>
#include <algorithm>
#include <cmath>
#include <chrono>
#include <sstream>

/**
 * @brief Represents a target configuration for the puzzle.
 * For Queen's Quadrille, the target is usually a specific position for the Queen.
 */
struct Target {
    int position; // The target position for the Queen (0-15).
    std::string name;

    Target(int pos, const std::string& n) : position(pos), name(n) {}
};

/**
 * @brief Represents a state in the A* search algorithm.
 */
struct State {
    int f_score; // f_score = g_score + h_score
    int g_score; // The cost of the path from the start node to this node.
    std::vector<std::string> path; // The sequence of board states to reach this state.
    std::string board; // The current board configuration as a 16-character string.

    bool operator>(const State& other) const {
        return f_score > other.f_score;
    }
};

// --- Function Prototypes ---
int calculate_heuristic(const std::string& board, const Target& target);
bool is_valid_move(char piece, int r1, int c1, int r2, int c2);
std::vector<std::string> get_next_states(const std::string& board);
std::vector<std::string> solve_queens_quadrille(const std::string& initial_board_str, const Target& target);
void print_board(const std::string& board_str);

/**
 * @brief Calculates the Chebyshev distance between two positions.
 * Chebyshev distance is max(|x1-x2|, |y1-y2|).
 */
int chebyshev_distance(int pos1, int pos2) {
    int r1 = pos1 / 4;
    int c1 = pos1 % 4;
    int r2 = pos2 / 4;
    int c2 = pos2 % 4;
    return std::max(std::abs(r1 - r2), std::abs(c1 - c2));
}

/**
 * @brief Calculates the heuristic value (h_score) for the A* algorithm.
 * Uses Chebyshev distance of the Queen to the target position.
 */
int calculate_heuristic(const std::string& board, const Target& target) {
    int queen_pos = -1;
    for (int i = 0; i < 16; ++i) {
        if (board[i] == 'Q') {
            queen_pos = i;
            break;
        }
    }

    if (queen_pos == -1) return 9999; // Should not happen if board is valid

    return chebyshev_distance(queen_pos, target.position);
}

/**
 * @brief Checks if a move from (r1, c1) to (r2, c2) is valid for a given piece type.
 * Reused from Hippodrome logic.
 */
bool is_valid_move(char piece, int r1, int c1, int r2, int c2) {
    int dr = std::abs(r1 - r2);
    int dc = std::abs(c1 - c2);

    if (piece == 'N') { // Knight moves in an L-shape.
        return (dr == 1 && dc == 2) || (dr == 2 && dc == 1);
    }

    // For other pieces, the move must be to an adjacent square?
    // WAIT: The rules say "using a legal chess move".
    // In the sliding puzzle, you move a piece INTO the empty square.
    // So the piece must be able to attack the empty square.
    // This means Rooks can move > 1 square if the path is clear?
    // NO. In 15-puzzle style sliding, you only move adjacent tiles.
    // BUT this is "Queen's Quadrille".
    // Rule: "the player can move a piece to the empty square, using a legal chess move."
    // This implies if I have R . . x, I can move R to x?
    // "ignoring check and color of pieces, the player can move legal moves on this small board, but without taking any piece"
    // "move a piece to the empty square"
    // If it's like the 15-puzzle, usually it's only adjacent.
    // BUT "using a legal chess move" implies range.
    // However, since there is only ONE empty square, you can only move to THAT square.
    // So if I am a Rook at (0,0) and empty is at (0,3), and (0,1) and (0,2) are occupied...
    // I CANNOT jump over them.
    // So effectively, for sliding, it implies the path must be clear?
    // Or is it just "if the piece can legally move to that square"?
    // In standard chess, you can't jump over pieces (except Knight).
    // So, yes, path must be clear.
    // BUT, since we are moving TO the empty square, the only thing that could block us is OTHER pieces.
    // So, if R is at (0,0) and x is at (0,3), and (0,1) is occupied, R cannot move to x.
    // So effectively, only pieces that have a CLEAR PATH to x can move to x.
    // AND, since x is the ONLY empty square, any sliding piece (R, B, Q) must be ADJACENT to x to move to it?
    // NO. If R is at (0,0) and x is at (0,2) and (0,1) is EMPTY... wait, there is only ONE empty square.
    // So (0,1) MUST be occupied.
    // Therefore, R at (0,0) cannot move to x at (0,2) because (0,1) blocks it.
    // CONCLUSION: For sliding pieces (R, B, Q, K), they can ONLY move to the empty square if they are ADJACENT to it.
    // EXCEPT Knight, which can jump.
    // So:
    // K, Q, R, B: Must be adjacent to empty square (and valid move direction).
    // N: Must be L-shape away.
    
    // Let's verify "Queen's Quadrille" rules more carefully.
    // "Queen's Quadrille directly reminds of the old 15-16 puzzle... Here, this puzzle reappears, with a chess twist."
    // "the player can move a piece to the empty square, using a legal chess move."
    // If I am a Bishop at (0,0) and empty is (1,1), I can move.
    // If I am a Bishop at (0,0) and empty is (2,2), and (1,1) is occupied... I cannot move.
    // Since there is only ONE empty square, any square "between" the piece and the empty square MUST be occupied.
    // Therefore, NO sliding piece can move more than 1 step.
    // PROOF: To move > 1 step, say 2 steps, the intermediate square must be empty. But it's occupied. So blocked.
    // EXCEPTION: Knight.
    
    // So, logic is:
    // 1. Calculate delta.
    // 2. If Knight: check L-shape.
    // 3. If others: Check adjacency (max(dr, dc) == 1) AND valid direction.
    
    bool is_adjacent = (std::max(dr, dc) == 1);
    
    if (piece == 'N') {
        return (dr == 1 && dc == 2) || (dr == 2 && dc == 1);
    }
    
    if (!is_adjacent) return false; // Sliding pieces can't jump over the occupied neighbors
    
    if (piece == 'K' || piece == 'Q') return true; // King/Queen can move to any adjacent
    if (piece == 'R') return r1 == r2 || c1 == c2; // Rook orthogonal
    if (piece == 'B') return dr == dc; // Bishop diagonal
    
    return false;
}

std::vector<std::string> get_next_states(const std::string& board) {
    std::vector<std::string> next_states;
    
    size_t empty_index = board.find(' ');
    if (empty_index == std::string::npos) return next_states;

    int empty_row = empty_index / 4;
    int empty_col = empty_index % 4;

    for (int i = 0; i < 16; ++i) {
        if (board[i] != ' ') {
            int piece_row = i / 4;
            int piece_col = i % 4;

            if (is_valid_move(board[i], piece_row, piece_col, empty_row, empty_col)) {
                std::string new_board = board;
                new_board[empty_index] = board[i];
                new_board[i] = ' ';
                next_states.push_back(new_board);
            }
        }
    }
    return next_states;
}

void print_board(const std::string& board_str) {
    std::cout << "+---+---+---+---+" << std::endl;
    for (int i = 0; i < 4; ++i) {
        std::cout << "| ";
        for (int j = 0; j < 4; ++j) {
            std::cout << board_str[i * 4 + j] << " | ";
        }
        std::cout << std::endl << "+---+---+---+---+" << std::endl;
    }
}

std::vector<std::string> solve_queens_quadrille(const std::string& initial_board_str, const Target& target) {
    auto is_goal_state = [&target](const std::string& board) {
        return board[target.position] == 'Q';
    };

    std::priority_queue<State, std::vector<State>, std::greater<State>> pq;
    std::unordered_set<std::string> visited;

    int initial_heuristic = calculate_heuristic(initial_board_str, target);
    pq.push({initial_heuristic, 0, {initial_board_str}, initial_board_str});

    while (!pq.empty()) {
        State current = pq.top();
        pq.pop();

        if (visited.count(current.board)) continue;
        visited.insert(current.board);

        if (is_goal_state(current.board)) {
            return current.path;
        }

        int new_g_score = current.g_score + 1;
        for (const auto& next_board : get_next_states(current.board)) {
            if (!visited.count(next_board)) {
                int heuristic = calculate_heuristic(next_board, target);
                int new_f_score = new_g_score + heuristic;
                std::vector<std::string> new_path = current.path;
                new_path.push_back(next_board);
                pq.push({new_f_score, new_g_score, new_path, next_board});
            }
        }
    }

    return {};
}

#include <random>
#include <algorithm>

// ... (existing includes)

/**
 * @brief Generates a random board configuration.
 * Pieces: 2K, 1Q, 4R, 4B, 4N (One Q removed).
 * All pieces are shuffled randomly.
 */
std::string generate_random_board() {
    std::vector<char> pieces;
    // Add pieces: 2K, 1Q, 4R, 4B, 4N
    for (int i = 0; i < 2; ++i) pieces.push_back('K');
    pieces.push_back('Q');
    for (int i = 0; i < 4; ++i) pieces.push_back('R');
    for (int i = 0; i < 4; ++i) pieces.push_back('B');
    for (int i = 0; i < 4; ++i) pieces.push_back('N');
    // Add empty space
    pieces.push_back(' ');
    
    // Shuffle
    std::random_device rd;
    std::mt19937 g(rd());
    std::shuffle(pieces.begin(), pieces.end(), g);
    
    // Construct board
    std::string board = "";
    for (char p : pieces) {
        board += p;
    }
    return board;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << "Usage: " << argv[0] << " <board|random> [targets]" << std::endl;
        std::cout << "Example: " << argv[0] << " \"RNBK...Q...... \" 15" << std::endl;
        std::cout << "Example: " << argv[0] << " random \"0,15\"" << std::endl;
        std::cout << "Example: " << argv[0] << " random \"0,3,12,15\"" << std::endl;
        return 1;
    }

    std::string board;
    std::string arg1 = argv[1];
    if (arg1 == "random") {
        board = generate_random_board();
        std::cout << "Generated Random Board: " << board << std::endl;
    } else {
        board = arg1;
    }

    if (board.length() != 16) {
        std::cerr << "Error: Board must be 16 characters." << std::endl;
        return 1;
    }

    // Normalize input: replace 'x' with ' '
    for (char &c : board) {
        if (c == 'x') c = ' ';
    }

    std::cout << "Initial Board:" << std::endl;
    print_board(board);

    // Parse targets
    std::vector<int> targets;
    if (argc >= 3) {
        std::string targets_str = argv[2];
        std::stringstream ss(targets_str);
        std::string segment;
        while (std::getline(ss, segment, ',')) {
            try {
                targets.push_back(std::stoi(segment));
            } catch (...) {
                std::cerr << "Warning: Invalid target '" << segment << "' ignored." << std::endl;
            }
        }
    } else {
        // Default targets if none provided
        targets = {0, 15};
    }

    if (targets.empty()) {
        std::cerr << "Error: No valid targets provided." << std::endl;
        return 1;
    }

    std::cout << "Targets to visit: ";
    for (size_t i = 0; i < targets.size(); ++i) {
        std::cout << targets[i] << (i < targets.size() - 1 ? ", " : "");
    }
    std::cout << std::endl;

    std::vector<std::string> full_path;
    std::string current_board = board;
    full_path.push_back(current_board);
    
    auto start_time = std::chrono::high_resolution_clock::now();
    
    // Greedy Nearest Neighbor Tour
    std::vector<int> remaining_targets = targets;
    int tour_step = 1;

    while (!remaining_targets.empty()) {
        // Find current Queen position
        int queen_pos = -1;
        for (int i = 0; i < 16; ++i) {
            if (current_board[i] == 'Q') {
                queen_pos = i;
                break;
            }
        }

        if (queen_pos == -1) {
            std::cerr << "Error: Queen lost!" << std::endl;
            return 1;
        }

        // Find nearest target
        int best_target_idx = -1;
        int min_dist = 9999;

        for (size_t i = 0; i < remaining_targets.size(); ++i) {
            int t = remaining_targets[i];
            if (t == queen_pos) {
                // Already at this target
                best_target_idx = i;
                min_dist = 0;
                break;
            }
            int d = chebyshev_distance(queen_pos, t);
            if (d < min_dist) {
                min_dist = d;
                best_target_idx = i;
            }
        }

        int target_pos = remaining_targets[best_target_idx];
        
        // Remove from remaining
        remaining_targets.erase(remaining_targets.begin() + best_target_idx);

        if (target_pos == queen_pos) {
            std::cout << "Queen is already at target " << target_pos << ". Proceeding." << std::endl;
            continue;
        }

        std::cout << "Solving for Target " << tour_step++ << ": Position " << target_pos << "..." << std::endl;
        Target target(target_pos, "Target");
        std::vector<std::string> path = solve_queens_quadrille(current_board, target);
        
        if (path.empty()) {
            std::cout << "No solution found for target " << target_pos << std::endl;
            return 0;
        }
        
        // Append path
        for (size_t j = 1; j < path.size(); ++j) {
            full_path.push_back(path[j]);
        }
        current_board = path.back();
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> duration = end_time - start_time;

    std::cout << "\nFull Tour Completed!" << std::endl;
    std::cout << "Total Moves: " << full_path.size() - 1 << std::endl;
    std::cout << "Total Time: " << duration.count() << " ms" << std::endl;
    
    for (size_t i = 0; i < full_path.size(); ++i) {
        std::cout << "Move " << i << ":" << std::endl;
        print_board(full_path[i]);
    }

    return 0;
}
