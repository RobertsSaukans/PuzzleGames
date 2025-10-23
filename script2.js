var board = document.getElementById("gameBoard");
var retryBtn = document.getElementById("retryBtn");
var statusText = document.getElementById("statusText");
var singlePlayerBtn = document.getElementById("singlePlayerBtn");
var twoPlayerBtn = document.getElementById("twoPlayerBtn");
var modeSelectiondiv = document.getElementById("mode-selection");
var levelSelectiondiv = document.getElementById("level-selection");
var returnDiv = document.getElementById('returnDiv');
var returnBtn = document.getElementById('returnBtn');
var level1 = document.getElementById('level-1');
var level2 = document.getElementById('level-2');
var level3 = document.getElementById('level-3');
var score = document.getElementById('scoreText');
var score2 = document.getElementById('scoreText2');

// Tabulas izmēri (Connect-4 klasiski 6x7)
const ROWS = 6;
const COLS = 7;

// Palīgmainīgie: saraksti, spēles stāvoklis, statistika
let colChoice = [1, 2, 3, 4, 5, 6, 7];
let currentPlayer = "red";
let computer = "yellow";
let gameBoard = [];      // 2D masīvs glabā spēles stāvokli
let winCells = [];       // uzvaras pozīciju saraksts (rinda, kolonna) — highlight
let gameover = true;
let singlePlayerStart = false;
let currentGameMode = "";
let gameCount = 1;
let first = true;
let playerColor;
let compColor;
let wins = 0;
let ties = 0;
let losses = 0;

const transposition = new Map();

// Laika limits "Impossible" režīmam — var regulēt
const IMPOSSIBLE_TIME_LIMIT = 900; // ms (700..1500 ieteicami)

// Sākotnējais UI: paslēpt noteiktus elementus
returnDiv.style.display = 'none';
score.style.display = 'none';
score2.style.display = 'none';

// Atgriež uz sākumlapu (pogas handler)
function returnButton () {
  window.location.href = "connect-four.html";
}

// Palīgs: izvēlas nejaušu elementu no masīva
function getRandomPosition(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Palīgs: noņem elementu no masīva pēc vērtības
function removeElement(array, element) {
  const index = array.indexOf(element);
  if (index !== -1) {
    array.splice(index, 1);
  }
}

// Inicializē spēles tabulu DOM un 2D masīvu
function createBoard() {
  gameBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  board.innerHTML = "";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      // Katram cell pievienots click handler, kas apstrādā gājienus
      cell.addEventListener("click", BoardControlAndTwoPlayerMode);
      board.appendChild(cell);
    }
  }

  currentPlayer = "red";
}

