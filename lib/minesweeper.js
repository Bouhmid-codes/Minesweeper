/* eslint-disable no-restricted-globals */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable no-return-assign */

// *********************** generate grid elements (rows and tds) ***************
const emoji = document.querySelector('#emoji');
emoji.addEventListener('click', () => location.reload());

const gridArray = [];
const rowsArray = [];

const startGame = () => {
  for (let i = 0; i < 100; i++) {
    const td = document.createElement('td');
    td.classList.add('unopened');
    gridArray.push(td);
  }

  // ******************* save the elements inside rows and inside an array *******

  while (gridArray.length > 0) {
    rowsArray.push(gridArray.splice(0, 10));
  }

  // *********************** insert the grid elements into the DOM ***************

  rowsArray.forEach((row) => {
    const tableRow = document.createElement('tr');
    row.forEach(tdElement => tableRow.insertAdjacentElement("beforeend", tdElement));

    document.querySelector('tbody').insertAdjacentElement("beforeend", tableRow);
  });
};

startGame();

const allCells = document.querySelectorAll('td');

// *********************** function for First click ****************************

const findNeighbours = (cellCol, cellRow) => {
  const neighbourFinders = [-1, 0, 1];

  neighbourFinders.forEach((num) => {
    const neighbourRowIndex = cellRow + num;
    const row = rowsArray[neighbourRowIndex];

    if (neighbourRowIndex < 0 || neighbourRowIndex > 9) { return; }
    neighbourFinders.forEach((finder) => {
      const neighbourCellIndex = cellCol + finder;
      if (neighbourCellIndex >= 0 && neighbourCellIndex <= 9) {
        row[neighbourCellIndex].dataset.safe = true;
      }
    });
  });
};

// *********************** distribute mines on grid ****************************
const plantMines = () => {
  for (let i = 0; i < 10; i++) {
    const randomRow = (Math.round(Math.random() * 9));
    const randomCol = (Math.round(Math.random() * 9));
    const randomCell = rowsArray[randomRow][randomCol];

    if (!randomCell.hasAttribute('data-safe') && !randomCell.hasAttribute('data-mine')) {
      randomCell.dataset.mine = true;
    } else {
      i--;
    }
  }
};

// // *********************** assign tiles neighbouring mines with numbers *****
// // *********************** Check and Tag neighbours functions ***************


const tagCell = (neighbourCell) => {
  if (neighbourCell && !neighbourCell.hasAttribute('data-mine')) {
    if (!neighbourCell.hasAttribute('data-number')) {
      neighbourCell.dataset.number = '1';
    } else {
      const currentNumber = Number(neighbourCell.dataset.number);
      neighbourCell.dataset.number = currentNumber + 1;
    }
  }
};

const checkNeighboursCells = (mineCellIndex, mineCellRow) => {
  const neighbourFinders = [-1, 0, 1];
  neighbourFinders.forEach((num) => {
    const neighbourRowIndex = mineCellRow + num;
    const row = rowsArray[neighbourRowIndex];
    if (neighbourRowIndex < 0 || neighbourRowIndex > 9) { return; }
    neighbourFinders.forEach((finder) => {
      const neighbourCellIndex = mineCellIndex + finder;
      if (neighbourCellIndex < 0 || neighbourRowIndex > 9) { return; }
      tagCell(row[neighbourCellIndex]);
    });
  });
};

const tagNeighbourCells = (mineCells) => {
  mineCells.forEach((mineCell) => {
    const mineCellIndex = mineCell.cellIndex;
    const mineCellRow = mineCell.parentElement.rowIndex;
    checkNeighboursCells(mineCellIndex, mineCellRow);
  });
};

// ************************ Flood-fill *****************************************
const validCoordinates = (allRows, row, col) => {
  return (row >= 0 && row < allRows.length && col >= 0 && col < allRows[row].length);
};

const reveal = (allRows, row, col) => {
  if (!validCoordinates(allRows, row, col)) return;

  const current = allRows[row][col];
  if (current.hasAttribute('data-mine')) return;
  if (current.classList.contains('opened')) return;

  if (current.hasAttribute('data-number')) {
    current.classList.remove('unopened');
    current.classList.add('opened', `mine-neighbour-${current.dataset.number}`);
    return;
  }

  current.classList.remove('unopened');
  current.classList.add('opened');

  reveal(allRows, row - 1, col);
  reveal(allRows, row + 1, col);
  reveal(allRows, row, col - 1);
  reveal(allRows, row, col + 1);
};


// ************************** First click logic used ***************************

// first click => reserve square => generate mines excluding reserved cells
// => generate numbers => flood fill reveal;

// ************************** state variables **********************************

let firstClick = false;
let gameOver = false;
let allMineCells;
let flags = 10;

const flagsDisplay = document.querySelector('#flags');

flagsDisplay.innerText = flags;

// ************************** timer *************************************


let seconds = 0;
let intervalId;
const timer = document.querySelector('#timer');

const startTimer = () => {
  intervalId = setInterval(() => {
    seconds += 1;
    timer.innerText = seconds;
  }, 1000);
};

const stopTimer = () => clearInterval(intervalId);

// ************************** win check ****************************************

const checkWin = () => {
  const allOpenedCells = document.querySelectorAll('.opened');
  const win = allOpenedCells.length + allMineCells.length;
  if (win === 100) {
    gameOver = true;
    emoji.src = '/img/face-laugh-beam-regular.svg';
    stopTimer();
  }
};

// ************************** run the game *************************************

allCells.forEach((cell) => {
  cell.addEventListener('click', (event) => {
    const cellColumn = event.currentTarget.cellIndex;
    const cellRow = event.currentTarget.parentElement.rowIndex;
    const flagged = event.currentTarget.classList.contains('flagged');

    if (!gameOver) {
      if (!firstClick) {
        findNeighbours(cellColumn, cellRow);
        plantMines();
        allMineCells = document.querySelectorAll('[data-mine]');
        tagNeighbourCells(allMineCells);
        reveal(rowsArray, cellRow, cellColumn);
        startTimer();
        firstClick = true;
      }

      if (event.currentTarget.hasAttribute('data-mine') && !flagged) {
        allMineCells.forEach((mineCell) => {
          mineCell.classList.add('mine');
        });
        emoji.src = '/img/face-dizzy-regular.svg';
        stopTimer();
        gameOver = true;
      } else if (!flagged) {
        reveal(rowsArray, cellRow, cellColumn);
      }
      checkWin();
    }
  });

  cell.addEventListener('contextmenu', (event) => {
    const flagged = event.currentTarget.classList.contains('flagged');
    event.preventDefault();
    if (flags > 0 && !flagged && firstClick && !gameOver && !cell.classList.contains('opened')) {
      event.currentTarget.classList.add('flagged');
      flags--;
      flagsDisplay.innerText = flags;
    } else if (flagged) {
      event.currentTarget.classList.remove('flagged');
      flags++;
      flagsDisplay.innerText = flags;
    }
  });

  cell.addEventListener('mousedown', () => {
    if (!gameOver) { emoji.src = '/img/face-surprise-regular.svg'; }
  });

  cell.addEventListener('mouseup', () => {
    if (!gameOver) { emoji.src = '/img/face-smile-regular.svg'; }
  });
});
