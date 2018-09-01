/*jshint esversion: 6 */

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

// Start of my own code

// TODO: Maybe I should have a place to look up any given badge. It could include
// who it is registered to and what games they have out right now. As well as
// contact info.

const sheetId = '1JfujUhs04UqOIS6wAjYEiI9XPGc97-WerNtnNf99paI';

// Start Nav functions
const navLinks = document.querySelectorAll('.section-select-buttons a');
const sections = document.querySelectorAll('main > section');

/**
 * Adds click events to the nav links for single paginess
 */
navLinks.forEach(function (each) {
  each.addEventListener('click', function () {
    navLinks.forEach(function (each) {
      each.classList.remove('active');
    });
    this.classList.add('active');
    sections.forEach(function (eachSection) {
      eachSection.classList.add('hidden');
    });
    const thisSection = document.querySelector(`main > section.${this.dataset.section}`);
    thisSection.classList.remove('hidden');
  });
});

window.addEventListener('keydown', function (event) {
  const shift = event.shiftKey;
  const cmd = event.metaKey;
  const one = event.which === 49;
  if (cmd && shift && one) {
    event.preventDefault();
    toggleOptions();
  }
});

function toggleOptions() {
  const elements = document.querySelectorAll('.advanced-options');
  const navButtonsState = document.querySelector('.nav-buttons').classList;

  elements.forEach(function (each) {
    const currentState = each.classList;
    const active = currentState.contains('active');

    if (currentState.contains('hidden')) {
      currentState.remove('hidden');
    } else if (!active) {
      currentState.add('hidden');
    }
  });

  if (navButtonsState.contains('advanced-nav')) {
    navButtonsState.remove('advanced-nav');
  } else {
    navButtonsState.add('advanced-nav');
  }
}
// End Nav functions

// Start Registration functions

// TODO: Consider removing all doublechecks as a way to avoid the rate limit at google.

/**
 * Adds event to form submit to find user in spreadsheet and return user data
 */
// TODO: This needs to check to see if this person has already checked in. (Think through what we need to do if that comes up)
document.querySelector('#find-person').addEventListener('click', function (event) {
  event.preventDefault();

  const searchString = document.querySelector('#search-name').value;

  findUser(searchString);
});

document.querySelector('#toggle-add-badges-form').addEventListener('click', function (event) {
  event.preventDefault();

  document.querySelector('.add-badges-form').classList.toggle('hidden');
  document.querySelector('#toggle-add-badges-form').classList.toggle('rotated');
});

document.querySelector('#add-badges').addEventListener('click', function (event) {
  event.preventDefault();

  const userData = JSON.parse(document.querySelector('.user-data').dataset.userData);
  const currentQuantity = parseInt(userData.quantity);
  const badgesToAdd = parseInt(document.querySelector('.add-badges-form input').value);
  const newQuantity = currentQuantity + badgesToAdd;
  const userRow = userData.row;
  const userName = userData.name;

  document.querySelector('#toggle-add-badges-form').classList.toggle('rotated');

  postToGoogle(`C${userRow}`, newQuantity).then(function (response) {
    document.querySelector('.add-badges-form').classList.add('hidden');
    findUser(userName);
  });
});

document.querySelector('#register-new-guest').addEventListener('click', function (event) {
  event.preventDefault();

  document.querySelector('.registration-start-screen').classList.add('hidden');
  document.querySelector('.new-registration-view').classList.remove('hidden');
  document.querySelector('.cancel').classList.remove('hidden');
});

document.querySelector('.cancel i').addEventListener('click', function (event) {
  event.preventDefault();

  document.querySelectorAll('.visible-at-start').forEach(function (each) {
    each.classList.remove('hidden');
  });
  document.querySelectorAll('.hidden-at-start').forEach(function (each) {
    each.classList.add('hidden');
  });
});

document.querySelector('#submit-new-registration').addEventListener('click', function (event) {
  event.preventDefault();
  const newRegistrationInputs = document.querySelectorAll('.new-registration-form input');
  let validForm = true;

  newRegistrationInputs.forEach(function (each) {
    each.classList.remove('invalid-input');

    if (!each.value) {
      each.classList.add('invalid-input');
      validForm = false;
    }
  });

  if (validForm) {
    const name = document.querySelector('.new-registration-form-name').value;
    const email = document.querySelector('.new-registration-form-email').value;
    const phone = document.querySelector('.new-registration-form-phone').value;
    const badgecount = document.querySelector('.new-registration-form-badgecount').value;
    const id = `registered-day-of-${uuid()}`;

    const newUser = [
      id,
      email,
      badgecount,
      name,
      phone
    ];

    addNewUserToDatabase(newUser);
  }
});