// Single-player režīms: apstrādā spēlētāja gājienu un tad datora
async function singlePlayerMode (button) {
  if (gameover === true || singlePlayerStart === false) {
      return;
  } else {
      // Katru otro spēli sāk dators
      if (gameCount % 2 === 0 && first === true) {
        first = false;
      }
      else {
        const playerCol = parseInt(button.target.dataset.col, 10);

        // ---------- Spēlētāja gājiens: noliek krāsu zemākajā brīvajā rindā ----------
        let playerPlaced = false;
        for (let row = ROWS - 1; row >= 0; row--) {
          if (!gameBoard[row][playerCol]) {
            gameBoard[row][playerCol] = currentPlayer;
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${playerCol}"]`);
            if (cell) cell.classList.add(currentPlayer);
            playerPlaced = true;

            // Pārbauda uzvaru tūlīt pēc spēlētāja gājiena
            if (checkWin(currentPlayer)) {
              gameover = true;
              highlightWinCells();
              wins++;
              statusText.textContent = "You win!";
              score.textContent = "Wins: " + wins + " Losses: " + losses + " Ties: " + ties;
              retryBtn.classList.remove("hidden");
              return; // ja spēlētājs uzvar, dators neveic gājienu
            }

            break;
          }
        }

        if (!playerPlaced) {
          // Ja kolonna ir pilna, izveidojam paziņojumu
          statusText.textContent = "Column is full!";
          return;
        }
      }

      // ---------- datora gājiens: izvēlas kolonnas pēc režīma ----------
      // Sagatavo pieejamo kolonnu sarakstu (tās kur augšā nav aizpildītas)
      const availableCols = [];
      for (let c = 0; c < COLS; c++) {
        if (!gameBoard[0][c]) availableCols.push(c);
      }

      if (availableCols.length === 0) {
        // Tabula pilna -> neizšķirts
        gameover = true;
        statusText.textContent = "It's a tie!";
        retryBtn.classList.remove("hidden");
        return;
      }

      let compCol;

      // IMPOSSIBLE: vispirms meklē tūlītēju uzvaru vai bloķē spēlētāja uzvaru,
      // ja nav — izmanto iteratīvu dziļuma meklēšanu ar laika limitu
      if (currentGameMode === "Impossible") {
        let winNow = scoreCheck(computer);
        if (winNow !== null) {
          compCol = winNow;
        } else {
          let blockNow = scoreCheck(currentPlayer);
          if (blockNow !== null) {
            compCol = blockNow;
          } else {
            statusText.textContent = "The Computer is thinking...";
            await sleep(100);
            compCol = chooseBestMoveIterative(computer, 8, IMPOSSIBLE_TIME_LIMIT);
            if (compCol === null || compCol === undefined) {
              compCol = getRandomPosition(availableCols);
            }
          }
        }
      }
      // HARD: vispirms uzvara/bloķēšana, ja nav -> minimax ar dziļumu 3 (chooseBestMove)
      else if (currentGameMode === "Hard") {
        compCol = scoreCheck(computer) ?? scoreCheck(currentPlayer) ?? chooseBestMove(3, computer) ?? getRandomPosition(availableCols);
      }
      // REGULAR: tikai vienas gājiena prognoze (uzvara/bloķēšana) vai random
      else {
        compCol = scoreCheck(computer) ?? scoreCheck(currentPlayer) ?? getRandomPosition(availableCols);
      }

      // Mazs "domāšanas" laiks UI/skatam
      gameover = true;
      statusText.textContent = "The Computer is thinking...";
      await sleep(1000);
      gameover = false;

      // Noliec datora krāsu zemākajā brīvajā rindā izvēlētajā kolonnā
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!gameBoard[r][compCol]) {
          gameBoard[r][compCol] = computer;
          const cCell = document.querySelector(`.cell[data-row="${r}"][data-col="${compCol}"]`);
          if (cCell) cCell.classList.add(computer);

          // Pārbauda, vai dators uzvar
          if (checkWin(computer)) {
            gameover = true;
            highlightWinCells();
            losses++;
            statusText.textContent = "You lose!";
            score.textContent = "Wins: " + wins + " Losses: " + losses + " Ties: " + ties;
            retryBtn.classList.remove("hidden");
            return;
          }
          break;
        }
      }

      // Ja spēle nav beigusies, atgriežas pie spēlētāja gājiena
      if (!gameover) {
        statusText.textContent = "Your move!";
      }
    }
}

