
/*
 * Farhaad Shakil
 * CS 310 Project 4
 * Tic-Tac-Toe Client-Side JavaScript
 */

const socket = io();

const lobby = document.getElementById("lobby");
const roomArea = document.getElementById("roomArea");

const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");

const roomCodeDisplay = document.getElementById("roomCode");
const myRoleDisplay = document.getElementById("myRole");
const message = document.getElementById("message");
const status = document.getElementById("status");

const restartBtn = document.getElementById("restartBtn");
const leaveBtn = document.getElementById("leaveBtn");
const copyBtn = document.getElementById("copyBtn");

const cells = document.querySelectorAll(".cell");

let currentRoom = "";
let myRole = "Spectator";
let currentTurn = "X";

createBtn.addEventListener("click", () => {
    message.textContent = "";
    socket.emit("createRoom");
});

joinBtn.addEventListener("click", () => {
    const code = roomInput.value.trim().toUpperCase();

    if (!code) {
        message.textContent = "Please enter a room code.";
        return;
    }

    message.textContent = "";
    socket.emit("joinRoom", code);
});

socket.on("roomJoined", data => {
    currentRoom = data.roomCode;
    myRole = data.role;

    roomCodeDisplay.textContent = currentRoom;
    myRoleDisplay.textContent = myRole;

    lobby.classList.add("hidden");
    roomArea.classList.remove("hidden");

    message.textContent = "";

    if (myRole === "Spectator") {
        status.textContent = "You are watching this game.";
    }
});

socket.on("gameUpdate", data => {
    currentTurn = data.turn;

    data.board.forEach((value, index) => {
        cells[index].textContent = value;
        cells[index].disabled =
            value !== "" ||
            data.winner !== null ||
            myRole === "Spectator" ||
            myRole !== currentTurn;
    });

    if (data.winner === "draw") {
        status.textContent = "It's a draw!";
    } else if (data.winner) {
        status.textContent = data.winner + " wins!";
    } else if (data.players < 2) {
        status.textContent = "Waiting for the second player...";
    } else if (myRole === "Spectator") {
        status.textContent = "Watching the game. " + currentTurn + "'s turn.";
    } else if (myRole === currentTurn) {
        status.textContent = "Your turn (" + myRole + ")";
    } else {
        status.textContent = "Waiting for " + currentTurn + "'s move...";
    }
});

cells.forEach(cell => {
    cell.addEventListener("click", () => {
        const index = Number(cell.dataset.index);

        if (!currentRoom) return;

        socket.emit("makeMove", {
            roomCode: currentRoom,
            index: index
        });
    });
});

restartBtn.addEventListener("click", () => {
    if (currentRoom) {
        socket.emit("restartGame", currentRoom);
    }
});

leaveBtn.addEventListener("click", () => {
    if (currentRoom) {
        socket.emit("leaveRoom", currentRoom);
    }

    currentRoom = "";
    roomArea.classList.add("hidden");
    lobby.classList.remove("hidden");

    cells.forEach(cell => {
        cell.textContent = "";
        cell.disabled = false;
    });

    roomInput.value = "";
    status.textContent = "Waiting for players...";
});

copyBtn.addEventListener("click", async () => {
    if (!currentRoom) return;

    try {
        await navigator.clipboard.writeText(currentRoom);
        copyBtn.textContent = "Copied!";
    } catch (error) {
        copyBtn.textContent = currentRoom;
    }
});

socket.on("errorMessage", text => {
    message.textContent = text;
});
