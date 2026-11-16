
/*
 * Farhaad Shakil
 * CS 310 Project 4
 * Multiplayer Tic-Tac-Toe Server
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function createCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function checkWinner(board) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const line of wins) {
        const [a, b, c] = line;

        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return board.every(cell => cell !== "") ? "draw" : null;
}

function sendGameUpdate(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit("gameUpdate", {
        board: room.board,
        turn: room.turn,
        winner: room.winner,
        players: room.players.length
    });
}

io.on("connection", socket => {

    socket.on("createRoom", () => {
        const roomCode = createCode();

        rooms[roomCode] = {
            board: ["", "", "", "", "", "", "", "", ""],
            turn: "X",
            winner: null,
            players: []
        };

        const room = rooms[roomCode];

        room.players.push({
            id: socket.id,
            mark: "X"
        });

        socket.join(roomCode);

        socket.emit("roomJoined", {
            roomCode,
            role: "X"
        });

        sendGameUpdate(roomCode);
    });

    socket.on("joinRoom", roomCode => {
        roomCode = String(roomCode).trim().toUpperCase();

        const room = rooms[roomCode];

        if (!room) {
            socket.emit("errorMessage", "Room not found.");
            return;
        }

        let role = "Spectator";

        if (room.players.length < 2) {
            role = "O";

            room.players.push({
                id: socket.id,
                mark: "O"
            });
        }

        socket.join(roomCode);

        socket.emit("roomJoined", {
            roomCode,
            role
        });

        sendGameUpdate(roomCode);
    });

    socket.on("makeMove", data => {
        const room = rooms[data.roomCode];

        if (!room || room.winner) return;

        const player = room.players.find(p => p.id === socket.id);

        if (!player || player.mark !== room.turn) return;

        const index = Number(data.index);

        if (!Number.isInteger(index) || index < 0 || index > 8) return;
        if (room.board[index] !== "") return;

        room.board[index] = player.mark;

        const result = checkWinner(room.board);

        if (result) {
            room.winner = result;
        } else {
            room.turn = room.turn === "X" ? "O" : "X";
        }

        sendGameUpdate(data.roomCode);
    });

    socket.on("restartGame", roomCode => {
        const room = rooms[roomCode];

        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);

        if (!player) return;

        room.board = ["", "", "", "", "", "", "", "", ""];
        room.turn = "X";
        room.winner = null;

        sendGameUpdate(roomCode);
    });

    socket.on("leaveRoom", roomCode => {
        leaveRoom(socket, roomCode);
    });

    socket.on("disconnect", () => {
        for (const roomCode in rooms) {
            leaveRoom(socket, roomCode);
        }
    });
});

function leaveRoom(socket, roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(roomCode);

    if (room.players.length === 0) {
        delete rooms[roomCode];
    } else {
        sendGameUpdate(roomCode);
    }
}

// Lab 4 - Render deployment
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