// Palīgs: gaida dotās ms — izmanto asinhronām pauzēm (UI efektiem)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Divu spēlētāju loģika un cilne, ko izmanto arī kā click handler (BoardControl)
function BoardControlAndTwoPlayerMode(button) {
  // Ja single player režīmā — novirza uz singlePlayerMode
  if (singlePlayerStart === true && gameover === false) {
    singlePlayerMode(button);
    return;
  }
  else if (gameover === true) {
    return;
  }

  const col = parseInt(button.target.dataset.col, 10);

  // Novieto krāsu zemākajā brīvajā rindā
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!gameBoard[row][col]) {
      gameBoard[row][col] = currentPlayer;
      const cell = document.querySelector(
        `.cell[data-row="${row}"][data-col="${col}"]`
      );
      cell.classList.add(currentPlayer);
      if (checkWin(currentPlayer)) {
        gameover = true;
        highlightWinCells();
        if (currentPlayer === "red") {
          wins++;
          statusText.textContent = "Red wins!";
          score2.textContent = "Red: " + wins + " Yellow: " + losses + " Ties: " + ties;
        }
        else {
          losses++;
          statusText.textContent = "Yellow wins!";
          score2.textContent = "Red: " + wins + " Yellow: " + losses + " Ties: " + ties;
        }
        retryBtn.classList.remove("hidden");
        return;
      }
      if (gameover) return;
      togglePlayer();
      return;
    }
  }

  statusText.textContent = "Column is full! Choose another.";
}

// Pārslēdz spēlētāju (red <-> yellow) un atjauno paziņojumu
function togglePlayer() {
  currentPlayer = currentPlayer === "red" ? "yellow" : "red";
  statusText.textContent = `${currentPlayer === "red" ? "Red" : "Yellow"}'s turn!`;
}

// Uzsver uzvaras pozīcijas pie uzvaras — izmanto winCells masīvu
function highlightWinCells() {
  if (!Array.isArray(winCells) || winCells.length === 0) return;
  winCells.forEach(([r, c]) => {
    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
      cell.classList.add('win');
    }
  });
}

// Pārbauda uzvaru un uzstāda winCells, ja atrasti 4 pēc kārtas
function checkWin(player) {
    winCells = [];

    // Rindu pārbaude (horizontāli)
    for (let row = 0; row < ROWS; row++) {
        let count = 0;
        let tempCells = [];
        for (let col = 0; col < COLS; col++) {
            if (gameBoard[row][col] === player) {
                count++;
                tempCells.push([row, col]);
                if (count >= 4) {
                    // Saglabā pēdējās 4 šūnas kā uzvaras šūnas
                    winCells = tempCells.slice(tempCells.length - 4);
                    return true;
                }
            } else {
                // izdzēš skaitītāju un temp bufferi, ja pozīcijas krāsa nepieder spēlētājam
                count = 0;
                tempCells = [];
            }
        }
    }

    // Kolonnu pārbaude (vertikāli)
    for (let col = 0; col < COLS; col++) {
        let count = 0;
        let tempCells = [];
        for (let row = 0; row < ROWS; row++) {
            if (gameBoard[row][col] === player) {
                count++;
                tempCells.push([row, col]);
                if (count >= 4) {
                    winCells = tempCells.slice(tempCells.length - 4);
                    return true;
                }
            } else {
                count = 0;
                tempCells = [];
            }
        }
    }

    // Diagonāles (\) pārbaude
    for (let startRow = 0; startRow < ROWS; startRow++) {
        for (let startCol = 0; startCol < COLS; startCol++) {
            let r = startRow;
            let c = startCol;
            let count = 0;
            let tempCells = [];
            while (r < ROWS && c < COLS) {
                if (gameBoard[r][c] === player) {
                    count++;
                    tempCells.push([r, c]);
                    if (count >= 4) {
                        winCells = tempCells.slice(tempCells.length - 4);
                        return true;
                    }
                } else {
                    count = 0;
                    tempCells = [];
                }
                r++;
                c++;
            }
        }
    }

    // Diagonāles (/) pārbaude
    for (let startRow = 0; startRow < ROWS; startRow++) {
        for (let startCol = 0; startCol < COLS; startCol++) {
            let r = startRow;
            let c = startCol;
            let count = 0;
            let tempCells = [];
            while (r < ROWS && c >= 0) {
                if (gameBoard[r][c] === player) {
                    count++;
                    tempCells.push([r, c]);
                    if (count >= 4) {
                        winCells = tempCells.slice(tempCells.length - 4);
                        return true;
                    }
                } else {
                    count = 0;
                    tempCells = [];
                }
                r++;
                c--;
            }
        }
    }

    // Ja visa tabula pilna — neizšķirts
    if (gameBoard.flat().every((cell) => cell !== null)) {
        gameover = true;
        statusText.textContent = "It's a tie!";
        ties++;
        retryBtn.classList.remove("hidden");
        score2.textContent = "Red: " + wins + " Yellow: " + losses + " Ties: " + ties;
        return false;
    }

    return false;
}