function addNewUserToDatabase(user) {
  let nextRow;
  getFromGoogle('B:B').then(function (response) {
    nextRow = response.result.values.length + 1;

    postRowToGoogle(`${nextRow}:${nextRow}`, user).then(function (response) {
      findUser(user[1]);
    });
  });
}

/**
 * Retrieves user data for user that contains matching textContent
 * @param  {string} searchString  This is the query string from the form. It can
 *                                be name, email, phone, or order number.
 *                                // TODO: It would be nice if, when this found multiple options it would let you choose between them.
 */
function findUser(searchString) {
  const lowerCaseString = searchString.toLowerCase();

  getFromGoogle('A:F').then(function (response) {
    const data = response.result.values;
    let registrationEntry;
    let matchingRows = 0;

    data.forEach(function (each, i) {
      let foundMatch = false;
      const lowerCaseRow = each.map(function (arrayValue) {
        try {
          return arrayValue.toLowerCase();
        } catch (e) {
          console.log('You tried to make all the values in an array lowerCase but instead this happened:');
          console.log(e);
        }
      });

      lowerCaseRow.forEach(function (cell) {
        if (cell.includes(lowerCaseString)) {
          foundMatch = true;
          registrationEntry = {
            row: i + 1,
            orderId: each[0],
            email: each[1],
            quantity: each[2],
            name: each[3],
            phone: each[4],
            badges: JSON.parse(each[5] || false)
          };
        }
      });

      if (foundMatch) {
        matchingRows++;
      }
    });

    if (matchingRows > 1) {
      displayMessage(
        "Too Many Matching Orders",
        "Try searching with a different parameter (email, phone, etc.)"
      );
    } else if (registrationEntry) {
      buildUserView(registrationEntry);
      buildBadgeCodeInputs(registrationEntry);
      document.querySelector('.message-content').classList.add('hidden');
      document.querySelector('.registration-start-screen').classList.add('hidden');
      document.querySelector('.new-registration-view').classList.add('hidden');
      document.querySelector('.user-view').classList.remove('hidden');
      document.querySelector('.cancel').classList.remove('hidden');
    } else {
      displayMessage(
        "Order not found. Try again.",
        "Maybe check spelling or try searching with a different parameter (email, phone, etc.)");
    }
  });
}

/**
 * Adds data content to user profile in registration view.
 */
function buildUserView(registrationEntry) {
  document.querySelector('.user-data').setAttribute('data-user-data', JSON.stringify(registrationEntry));
  addTextToElement('.user-view .user-name', registrationEntry.name);
  addTextToElement('.user-view .user-orderId', `#${registrationEntry.orderId}`);
  addTextToElement('.user-view .user-email', registrationEntry.email);
  addTextToElement('.user-view .user-phone', prettifyPhoneNumber(registrationEntry.phone));
}

/**
 * Builds the correct number of badge inputs for the given user and puts them in
 * the DOM.
 */
function buildBadgeCodeInputs(registrationEntry) {
  let inputCount = registrationEntry.quantity;
  const userBadges = document.querySelector('.user-view .user-badges');
  let inputs = '';
  for (var i = 0; i < inputCount; i++) {
    inputs = `${inputs}\
              <p>Badge #${i + 1}</p>\
              <input \
                class="badge-input"\
                type="text" \
                value="${registrationEntry.badges[i] || ''}" \
                data-email="${registrationEntry.email}" \
                data-inputnumber="${i+1}" \
                data-inputcount="${inputCount}" \
                data-row="${registrationEntry.row}">
              <i class="locked-input fas fa-unlock"></i>`;
  }

  userBadges.innerHTML = inputs;
  checkLocks();
  document.querySelectorAll('.locked-input').forEach(function (each) {
    each.addEventListener('click', function (event) {
      event.preventDefault();

      this.classList.toggle('fa-lock');
      this.classList.toggle('fa-unlock');
      if (this.previousElementSibling.hasAttribute('disabled')) {
        this.previousElementSibling.removeAttribute('disabled');
      } else {
        this.previousElementSibling.setAttribute('disabled', true);
      }
    });
  });
}

