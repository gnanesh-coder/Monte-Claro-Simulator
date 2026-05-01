CC = gcc
CFLAGS = -Wall -Wextra -O2 -lm
SRC = src/main.c src/monte_carlo.c
OBJ = $(SRC:.c=.o)
EXECUTABLE = monte_carlo_simulator

all: $(EXECUTABLE)

$(EXECUTABLE): $(OBJ)
	$(CC) $(CFLAGS) -o $(EXECUTABLE) $(OBJ)
	mkdir -p results

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

run: $(EXECUTABLE)
	./$(EXECUTABLE)

clean:
	rm -f $(OBJ) $(EXECUTABLE)

help:
	@echo "Available commands:"
	@echo "  make          - Compile the project"
	@echo "  make run      - Compile and run"
	@echo "  make clean    - Remove object files and executable"
	@echo "  make help     - Show this help message"

.PHONY: all run clean help