// Atrodi zemāko brīvo rindu dotajā kolonnā (ja nav — null)
function getLowestEmptyRow(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!gameBoard[r][col]) return r;
  }
  return null;
}

// Pārbauda, vai noteikts gājiens (row,col) nodrošina uzvaru
function isWinningMove(row, col, player) {
  function countDirection(dr, dc) {
    let r = row + dr;
    let c = col + dc;
    let cnt = 0;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && gameBoard[r][c] === player) {
      cnt++;
      r += dr;
      c += dc;
    }
    return cnt;
  }

  // horizontāle, vertikāle, divas diagonāles
  const horiz = 1 + countDirection(0, -1) + countDirection(0, 1);
  if (horiz >= 4) return true;

  const vert = 1 + countDirection(-1, 0) + countDirection(1, 0);
  if (vert >= 4) return true;

  const diag1 = 1 + countDirection(-1, -1) + countDirection(1, 1);
  if (diag1 >= 4) return true;

  const diag2 = 1 + countDirection(-1, 1) + countDirection(1, -1);
  if (diag2 >= 4) return true;

  return false;
}

// Meklē tūlītējas uzvaras gājienu dotajam spēlētājam — ja atrasts, atgriež kolonnas indeksu
function scoreCheck(player) {
  for (let c = 0; c < COLS; c++) {
    const r = getLowestEmptyRow(c);
    if (r === null) continue;

    // Simulē gājienu
    gameBoard[r][c] = player;

    const win = isWinningMove(r, c, player);

    // Atcels simulāciju
    gameBoard[r][c] = null;

    if (win) return c;
  }
  return null;
}

// Hard Mode implementācija:
// (funkcijas, kas nepieciešamas minimax/negamax vērtēšanai un kustību ģenerēšanai)

// (atkārtota) zemākās brīvās rindas atrodīšana — definēta arī augstāk (bez izmaiņām)
function getLowestEmptyRow(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!gameBoard[r][col]) return r;
  }
  return null;
}

// Palīga funkcija: izpilda gājienu (noliek krāsu) un atgriež rindu; ja nav vietas, null
function makeMove(col, player) {
  const r = getLowestEmptyRow(col);
  if (r === null) return null;
  gameBoard[r][col] = player;
  return r;
}

// Atceļ pēdējo gājienu dotajā kolonnā (noņem augstāko aizpildīto rindu)
function undoMove(col) {
  for (let r = 0; r < ROWS; r++) {
    if (gameBoard[r][col]) {
      gameBoard[r][col] = null;
      return;
    }
  }
}

// (atkārtota) pārbaude vai konkrēta pozīcija rada uzvaru — definēta arī augstāk
function isWinningMove(row, col, player) {
  function countDirection(dr, dc) {
    let r = row + dr, c = col + dc, cnt = 0;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && gameBoard[r][c] === player) {
      cnt++; r += dr; c += dc;
    }
    return cnt;
  }
  if (1 + countDirection(0, -1) + countDirection(0, 1) >= 4) return true; // horiz
  if (1 + countDirection(-1, 0) + countDirection(1, 0) >= 4) return true; // vert
  if (1 + countDirection(-1, -1) + countDirection(1, 1) >= 4) return true; // diag \
  if (1 + countDirection(-1, 1) + countDirection(1, -1) >= 4) return true; // diag /
  return false;
}

