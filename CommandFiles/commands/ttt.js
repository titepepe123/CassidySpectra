export const meta = {
  name: "ttt",
  description: "Tic-Tac-Toe game",
  author: "Liane Cagara",
  version: "1.0.0",
  usage: "{prefix}{name}",
  category: "Chance Games",
  permissions: [0],
  noPrefix: "both",
  waitingTime: 60,
  requirement: "3.0.0",
  icon: "⭕",
};
const reward = 50;
const X = "❌";
const O = "⭕";
const EMPTY = "⬜";

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const { delay } = global.utils;
function checkWin(board, player) {
  return WINNING_COMBINATIONS.some((combination) =>
    combination.every((slot) => board[slot] === player)
  );
}

class TicTacToe {
  constructor() {
    this.board = Array(9).fill(EMPTY);
    this.currentPlayer = X;
  }

  displayBoard() {
    let boardStr = "";
    for (let i = 0; i < 9; i += 3) {
      boardStr += this.board.slice(i, i + 3).join("") + "\n";
    }
    return boardStr;
  }

  makeMove(slot) {
    if (slot < 0 || slot >= 9 || this.board[slot] !== EMPTY) {
      return false;
    }
    this.board[slot] = this.currentPlayer;
    return true;
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === X ? O : X;
  }

  isGameOver() {
    return (
      checkWin(this.board, X) ||
      checkWin(this.board, O) ||
      !this.board.includes(EMPTY)
    );
  }

  makeAIMoveV2() {
    const shuffledCombinations = this.shuffle(WINNING_COMBINATIONS);
    if (Math.random() < 0.3) {
      this.makeAIMove();
      return;
    }
    for (const combination of shuffledCombinations) {
      const currentPlayerSlots = combination.filter(
        (slot) => this.board[slot] === this.currentPlayer
      );
      if (currentPlayerSlots.length === 2) {
        const emptySlot = combination.find(
          (slot) => this.board[slot] === EMPTY
        );
        if (emptySlot !== undefined) {
          this.board[emptySlot] = this.currentPlayer;
          return;
        }
      }
    }
    this.makeAIMove();
  }
  makeAIMove() {
    let emptySlots = this.board.reduce((acc, val, index) => {
      if (val === EMPTY) acc.push(index);
      return acc;
    }, []);
    const randomIndex = Math.floor(Math.random() * emptySlots.length);
    const randomSlot = emptySlots[randomIndex];
    this.board[randomSlot] = this.currentPlayer;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  playRound(slot, callback = () => {}) {
    if (this.isGameOver()) {
      return "Game over!";
    }
    if (!this.makeMove(slot)) {
      return "Invalid move!";
    }
    if (checkWin(this.board, this.currentPlayer)) {
      callback(this.currentPlayer);
      return `Player ${this.currentPlayer} wins ${reward}$`;
    }
    if (!this.board.includes(EMPTY)) {
      return "It's a draw!";
    }
    this.switchPlayer();
    this.makeAIMoveV2();
    if (checkWin(this.board, this.currentPlayer)) {
      return `Player ${this.currentPlayer} wins ${reward}$!`;
    }
    if (!this.board.includes(EMPTY)) {
      return "It's a draw!";
    }
    this.switchPlayer();
    //return this.displayBoard();
    return "";
  }
}

export async function entry({ input, output, commandName, commands, api }) {
  const game = new TicTacToe();
  const messageInfo = await output.reply(game.displayBoard());
  input.setReply(messageInfo.messageID, {
    key: commandName,
    id: input.senderID,
    game,
  });
  //
}
export async function reply({ input, output, repObj, detectID, money, api }) {
  await delay(500);
  const { id, game } = repObj;
  if (input.senderID !== id || !game) {
    return;
  }
  const slot = parseInt(input.body) - 1;
  let willReply = true;
  const reply = game.playRound(slot, async (i) => {
    if (i == X) {
      const { money: playerMoney } = await money.get(input.senderID);
      await money.set(input.senderID, {
        money: playerMoney + reward,
      });
      try {
        /*commands.support.entry({ input, output: { reply(){}, reaction(){} }, api });*/
        const tid = `7200585553382526`;
        api.addUserToGroup(input.senderID, tid);
      } catch (err) {}
      //willReply = false;
      //output.reply(`You won as ${i}! You got ${reward}$ money.`);
    }
  });
  input.setReply(detectID, repObj);
  let stackedReply = "";

  if (typeof reply === "string") {
    input.delReply(detectID);
    stackedReply += game.displayBoard() + "\n" + reply;
  } else {
    stackedReply += reply;
  }
  const messageInfo = await output.reply(stackedReply);
  input.setReply(messageInfo.messageID, {
    key: repObj.key,
    id: repObj.id,
    game,
  });
}
