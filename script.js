// script.js — Tic-Tac-Toe loģika (UI un spēles vadība).
// Īsi: šis fails inicializē DOM elementus, notur spēles stāvokli, satur helper funkcijas
// un galvenās spēles funkcijas (single-player un two-player gājienu apstrāde).

document.addEventListener('DOMContentLoaded', function () {
    // DOM references — pogas un UI elementi
    var board = document.getElementById('board');
    var btn1 = document.getElementById('btn1');
    var btn2 = document.getElementById('btn2');
    var btn3 = document.getElementById('btn3');
    var btn4 = document.getElementById('btn4');
    var btn5 = document.getElementById('btn5');
    var btn6 = document.getElementById('btn6');
    var btn7 = document.getElementById('btn7');
    var btn8 = document.getElementById('btn8');
    var btn9 = document.getElementById('btn9');
    var textbtn = document.getElementById('textbtn');
    var retrybtn = document.getElementById('retrybtn');
    var returndiv = document.getElementById('return');
    var returnbtn = document.getElementById('returnbtn');
    var singlePlayerbtn = document.getElementById('singlePlayerbtn');
    var twoPlayerbtn = document.getElementById('twoPlayerbtn');
    var gamemodediv = document.getElementById('gamemode');
    var diff = document.getElementById('diff');
    var levelsdiv = document.getElementById('levels');
    var level1 = document.getElementById('level1');
    var level2 = document.getElementById('level2');
    var level3 = document.getElementById('level3');
    var score = document.getElementById('scoreText');
    var score2 = document.getElementById('scoreText2');

    // Spēles dati — masīvi un pozīciju saraksti
    var buttons = [btn1, btn2, btn3, btn4, btn5, btn6, btn7, btn8, btn9];
    var freePositions = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // pieejamās pozīcijas spēles laikā
    var corners = [1, 3, 7, 9];
    var edges = [2, 4, 6, 8];

    // UI sākotnējā stāvokļa slēpšana
    retrybtn.style.display = 'none';
    returndiv.style.display = 'none';
    textbtn.style.display = 'none';
    levelsdiv.style.display = 'none';
    score.style.display = 'none';
    score2.style.display = 'none';

   // Spēles stāvokļa mainīgie (kam īss paskaidrojums zemāk)
    let currentGameMode = "Two Player"; // režīms: "Two Player", "Regular", "Hard", "Impossible"
    let Xturn = true;                   // kura puse gājienā (true — X)
    let gameover = false;               // vai spēle beigusies
    let gamestart = false;              // vai spēle sākta (two-player starts)
    let singlePlayerStart = false;      // vai single-player režīms aktīvs
    let first = true;                   // iekšējais karogs pirmajam gājienam
    let compStart = false;              // vai dators sāk spēli
    let gameCount = 1;                  // kopējais spēļu skaits
    let turnCount = 1;                  // gājienu skaits
    let playerSymbol;                   // spēlētāja simbols "X" vai "O"
    let playerColor;                    // spēlētāja krāsa ("red"/"blue")
    let compSymbol;                     // datora simbols
    let compColor;                      // datora krāsa
    let compStartChoice = 0;            // datora izvēles uzstādījumi
    let compSecondChoice = 0;
    let playerStartChoice = 0;          // kurā pozīcijā spēlētājs sāka
    let wins = 0;                       // uzvaras
    let ties = 0;                       // neizšķirti
    let losses = 0;                     // zaudējumi

    // Pārvieto lietotāju uz sākumlapu
    function returnButton () {
        window.location.href = "tic-tac-toe.html";
    }

    // Spēles režīma izvēle — UI pārvaldība (atver/аizver blokus)
    function gameModeChoice (button) {
        if (button.textContent.trim() === "Single Player") {
            toggleVisibilityFlex(gamemodediv);
            toggleVisibilityBlock(levelsdiv);
        } else {
            toggleVisibilityFlex(gamemodediv);
            toggleVisibilityFlex(textbtn);
            gamestart = true;
            toggleVisibilityBlock(diff);
            toggleVisibilityBlock(score2);
        }
        toggleVisibilityFlex(returndiv);
    }

    // Grūtības izvēle: konfigurē režīmu un UI
    function levelChoice (button) {
        toggleVisibilityBlock(diff);
        toggleVisibilityBlock(levelsdiv);
        textbtn.textContent = "Choose a position!";
        toggleVisibilityFlex(textbtn);
        toggleVisibilityBlock(score);
        turnCount = 1;
        gameCount = 1;
        singlePlayerStart = true;
        if (button.textContent.trim() === "Regular") {
            currentGameMode = "Regular";
        } 
        else if (button.textContent.trim() === "Hard") {
            currentGameMode = "Hard";
        }
        else if (button.textContent.trim() === "Impossible") {
            currentGameMode = "Impossible";
        }
    }

    // Palīgfunkcija: izvēlas nejaušu elementu no masīva
    function getRandomPosition(array) {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    // Palīgfunkcija: noņem elementu masīvā (brīvas pozīcijas atjaunināšana)
    function removeElement(array, element) {
        const index = array.indexOf(element);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    // Simbolu piešķiršana atkarībā no spēļu kārtas (lai P1/P2 maiņa)
    function symbolDeclaration() {
        if (gameCount % 2 !== 0) {
            playerSymbol = "X";
            playerColor = "red";
            compSymbol = "O"
            compColor = "blue";
        }
        else {
            playerSymbol = "O";
            playerColor = "blue";
            compSymbol = "X";
            compColor = "red";
        }
    }

    // --- Single-player loģika (vienkāršs AI + režīmu atbalsts) ---
    // Funkcija apstrādā spēlētāja klikšķi single-player režīmā,
    // ievieto spēlētāja simbolu, pārbauda uzvaru, tad izvēlas datora gājienu un to izpilda.
    async function singlePlayerMode (button) {
        if (button.textContent.trim() !== "" || gameover === true || singlePlayerStart === false) {
            return;
        } else {
            let currbtn = buttonToPosition(button);
            removeElement(freePositions, currbtn);
            if (first) {
                first = false;
                playerStartChoice = currbtn;
                if (!compStart) {
                    symbolDeclaration();
                }
            }
            button.textContent = playerSymbol;
            button.style.color = playerColor;
            if (win(playerSymbol)) {
                wins++;
                score.textContent = "Wins: " + wins + " Ties: " + ties + " Losses: " + losses;
                textbtn.textContent = "You won!";
                gameover = true;
                board.style.backgroundColor = playerColor;
                toggleVisibilityBlock(retrybtn);
                return;
            }
            if (turnCount === 5) {
                tieCheck();
                score.textContent = "Wins: " + wins + " Ties: " + ties + " Losses: " + losses;
                if (gameover){
                    return;
                }
            }
    
            let computerChoice;
            if (currentGameMode === "Impossible") {
                if (compStart) {
                    computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || centerSetup(button) || cornerSetup() || edgeSetup() || getRandomPosition(freePositions);
                }
                else {
                    if (playerStartChoice === 5) {
                        computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || centerDefend(button) || getRandomPosition(freePositions);
                    }
                    else if (corners.includes(playerStartChoice)) {
                        computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || cornerDefend(button) || getRandomPosition(freePositions);
                    }
                    else {
                        computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || edgeDefend(button) || getRandomPosition(freePositions);
                    }
                }
            }
            else if (currentGameMode === "Hard") {
                if (compStart) {
                    computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || centerSetup(button) || cornerSetup() || getRandomPosition(freePositions);
                }
                else {
                    if (playerStartChoice === 5) {
                        computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || centerDefend(button) || getRandomPosition(freePositions);
                    }
                    else if (corners.includes(playerStartChoice)) {
                        computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || cornerDefend(button) || getRandomPosition(freePositions);
                    }
                    else {
                        computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || getRandomPosition(freePositions);
                    }
                    
                }
            }
            else {
                computerChoice = scoreCheck(compSymbol) || scoreCheck(playerSymbol) || getRandomPosition(freePositions);
            }
            removeElement(freePositions, computerChoice);
            singlePlayerStart = false;
            textbtn.textContent = "The computer is thinking...";
            await sleep(1000);
            singlePlayerStart = true;
            textbtn.textContent = "Choose your position!";
            buttons[computerChoice-1].textContent = compSymbol;
            buttons[computerChoice-1].style.color = compColor;
            if (win(compSymbol)) {
                losses++;
                score.textContent = "Wins: " + wins + " Ties: " + ties + " Losses: " + losses;
                textbtn.textContent = "You lost!";
                gameover = true;
                board.style.backgroundColor = compColor;
                toggleVisibilityBlock(retrybtn);
                return;
            }
            if (turnCount === 4) {
                tieCheck();
                score.textContent = "Wins: " + wins + " Ties: " + ties + " Losses: " + losses;
                if (gameover){
                    return;
                }
            }
            turnCount++;
        }
    }

   // --- Two-player gājienu apstrāde / kopīga kontrole ar single-player ---
   // Ja single-player režīms aktīvs, padod klikšķi uz singlePlayerMode.
   // Citādi — apstrādā X/O maiņu, uzvaras pārbaudes un UI atjaunināšanu.
   function BoardControlAndTwoPlayerMode(button) {
        if (singlePlayerStart === true && gameover === false) {
            singlePlayerMode(button);
        }
        else if (button.textContent.trim() !== "" || gameover === true || gamestart === false) {
            return;
        }
        else {
            if (Xturn) {
                Xturn = false;
                button.textContent = "X";
                button.style.color = "red";
                if (win("X")) {
                    wins++;
                    if (textbtn.textContent === "Player 2, pick your position!") {
                        textbtn.textContent = "Player 2 wins!";
                    }
                    textbtn.textContent = "Player 1 wins!";
                    score2.textContent = "Player 1: " + wins + " Player 2: " + losses + " Ties: " + ties;
                    gameover = true;
                    board.style.backgroundColor = "red";
                    toggleVisibilityBlock(retrybtn);
                    return;
                }
                if (textbtn.textContent === "Player 2, pick your position!") {
                    textbtn.textContent = "Player 1, pick your position!";
                }
                else {
                    textbtn.textContent = "Player 2, pick your position!";
                }
            }
            else {
                Xturn = true;
                button.textContent = "O";
                button.style.color = "blue";
                if (win("O")) {
                    losses++;
                    if (textbtn.textContent === "Player 1, pick your position!") {
                        textbtn.textContent = "Player 1 wins!";
                    }
                    textbtn.textContent = "Player 2 wins!";
                    score2.textContent = "Player 1: " + wins + " Player 2: " + losses + " Ties: " + ties;
                    gameover = true;
                    board.style.backgroundColor = "blue";
                    toggleVisibilityBlock(retrybtn);
                    return;
                }
                if (textbtn.textContent === "Player 1, pick your position!") {
                    textbtn.textContent = "Player 2, pick your position!";
                }
                else {
                    textbtn.textContent = "Player 1, pick your position!";
                }
            }
            tieCheck();
            score2.textContent = "Player 1: " + wins + " Player 2: " + losses + " Ties: " + ties;
        }
    }

    // Palīgfunkcija: pauze asinhronai domāšanai
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function oppositeEdge (edge) {
    // Atgriež pretējo malu (edge) uz 2↔8 un 4↔6 pāriem
    let op;
    if (edge === 2) { op = 8; }
    else if (edge === 4) { op = 6; }
    else if (edge === 6) { op = 4; }
    else if (edge === 8) { op = 2; }
    return op;
}

function edgeDefend(button) {
    // Aizsardzības stratēģija, ja spēlētājs sāk malā (edge).
    // Atkarībā no turnCount un iepriekšējām datora izvēlēm mēģina izvēlēties drošu gājienu.
    let setupMove = 0;
    let currbtn = buttonToPosition(button);
    switch (turnCount) { 
        case 1:
            if (edges.includes(playerStartChoice)) {
                while (true) {
                    var rand = getRandomPosition(freePositions);
                    var twocorners = adjacentCorners(playerStartChoice);
                    if (rand === 5 || rand === twocorners[0] || rand === twocorners[1]) {
                        setupMove = rand;
                        break;
                    }
                }
                compSecondChoice = setupMove;
            }
            break;
        case 2:
            if (compSecondChoice === 5 && currbtn === oppositeEdge(playerStartChoice)) {
                while (true) {
                    var rand = getRandomPosition(freePositions);
                    if (edges.includes(rand)) {
                        setupMove = rand;
                        break;
                    }
                }
            }
            else if (compSecondChoice === 5 && corners.includes(currbtn)) {
                setupMove = cornerDefendNonAdjacentEdge(currbtn, playerStartChoice);
            }
            else if (corners.includes(compSecondChoice) && edges.includes(currbtn)) {
                if (nonAdjacentEdgeCase(compSecondChoice, currbtn)) {
                    for (var pos of freePositions) {
                        var adjEdges = adjacentEdges(pos);
                        var edge1 = adjEdges[0], edge2 = adjEdges[1];
                        if (corners.includes(pos) && pos !== oppositeCorner(compSecondChoice) && buttons[edge1-1].textContent === "" && buttons[edge2-1].textContent === "") {
                            setupMove = pos;
                        }
                    }
                }
                else {
                    setupMove = 5;
                }
            }
            else if (corners.includes(compSecondChoice) && corners.includes(currbtn)) {
                setupMove = 5;
            }
            break;
        default:
            return 0;
    }
    return setupMove;
}

function edgeSetup() {
    // ja dators sāk malā — izvēlas atbilstošu otro gājienu,
    // lai izveidotu lamatas vai drošu pozīciju.
    let setupMove = 0;
    switch (turnCount) {
        case 1:
            if (edges.includes(compStartChoice) && playerStartChoice === 5) {
                let excludedEdge = oppositeEdge(compStartChoice);
                edgesExcludeOpposite = edges.filter(item => item !== excludedEdge);
                for (var edge of edgesExcludeOpposite) {
                    if (buttons[edge-1].textContent === "") {
                        setupMove = edge; // Tikai pārliecinās, ka nezaudē (nav 100% lamatas visos gadījumos)
                    }
                }
            }
            else if (edges.includes(compStartChoice) && edges.includes(playerStartChoice)) {
                setupMove = 5;
            }
            else if (edges.includes(compStartChoice) && corners.includes(playerStartChoice)) {
                for (var pos of freePositions) {
                    if (corners.includes(pos)) {
                        setupMove = pos;
                    }
                }
            }
            compSecondChoice = setupMove;
            break;
        case 2:
            if (playerStartChoice === oppositeEdge(compStartChoice)) {
                let freeEdges = [];
                for (var edge of edges) {
                    for (var freeSpot of freePositions) {
                        if (edge === freeSpot) {
                            freeEdges.push(edge);
                        }
                    }
                }
                setupMove = getRandomPosition(freeEdges);
            }
            if (edges.includes(compStartChoice) && compSecondChoice === 5) {
                adjacentCorners(compStartChoice);
                setupMove = getRandomPosition(adjacentCorners);
            }
            break;
        default:
            return 0;
    }
    return setupMove;
}

// Funkcija, lai aizsargātos no lamatām, kuras sākas ar centru
function centerDefend(button) {
    // Ja spēlētājs sāka centrā, dators mēģina aizsargāties izvēloties stūrus,
    // atkarībā no turnCount un pašreizējā gājiena.
    let setupMove = 0;
    let currbtn = buttonToPosition(button);
    switch (turnCount) {
        case 1:
            if (playerStartChoice === 5) {
                setupMove = getRandomPosition(corners);
            }
            break;
        case 2:
            if (corners.includes(currbtn)) {
                let freeCorners = [];
                for (var corner of corners) {
                    for (var freeSpot of freePositions) {
                        if (corner === freeSpot) {
                            freeCorners.push(corner);
                        }
                    }
                }
                setupMove = getRandomPosition(freeCorners);
            }
            break;
        default:
            return 0;
    }
    return setupMove;
}

// Funkcija, lai uzliktu lamatas sākot ar centru
function centerSetup(button) {
    // ja dators sāka centrā, mēģina izveidot lamatas atkarībā no spēlētāja izvēles.
    let setupMove = 0;
    let currbtn = buttonToPosition(button);
    switch (turnCount) {
        case 1:
            if (compStartChoice === 5 && edges.includes(currbtn)) {
                setupMove = getRandomPosition(corners);
            }
            else if (compStartChoice === 5 && corners.includes(currbtn)) {
                if (currbtn === 1) { setupMove = 9; }
                else if (currbtn === 3) { setupMove = 7; }
                else if (currbtn === 7) { setupMove = 3; }
                else if (currbtn === 9) { setupMove = 1; }
            }
            break;
        case 2:
            let freeCorners = [];
            for (var corner of corners) {
                for (var freeSpot of freePositions) {
                    if (corner === freeSpot) {
                        freeCorners.push(corner);
                    }
                }
            }
            setupMove = cornerCheck(freeCorners);
            break;
        default:
            return 0;
    }
    return setupMove;
}

function oppositeCorner(startCorner) {
    // Atgriež pretējo stūri (1↔9, 3↔7)
    let oppositecorner;
    if (startCorner === 1) { oppositecorner = 9; }
    else if (startCorner === 3) { oppositecorner = 7; }
    else if (startCorner === 7) { oppositecorner = 3; }
    else if (startCorner === 9) { oppositecorner = 1; }
    return oppositecorner;
}

// Funkcija, lai aizsargātos no lamatām, kuras sākas ar stūri
function cornerDefend(button) {
    // Ja spēlētājs sāka stūrī, dators mēģina atbildēt ar centru vai malām — atkarībā no turnCount.
    let setupMove = 0;
    let currbtn = buttonToPosition(button);
    switch (turnCount) {
        case 1:
            if (corners.includes(playerStartChoice)) {
                setupMove = 5;
            }
            break;
        case 2:
            if (corners.includes(currbtn)) {
                setupMove = getRandomPosition(edges);
            }
            else if(nonAdjacentEdgeCase(playerStartChoice, currbtn)) {
                setupMove = cornerDefendNonAdjacentEdge(playerStartChoice, currbtn);
            }
            break;
        default:
            return 0;
    }
    return setupMove;
}

// Funkcija, lai uzliktu lamatas sākot ar stūri
function cornerSetup() {
    // Ja sāk stūrī — dators mēģina izvērst stratēģiju, kurā var radīt uzvaras iespējas
    let setupMove = 0;
    switch (turnCount) {
        case 1:
            if (corners.includes(compStartChoice) && corners.includes(playerStartChoice)) {
                let freeCorners = [];
                for (var corner of corners) {
                    for (var freeSpot of freePositions) {
                        if (corner === freeSpot) {
                            freeCorners.push(corner);
                        }
                    }
                }
                setupMove = getRandomPosition(freeCorners);
            }
            else if (corners.includes(compStartChoice) && edges.includes(playerStartChoice)) {
                setupMove = adjacentEdgeCase() || nonAdjacentEdgeCase(compStartChoice, playerStartChoice);
            }
            else if (corners.includes(compStartChoice) && playerStartChoice === 5) {
                setupMove = getRandomPosition(freePositions);
            }
            break;
        case 2:
            if (edges.includes(playerStartChoice)) {
                if (adjacentEdgeCase() !== 0) {
                    setupMove = oppositeCorner(compStartChoice);
                }
                else {
                    let excludedCorner = oppositeCorner(compStartChoice);
                    cornersExcludeOpposite = corners.filter(item => item !== excludedCorner);
                    for (var corner of cornersExcludeOpposite) {
                        if (buttons[corner-1].textContent === "") {
                            setupMove = corner;
                        }
                    }
                }
            }
            else {
                for (var corner of corners) {
                    if (buttons[corner-1].textContent === "") {
                        setupMove = corner;
                    }
                }
            }
            break;
        default:
            return 0;
    }
    return setupMove;
}

function adjacentEdges(corner) {
    // Atgriež malas, kas pieskaras dotajam stūrim (piem., kampam 1 -> [2,4])
    let adjEdges = [];
    if (corner === 1) {
        adjEdges = [2, 4];
    }
    else if (corner === 3) {
        adjEdges = [2, 6];
    }
    else if (corner === 7) {
        adjEdges = [4, 8];
    }
    else if (corner === 9) {
        adjEdges = [6, 8];
    }
    return adjEdges;
}

function adjacentCorners(edge) {
    // Atgriež stūrus, kas pieskaras dotajai malai (piem., malai 2 -> [1,3])
    let adjCorners = [];
    if (edge === 2) {
        adjCorners = [1, 3];
    }
    else if (edge === 4) {
        adjCorners = [1, 7];
    }
    else if (edge === 6) {
        adjCorners = [3, 9];
    }
    else if (edge === 8) {
        adjCorners = [7, 9];
    }
    return adjCorners;
}

function cornerDefendNonAdjacentEdge(pos1, pos2) {
    // Īpašas atbildes kombinācijas, ja situācija ir "non-adjacent edge"
    // Atgriež nejaušu gājienu no iepriekš definētām iespējām.
    let setupMoves = [];
    if (pos1 === 1 && pos2 === 6) {
        setupMoves = [3, 8, 9];
    }
    else if (pos1 === 1 && pos2 === 8) {
        setupMoves = [6, 7, 9];
    }
    else if (pos1 === 3 && pos2 === 4) {
        setupMoves = [1, 7, 8];
    }
    else if (pos1 === 3 && pos2 === 8) {
        setupMoves = [4, 7, 9];
    }
    else if (pos1 === 7 && pos2 === 2) {
        setupMoves = [1, 3, 6];
    }
    else if (pos1 === 7 && pos2 === 6) {
        setupMoves = [2, 3, 9];
    }
    else if (pos1 === 9 && pos2 === 2) {
        setupMoves = [1, 3, 4];
    }
    else if (pos1 === 9 && pos2 === 4) {
        setupMoves = [1, 2, 7];
    }
    return getRandomPosition(setupMoves);
}

    // Atgriež noteiktu setup-move konkrētos adjacent/non-adjacent gadījumos
function adjacentEdgeCase() {
    let setUpMove;
    if (compStartChoice === 1 && playerStartChoice === 2) {
        setUpMove = 7;
    }
    else if (compStartChoice === 1 && playerStartChoice === 4) {
        setUpMove = 3;
    }
    else if (compStartChoice === 3 && playerStartChoice === 2) {
        setUpMove = 9;
    }
    else if (compStartChoice === 3 && playerStartChoice === 6) {
        setUpMove = 1;
    }
    else if (compStartChoice === 7 && playerStartChoice === 4) {
        setUpMove = 9;
    }
    else if (compStartChoice === 7 && playerStartChoice === 8) {
        setUpMove = 1;
    }
    else if (compStartChoice === 9 && playerStartChoice === 6) {
        setUpMove = 7;
    }
    else if (compStartChoice === 9 && playerStartChoice === 8) {
        setUpMove = 3;
    }
    return setUpMove;
}

// Non-adjacent edge gadījumu risinājums — atgriež konkrētu pozīciju
function nonAdjacentEdgeCase(pos1, pos2) {
    let setUpMove = 0;
    if (pos1 === 1 && pos2 === 6) {
        setUpMove = 3;
    }
    else if (pos1 === 1 && pos2 === 8) {
        setUpMove = 7;
    }
    else if (pos1 === 3 && pos2 === 4) {
        setUpMove = 1;
    }
    else if (pos1 === 3 && pos2 === 8) {
        setUpMove = 9;
    }
    else if (pos1 === 7 && pos2 === 2) {
        setUpMove = 1;
    }
    else if (pos1 === 7 && pos2 === 6) {
        setUpMove = 9;
    }
    else if (pos1 === 9 && pos2 === 4) {
        setUpMove = 7;
    }
    else if (pos1 === 9 && pos2 === 2) {
        setUpMove = 3;
    }
    return setUpMove;
}

// Pārbauda vai ir neizšķirts (visi lauki aizpildīti)
function tieCheck() {
    if (btn1.textContent.trim() !== "" && btn2.textContent.trim() !== "" && btn3.textContent.trim() !== "" && 
    btn4.textContent.trim() !== "" && btn5.textContent.trim() !== "" && btn6.textContent.trim() !== "" && 
    btn7.textContent.trim() !== "" && btn8.textContent.trim() !== "" && btn9.textContent.trim() !== "") {
        toggleVisibilityBlock(retrybtn);
        textbtn.textContent = "Tie game!";
        ties++;
        gameover = true;
    } else {
        return;
    }
}

// Definē uzvaras kombinācijas (3 rindas, 3 kolonnas, 2 diagonāles)
winningCombinations = [ [1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7] ];

// Meklē tūlītēju uzvaru vai bloķēšanu — ja 2 no 3 kombinācijas pozīcijām ir aizpildītas ar simbolu,
// atgriež brīvo pozīciju, ko izmantot (AI vai bloķēšanai).
function scoreCheck(symbol) {
    for (var i = 0; i < winningCombinations.length; i++) {
        let combination = winningCombinations[i];
        let count = 0;
        let freeSpot = null;

        for (var pos of combination) {
            if (buttons[pos - 1].textContent === symbol) {
                count++;
            } else if (freePositions.includes(pos)) {
                freeSpot = pos;
            }
        }

        if (count === 2 && freeSpot !== null) {
            return freeSpot;
        }
    }
    return 0;
}

// izvērtē brīvos stūrus un atgriež to, kurā dators var izveidot vairākas vinnes
function cornerCheck(freeCorners) {
    for (var corner of freeCorners) {
        var winCount = 0;
        for (var i = 0; i < winningCombinations.length; i++) {
            let combination = winningCombinations[i];
            let count = 0;
            let occupied = false;

            for (var pos of combination) {
                if (pos === corner) {
                    count++;
                }
                else if (buttons[pos - 1].textContent === compSymbol) {
                    count++;
                } 
                else if (buttons[pos - 1].textContent === playerSymbol) {
                    occupied = true;
                }
            }

            if (count === 2 && occupied === false) {
                winCount++;
            }
        }
        if (winCount >= 2) {
            return corner;
        }
    }
    return 0;
}

// Pārbauda, vai dotais simbols uzvar — izmanto pozīciju skaitīšanu pa rindām/kolonnām/diagonālēm
function win(symbol) {
    var win = false;
    var positions = [];
    var pos = 1;
    buttons.forEach(function(button) {
        if (button.textContent === symbol) {
            positions.push(pos)
        }
        pos++;
    });

    var rone = 0, rtwo = 0, rthree = 0, rdiagonal = 0;
    var cone = 0, ctwo = 0, cthree = 0, cdiagonal = 0;
    for (var n of positions) {
        if (n == 1 || n == 2 || n == 3) { rone++; }
        else if (n == 4 || n == 5 || n == 6) { rtwo++; }
        else if (n == 7 || n == 8 || n == 9) { rthree++; }

        if (n == 1 || n == 4 || n == 7) { cone++; }
        else if (n == 2 || n == 5 || n == 8) { ctwo++; }
        else if (n == 3 || n == 6 || n == 9) { cthree++; }

        if (n == 1 || n == 5 || n == 9) { rdiagonal++; }
        if ( n == 3 || n == 5 || n == 7) { cdiagonal++; }
    }

    if (rone == 3 || rtwo == 3 || rthree == 3 || rdiagonal == 3 || cone == 3 || ctwo == 3 || cthree == 3 || cdiagonal == 3) {
        win = true;
    }
    return win;
}

// Palīgs: pārveido pogas elementu uz pozīciju indeksu (1..9)
function buttonToPosition(button) {
    let pos = null;
    switch (button.id) {
        case "btn1":
            pos = 1;
            break;
        case "btn2":
            pos = 2;
            break;
        case "btn3":
            pos = 3;
            break;
        case "btn4":
            pos = 4;
            break;
        case "btn5":
            pos = 5;
            break;
        case "btn6":
            pos = 6;
            break;
        case "btn7":
            pos = 7;
            break;
        case "btn8":
            pos = 8;
            break;
        case "btn9":
            pos = 9;
            break;
        default:
            console.error("Invalid button ID");
    }
    return pos;
}

// UI palīgfunkcijas: redzami/neredzami bloki (block/flex)
function toggleVisibilityBlock(element) {
    if (element.style.display === 'none') {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

function toggleVisibilityFlex(element) {
    if (element.style.display === 'none') {
        element.style.display = 'flex';
    } else {
        element.style.display = 'none';
    }
}

// Reset funkcija un event listeneri — restartē spēli un piesaista klikšķus
retrybtn.addEventListener('click', function () {
    resetGame(currentGameMode);
});

function resetGame(mode) {
    first = true;
    turnCount = 1;
    gameover = false;
    gameCount++;
    buttons.forEach(button => {
        button.textContent = "";
    });
    if (mode === 'Two Player') {
        gamestart = true;
        board.style.backgroundColor = "black";
        retrybtn.style.display = 'none';
        if (gameCount % 2 == 0) {
            textbtn.textContent = "Player 2, pick your position!";
        }
        else {
            textbtn.textContent = "Player 1, pick your position!";
        }
        
    } 
    else {
        singlePlayerStart = true;
        board.style.backgroundColor = "black";
        retrybtn.style.display = 'none';
        textbtn.textContent = "Choose your position!";
        freePositions = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        symbolDeclaration();
        playerStartChoice = 0;
        compSecondChoice = 0;
        compStart = false;
        if (gameCount % 2 == 0) {
            compStart = true;
            compStartChoice = getRandomPosition(freePositions);
            removeElement(freePositions, compStartChoice);
            buttons[compStartChoice-1].textContent = compSymbol;
            buttons[compStartChoice-1].style.color = compColor;
        }
    }
}

// Piesaistam klikšķu notikumus pogām un UI pogām
btn1.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn1); });
btn2.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn2); });
btn3.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn3); });
btn4.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn4); });
btn5.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn5); });
btn6.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn6); });
btn7.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn7); });
btn8.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn8); });
btn9.addEventListener('click', function () { BoardControlAndTwoPlayerMode(btn9); });

singlePlayerbtn.addEventListener('click', function () { gameModeChoice(singlePlayerbtn); });
twoPlayerbtn.addEventListener('click', function () { gameModeChoice(twoPlayerbtn); });

level1.addEventListener('click', function () { levelChoice(level1); });
level2.addEventListener('click', function () { levelChoice(level2); });
level3.addEventListener('click', function () { levelChoice(level3); });

returnbtn.addEventListener('click', function () { returnButton(); }); 

});