// Novērtē 4-šūnu logu (window) attiecībā uz dotā spēlētāja draudiem/iespējām
function evaluateWindow(windowArr, player) {
  const opponent = (player === 'red') ? 'yellow' : 'red';
  const pCount = windowArr.filter(x => x === player).length;
  const oCount = windowArr.filter(x => x === opponent).length;
  const empty = windowArr.filter(x => x === null).length;

  // Lielas svara vērtības uzvarai / zaudējumam, mazākas kombinācijām
  if (pCount === 4) return 100000;
  if (pCount === 3 && empty === 1) return 200;
  if (pCount === 2 && empty === 2) return 50;

  if (oCount === 4) return -100000;
  if (oCount === 3 && empty === 1) return -180;
  if (oCount === 2 && empty === 2) return -40;

  return 0;
}

// Vērtē visu dēli no dotā spēlētāja perspektīvas — izmanto evaluateWindow
function evaluateBoard(player) {
  const opponent = player === 'red' ? 'yellow' : 'red';
  let score = 0;

  // Centra kolonnas vērtība (vēlams aizpildīt centru)
  const centerCol = Math.floor(COLS / 2);
  for (let r = 0; r < ROWS; r++) {
    if (gameBoard[r][centerCol] === player) score += 6;
    if (gameBoard[r][centerCol] === opponent) score -= 6;
  }

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const windowArr = [gameBoard[r][c], gameBoard[r][c+1], gameBoard[r][c+2], gameBoard[r][c+3]];
      score += evaluateWindow(windowArr, player);
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      const windowArr = [gameBoard[r][c], gameBoard[r+1][c], gameBoard[r+2][c], gameBoard[r+3][c]];
      score += evaluateWindow(windowArr, player);
    }
  }

  // Diagonal (\)
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const windowArr = [gameBoard[r][c], gameBoard[r+1][c+1], gameBoard[r+2][c+2], gameBoard[r+3][c+3]];
      score += evaluateWindow(windowArr, player);
    }
  }

  // Diagonal (/)
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 3; c < COLS; c++) {
      const windowArr = [gameBoard[r][c], gameBoard[r+1][c-1], gameBoard[r+2][c-2], gameBoard[r+3][c-3]];
      score += evaluateWindow(windowArr, player);
    }
  }

  return score;
}

// Ģenerē kustību secību ar centru pirmajā vietā (ļauj datoram skatīties centrā vispirms)
function generateMoves() {
  const center = Math.floor(COLS / 2);
  const order = [];
  for (let i = 0; i < COLS; i++) {
    const col = center + (i % 2 === 0 ? (i/2) : -(Math.floor(i/2) + 1));
    order.push(col);
  }
  return order.filter(c => getLowestEmptyRow(c) !== null);
}