function checkLocks() {
  document.querySelectorAll('.locked-input').forEach(function (each) {
    if (each.previousElementSibling.value) {
      each.classList.value = 'locked-input fas fa-lock';
      each.previousElementSibling.setAttribute('disabled', true);
    } else {
      each.classList.value = 'locked-input fas fa-unlock';
      each.previousElementSibling.removeAttribute('disabled');
    }
  });
}

/**
 * Adds event to enter key press on badge inputs (mostly triggered by scanner)
 */
document.querySelector('.user-badges').addEventListener('keydown', function (event) {
  if (event.which === 13 || event.which === 9) {
    event.preventDefault();
    const target = event.target;
    const badgeCode = target.value;
    const userRow = target.dataset.row;
    const inputNumber = target.dataset.inputnumber;
    const inputCount = target.dataset.inputcount;
    let emptyCount = parseInt(inputCount);
    const lastInput = inputCount === inputNumber;

    target.parentNode.querySelectorAll('.badge-input').forEach(function (each) {
      if (each.value) {
        emptyCount--;
      }
    });

    checkLocks();
    addValueToArrayCell(badgeCode, `F${userRow}`, parseInt(inputNumber) - 1);

    if (emptyCount) {
      target.nextElementSibling.nextElementSibling.nextElementSibling.focus();
    } else {
      target.blur();
      displayMessage(
        "All badges entered!",
        "Click 'Next Guest'."
      );
      // TODO: There is an issue with confirmAllBadgesEntered(). Figure out what
      // it is and solve it.
      // confirmAllBadgesEntered(userRow, inputCount);
    }
  }
});

function confirmAllBadgesEntered(userRow, count) {
  getFromGoogle(`F${userRow}`).then(function (response) {
    const cellValue = response.result.values[0][0];
    const badgeInputs = document.querySelectorAll('.badge-input');
    const badgeValues = [];
    let loopCount = count || 0;

    badgeInputs.forEach(function (each) {
      badgeValues.push(each.value);
    });

    if (cellValue === JSON.stringify(badgeValues)) {
      displayMessage(
        "All badges entered!",
        "Click 'Next Guest'."
      );
    } else if (loopCount > 10) {
      displayMessage(
        "There was an error with the entry.",
        `The error was at F${userRow}. Please try again.`
      );
    } else {
      loopCount++;
      setTimeout(function () {
        confirmAllBadgesEntered(userRow, loopCount);
      }, 10);
    }
  });
}

document.querySelector('.next-guest').addEventListener('click', function (event) {
  event.preventDefault();
  backToStartOf('registration');
});

// End Registration functions

// Start Library functions

/**
 * When an element with the class 'enter-to-next-sibling' recieves an 'enter'
 * it moves to the next field instead of submitting the form.
 */
const noEnters = document.querySelectorAll('.enter-to-next-sibling');

noEnters.forEach(function (el) {
  el.addEventListener('keydown', function (event) {
    if (event.which === 13) {
      event.preventDefault();
      this.nextElementSibling.focus();
    }
  });
});

/**
 * Adds event for when checkout form is submitted.
 */
document.querySelector('#checkout-game').addEventListener('click', function (event) {
  event.preventDefault();

  const badgeCode = document.querySelector('#checkout-badge-barcode').value;
  const gameCode = document.querySelector('#checkout-game-barcode').value;

  if (badgeCode && gameCode) {
    postValueToPersonRow(badgeCode, gameCode);
  }
});

/**
 * Goes and finds badge number among all the rows in the Sheet
 */
function postValueToPersonRow(badgeCode, gameCode) {
  getFromGoogle('F:F').then(function (response) {
    // response is every value in column F
    const entryRow = findBadgeCode(badgeCode, response.result.values);
    // entryRow will be just the row in the DB that contains the badgeCode
    if (entryRow) {
      postValueToRowAndColumn(gameCode, badgeCode, entryRow, 'G');
    }
  });
}

/**
 * Searches nested arrays for value and returns the row number of the correct user
 */
