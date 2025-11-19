import random

def generate_board():
    # Pieces: 2K, 1Q, 4R, 4B, 4N (One Q removed from 2 sets)
    pieces = ['K']*2 + ['Q'] + ['R']*4 + ['B']*4 + ['N']*4
    
    # We need Q at index 0 (top-left)
    pieces.remove('Q')
    
    # Shuffle remaining 14 pieces + 1 ' '
    others = pieces + [' ']
    random.shuffle(others)
    
    # Construct board: Q + others
    board = ['Q'] + others
    
    return "".join(board)

if __name__ == "__main__":
    print(generate_board())