// Negamax ar alpha-beta atgriešanu vērtējumam
function negamax(depth, alpha, beta, player) {
  // Pārbauda tūlītējas uzvaras iespējas
  for (let c = 0; c < COLS; c++) {
    const r = getLowestEmptyRow(c);
    if (r === null) continue;
    gameBoard[r][c] = player;
    const win = isWinningMove(r, c, player);
    gameBoard[r][c] = null;
    if (win) return 1000000;
  }

  if (depth === 0) {
    return evaluateBoard(player);
  }

  let value = -Infinity;
  const moves = generateMoves();
  const opponent = (player === 'red') ? 'yellow' : 'red';

  for (const col of moves) {
    const row = makeMove(col, player);
    if (row === null) continue;
    const score = -negamax(depth - 1, -beta, -alpha, opponent);
    undoMove(col);

    if (score > value) value = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  return value;
}

// Izvēlas labāko gājienu izmantojot negamax dziļumu
function chooseBestMove(depth, player) {
  let bestScore = -Infinity;
  let bestCol = null;
  const opponent = (player === 'red') ? 'yellow' : 'red';
  const moves = generateMoves();

  for (const col of moves) {
    const row = makeMove(col, player);
    if (row === null) continue;
    const score = -negamax(depth - 1, -Infinity, Infinity, opponent);
    undoMove(col);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

//Impossible mode implementācija
// Veido īsu atslēgu spēles laukuma stāvoklim transpozīcijas tabulai
function boardKey() {
  return gameBoard.map(row => row.map(cell => cell ? (cell[0]) : '.').join('')).join('|');
}

// Negamax ar transpozīcijas tabulu un laika pārbaudi — izmanto Impossible režīmam
function negamaxWithTT(depth, alpha, beta, player, startTime, timeLimit) {
  // Laika limits — ja pārsniedz, met izņēmumu, ko augstāk apstrādā iterative deepening
  if (performance.now() - startTime > timeLimit) {
    throw new Error('timeout');
  }

  // Ātra pārbaude: ja ir tūlītēja uzvara, atgriež ļoti augstu vērtību
  for (let c = 0; c < COLS; c++) {
    const r = getLowestEmptyRow(c);
    if (r === null) continue;
    gameBoard[r][c] = player;
    const win = isWinningMove(r, c, player);
    gameBoard[r][c] = null;
    if (win) return 1000000;
  }

  // Ja sasniegts dziļums 0 — izvērtē pozīciju
  if (depth === 0) {
    return evaluateBoard(player);
  }

  // Transpozīcijas tabulas meklēšana — ja atrasts pietiekams ieraksts, izmanto to
  const key = boardKey();
  const tt = transposition.get(key);
  if (tt && tt.depth >= depth) {
    return tt.score;
  }

  let value = -Infinity;
  const moves = generateMoves();

  // Ātri aprēķina heuristiku katrai kustībai un sakārto, lai alpha-beta labāk strādātu
  const scoredMoves = moves.map(col => {
    const r = getLowestEmptyRow(col);
    gameBoard[r][col] = player;
    const s = evaluateBoard(player);
    gameBoard[r][col] = null;
    return {col, s};
  }).sort((a,b) => b.s - a.s);

  const opponent = player === 'red' ? 'yellow' : 'red';

  for (const {col} of scoredMoves) {
    const row = makeMove(col, player);
    if (row === null) continue;

    let score;
    try {
      score = -negamaxWithTT(depth - 1, -beta, -alpha, opponent, startTime, timeLimit);
    } catch (err) {
      // Ja timeout vai cits izņēmums — atceļ gājienu un pārmanto izņēmumu augstāk
      undoMove(col);
      throw err;
    }

    undoMove(col);

    if (score > value) value = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  // Saglabā rezultātu transpozīcijas tabulā
  transposition.set(key, { score: value, depth });

  return value;
}

// Iteratīva dziļuma meklēšana ar laika limitu — atgriež labāko kolonnas izvēli
function chooseBestMoveIterative(player, maxDepth = 12, timeLimit = IMPOSSIBLE_TIME_LIMIT) {
  const startTime = performance.now();
  transposition.clear();
  let bestCol = null;
  let bestScore = -Infinity;

  // Pārbauda tūlītējas uzvaras / bloķēšanas iespējas pirms dziļākas meklēšanas
  const winNow = scoreCheck(player);
  if (winNow !== null) return winNow;
  const blockNow = scoreCheck(player === 'red' ? 'yellow' : 'red');
  if (blockNow !== null) return blockNow;

  try {
    for (let depth = 1; depth <= maxDepth; depth++) {
      let localBest = null;
      let localBestScore = -Infinity;

      // Generē kustības un iepriekšējā heuristiskā kārtībā tās sakārto
      const moves = generateMoves();
      const scoredMoves = moves.map(col => {
        const r = getLowestEmptyRow(col);
        gameBoard[r][col] = player;
        const s = evaluateBoard(player);
        gameBoard[r][col] = null;
        return {col, s};
      }).sort((a,b) => b.s - a.s);

      const opponent = player === 'red' ? 'yellow' : 'red';

      for (const {col} of scoredMoves) {
        const row = makeMove(col, player);
        if (row === null) continue;

        const score = -negamaxWithTT(depth - 1, -Infinity, Infinity, opponent, startTime, timeLimit);
        undoMove(col);

        if (score > localBestScore) {
          localBestScore = score;
          localBest = col;
        }
      }

      // Ja atrasts labāks gājiens — atjauno bestCol
      if (localBest !== null) {
        bestCol = localBest;
        bestScore = localBestScore;
      }

      // Pārbauda laiku — ja palicis maz laika, pārtrauc iterative deepening
      if (performance.now() - startTime > timeLimit - 30) break;
    }
  } catch (err) {
    // Timeout gadījumā atgriež pēdējo validēto bestCol; citos izņēmumos pārmanto izņēmumu
    if (err.message !== 'timeout') throw err;
  }

  return bestCol;
}

// UI un notikumu apstrāde (bez stratēģijas izmaiņām)
// Retry pogas loģika: restartē spēles laukumu un iestata, kurš sāk
retryBtn.addEventListener("click", () => {
  retryBtn.classList.add("hidden");
  gameover = false;
  createBoard();
  gameCount++;
  if (currentGameMode !== "") {
    first = true;
    if (gameCount % 2 !== 0) {
      statusText.textContent = "Player starts!";
    }
    else {
      statusText.textContent = "Computer starts!";
      singlePlayerMode();
    }
  }
  else {
    if (gameCount % 2 !== 0) {
      statusText.textContent = "Red starts!";
    }
    else {
      togglePlayer();
      statusText.textContent = "Yellow starts!";
    }
  }
});

// UI: Single player pogas apstrāde — iestata režīmu un rāda izvēli
singlePlayerBtn.addEventListener("click", () => {
  createBoard();
  statusText.textContent = "Choose the difficulity level!";
  levelSelectiondiv.style.display = 'block';
  toggleVisibilityBlock(modeSelectiondiv);
  toggleVisibilityBlock(returnDiv);
});

// UI: Two player poga — sāk spēli divatā
twoPlayerBtn.addEventListener("click", () => {
  gameover = false;
  createBoard();
  toggleVisibilityBlock(modeSelectiondiv);
  toggleVisibilityBlock(returnDiv);
  statusText.textContent = "Red starts!";
  toggleVisibilityBlock(score2);
});

// Līmeņa izvēles apstrāde — iestata currentGameMode un UI
function levelChoice (button) {
  toggleVisibilityBlock(levelSelectiondiv);
  statusText.textContent = "Choose a position!";
  toggleVisibilityBlock(score);
  turnCount = 1;
  gameCount = 1;
  singlePlayerStart = true;
  gameover = false;
  if (button.textContent.trim() === "Regular") {
    statusText.textContent = "Regular mode: Choose a position!";
    currentGameMode = "Regular";
  } 
  else if (button.textContent.trim() === "Hard") {
    statusText.textContent = "Hard mode: Choose a position!";
    currentGameMode = "Hard";
  }
  else if (button.textContent.trim() === "Impossible") {
    statusText.textContent = "Impossible mode: Choose a position!";
    currentGameMode = "Impossible";
  }
}

// Palīgfunkcija — mainīt elementa redzamību
function toggleVisibilityBlock(element) {
  if (element.style.display === 'none') {
      element.style.display = 'block';
  } else {
      element.style.display = 'none';
  }
}

// Līmeņa pogu event listeneri
level1.addEventListener('click', function () { levelChoice(level1); });
level2.addEventListener('click', function () { levelChoice(level2); });
level3.addEventListener('click', function () { levelChoice(level3); });

returnBtn.addEventListener('click', function () { returnButton(); }); 

// Inicializē spēles laukumu pie lapas ielādes
createBoard();