function findBadgeCode(badgeCode, array) {
  let index;

  array.forEach(function (eachRow, i) {
    if (eachRow.length && eachRow[0][0] === "[") {
      JSON.parse(eachRow[0]).forEach(function (eachCode) {
        if (eachCode === badgeCode) {
          index = i;
        }
      });
    }
  });

  if (index >= 0) {
    // The ''+ 1' is there to convert a 0-index array to a 1-index sheet
    return index + 1;
  } else {
    displayMessage('Badge not registered');
    return false;
    // TODO: When we don't find the badge, we are still trying to retrieve the
    // data from the database. We need to fix this somewhere upstream from here
  }
}

/**
 * Retrieves data from given cell and, if it's empty, puts the given value there.
 * Otherwise, it logs that the cell is already full.
 */
function postValueToRowAndColumn(value, badgeCode, row, column) {
  // Check what value is in that cell
  getFromGoogle(`${column}${row}`).then(function (response) {
    let responseObj;

    if (response.result.values) {
      responseObj = JSON.parse(response.result.values[0][0]);
    } else {
      responseObj = {};
    }
    if (!responseObj[badgeCode]) { // If the object in the cell doesn't already have a value at a key matching the badgeCode
      responseObj[badgeCode] = value;
      postToGoogle(`${column}${row}`, JSON.stringify(responseObj)).then(function () {
        doubleCheckEntry(JSON.stringify(responseObj), `${column}${row}`, confirmGameCheckout);
      });

    } else { // The object does have a value at a key matching the badge number
      const gameTitle = findGameTitle(responseObj[badgeCode]);
      displayMessage(
        `Please return ${gameTitle} before checking out another game.`
      );
    }
  });
}

function confirmGameCheckout(success) {
  if (success) {
    displayMessage(
      "All set!",
      'Enjoy the game!'
    );
    setTimeout(function () {
      backToStartOf('checkout');
    }, 3000);
  } else {
    console.log('We tried to post a checkout but it did not match when we double checked it');
  }
}

/**
 * Adds event for when returns form is submitted.
 */
document.querySelector('#return-game').addEventListener('click', function (event) {
  event.preventDefault();

  const badgeCode = document.querySelector('#returns-badge-barcode').value;
  const gameCode = document.querySelector('#returns-game-barcode').value;

  returnGame(badgeCode, gameCode);
});

function returnGame(badgeCode, gameCode) {
  findUserRow(badgeCode, gameCode);
}

function findUserRow(badgeCode, gameCode) {
  function containsCode(code) {
    return code === badgeCode;
  }

  getFromGoogle('F:G').then(function (response) {
    const values = response.result.values;
    let userRow;
    let rowNumber;

    values.forEach(function (eachRow, i) {
      if (eachRow.length && eachRow[0][0] === "[") {
        let codeArray = JSON.parse(eachRow[0]);
        if (codeArray.some(containsCode)) {
          userRow = values[i];
          rowNumber = i + 1;
        }
      }
    });

    checkCorrectGame(badgeCode, gameCode, userRow, rowNumber);
  });
}

function checkCorrectGame(badgeCode, gameCode, userRow, rowNumber) {
  const checkedOut = JSON.parse(userRow[1]);
  if (checkedOut[badgeCode] === gameCode) {
    const cell = `G${rowNumber}`;
    addGameToHistory(badgeCode, rowNumber, gameCode);
  } else {
    console.log(`Wrong Game. Correct Game is ${gameCode}. You have ${userRow[1]} checked out.`);
  }
}

function addGameToHistory(badgeCode, rowNumber, gameCode) {
  addValueToArrayCell(gameCode, `H${rowNumber}`, null, confirmGameReturned)
    .then(function () {
      clearValueFromObjectInCell(badgeCode, `G${rowNumber}`);
    });
}

function confirmGameReturned(success) {
  if (success) {
    console.log('Game returned');
    displayMessage('Hope you enjoyed the game!');
    setTimeout(function () {
      backToStartOf('returns');
    }, 3000);
  } else {
    console.log('Something went wrong, the game was not returned');
  }
}

// End Library Funtions

// Start Utility Functions

function getFromGoogle(range) {
  console.log(`Retrieving ${range} from database.`);
  return gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range
  });
}

function postToGoogle(range, content) {
  console.log(`Posting ${content} to ${range} in database.`);
  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
        values: [
          [content]
        ]
      }
  });
}

