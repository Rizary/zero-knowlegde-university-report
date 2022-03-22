CC=g++
CFLAGS=-O3 -I.
DEPS_HPP = circom.hpp calcwit.hpp fr.hpp
DEPS_O = main.o calcwit.o fr.o fr_asm.o

all: DarkForest

%.o: %.cpp $(DEPS_HPP)
	$(CC) -c $< $(CFLAGS)
fr_asm.o: fr.asm
	nasm -felf64 fr.asm -o fr_asm.o

DarkForest: $(DEPS_O) DarkForest.o
	$(CC) -o DarkForest *.o -lgmp