function postRowToGoogle(range, contentArray) {
  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: range,
    valueInputOption: 'USER_ENTERED'
  },
  {
    majorDimension: 'ROWS',
    values: [
      contentArray
    ]
  });
}

/**
 * Adds value to array of values in single cell
 */
function addValueToArrayCell(value, cell, index, callBack) {
  let jsonArray;

  return getFromGoogle(cell).then(function (response) {
    let cellArray = [];
    if (response.result.values) {
      cellArray = JSON.parse(response.result.values[0]);
    }
    if (index || index === 0) {
      cellArray[index] = value;
    } else {
      cellArray.push(value);
    }
    jsonArray = JSON.stringify(cellArray);
    postToGoogle(cell, jsonArray).then(function () {
      doubleCheckEntry(jsonArray, cell, callBack);
    });
  });
}

/**
 * Checks to make sure that the value we just added to the cell was in fact added.
 * Will loop for 5 seconds before giving up.
 * When it is done checking it will call the given callback function with either
 * a true or a false.
 */
function doubleCheckEntry(value, cell, callback, loopCount) {
  let loopCountForPassing = loopCount || 0;
  const callBackCatch = callback || console.log;

  getFromGoogle(cell).then(function (response) {
    const responseValue = response.result.values;

    if (!responseValue && value === '') {
      console.log(`Confirm that ${cell} is empty`);
      callBackCatch(true);
    } else if (responseValue[0][0] !== value) {
      loopCountForPassing++;
      setTimeout(function () {
        doubleCheckEntry(value, cell, callBackCatch, loopCountForPassing);
      }, 500);
    } else if (loopCountForPassing >= 10) {
      callBackCatch(false);
    } else {
      callBackCatch(true);
    }
  });
}

function clearCell(cell) {
  postToGoogle(cell, '').then(function (response) {
    doubleCheckEntry('', cell, console.log);
  });
}

function clearValueFromObjectInCell(key, cell) {
  let valueObj;

  getFromGoogle(cell).then(function (response) {
    valueObj = JSON.parse(response.result.values[0][0] || {});
    valueObj[key] = '';

    postToGoogle(cell, JSON.stringify(valueObj)).then(function (response) {
      doubleCheckEntry(JSON.stringify(valueObj), cell, console.log);
    });
  });
}

/**
 * Adds given text to given element
 */
function addTextToElement(element, text) {
  document.querySelector(element).textContent = text;
}

function prettifyPhoneNumber(phoneNumberString) {
  const prettyPhone = phoneNumberString.split('').filter(function (each) {
    return !/[^0-9]/.test(each);
  });
  prettyPhone.splice(6, 0, '-');
  prettyPhone.splice(3, 0, '-');
  prettyPhone.join(' ');

  return prettyPhone.join('');
}

function uuid() {
  let uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-";
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

function displayMessage(headLine, detailLine, timer) {
  const messageContent = document.querySelector('.message-content');
  const messageContentHeadline = document.querySelector('.message-content > h2');
  const messageContentDetail = document.querySelector('.message-content > p');
  const timerSet = timer || 5000;

  messageContentHeadline.innerText = headLine;
  messageContentDetail.innerText = detailLine || '';

  messageContent.classList.remove('hidden');
  setTimeout(function () {
    messageContent.classList.add('hidden');
  }, timerSet);
}

// Takes in the barcode from a demo library game and returns the title of the game
function findGameTitle(barcode) {
  return demoGames[barcode];
}

// Clears the site and returns the user to the given page
function backToStartOf(startPoint) {
  document.querySelectorAll('input').forEach(function (each) {
    each.value = null;
  });

  document.querySelectorAll('section').forEach(function (each) {
    each.classList.add('hidden');
  });

  if (startPoint === "registration") {
    document.querySelector('.registration-section').classList.remove('hidden');
    document.querySelector('.registration-section .starting-point').focus();
  } else if (startPoint === "checkout") {
    document.querySelector('.checkout-section').classList.remove('hidden');
    document.querySelector('.checkout-section .starting-point').focus();
  } else if (startPoint === "returns") {
    document.querySelector('.returns-section').classList.remove('hidden');
    document.querySelector('.returns-section .starting-point').focus();
  } else {
    document.querySelector('.registration-section').classList.remove('hidden');
    document.querySelector('.registration-section .starting-point').focus();
  }
}
// End Utility Functions
