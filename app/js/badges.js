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

// TODO: I will need to figure out what to do with people who buy their badges at the door
// TODO: It might also be nice to have people get their shirts here... not sure though. That may clog things too much.

/**
 * Adds event to form submit to find user in spreadsheet and return user data
 */
document.querySelector('#find-person').addEventListener('click', function (event) {
  event.preventDefault();

  const searchString = document.querySelector('#search-name').value;

  findUser(searchString);
});

/**
 * Retrieves user data for user that contains matching textContent
 * @param  {string} searchString  This is the query string from the form. It can
 *                                be name, email, or phone.
 *                                // TODO: It would be nice if this could find partial matches and could return multiple options to choose from.
 *                                // TODO: We also need to account for different formats and last name only should be an option
 */
function findUser(searchString) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `A:E` // TODO: This is basically a magic number. Is there a way to make it less magical?
  }).then(function (response) {
    const data = response.result.values;
    let registrationEntry;

    data.forEach(function (each, i) {
      if (each.includes(searchString)) {
        registrationEntry = {
          row: i + 1,
          orderId: each[0],
          email: each[1],
          quantity: each[2],
          name: each[3],
          phone: each[4]
        };
      }
    });

    if (registrationEntry) {
      buildUserView(registrationEntry);
      buildBadgeCodeInputs(registrationEntry);
      document.querySelector('.not-found-message').classList.add('hidden');
      document.querySelector('.registration-section form').classList.add('hidden');
    } else {
      document.querySelector('.not-found-message').classList.remove('hidden');
      setTimeout(function () {
        document.querySelector('.not-found-message').classList.add('hidden');
      }, 3000);
    }
  });
}

/**
 * Adds text content to user profile in registration view.
 */
function buildUserView(registrationEntry) {
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
    inputs = `${inputs}<p>Badge #${i + 1}</p><input class="badge-input" type="text" data-email="${registrationEntry.email}" data-inputnumber="${i+1}" data-inputcount="${inputCount}" data-row="${registrationEntry.row}">`;
  }

  userBadges.innerHTML = inputs;
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
    const lastInput = inputNumber === inputCount;

    addValueToArrayCell(badgeCode, `F${userRow}`);

    if (!lastInput) {
      target.nextElementSibling.nextElementSibling.focus();
    } else {
      target.blur();
      confirmAllBadgesEntered(userRow, inputCount);
    }
  }
});

function confirmAllBadgesEntered(userRow, count) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `F${userRow}` // TODO: This is basically a magic number. Is there a way to make it less magical?
  }).then(function (response) {
    const cellValue = response.result.values[0][0];
    const badgeInputs = document.querySelectorAll('.badge-input');
    const badgeValues = [];
    let loopCount = count || 0;

    badgeInputs.forEach(function (each) {
      badgeValues.push(each.value);
    });

    if (cellValue === JSON.stringify(badgeValues)) {
      displaySuccess();
    } else if (loopCount > 10) {
      displayFailure(`F${userRow}`);
    } else {
      loopCount++;
      setTimeout(function () {
        confirmAllBadgesEntered(userRow, loopCount);
      }, 10);
    }
  });
}

function displaySuccess() {
  document.querySelectorAll('.entry-status-message h3').forEach(function (each) {
    each.classList.add('hidden');
  });
  document.querySelector('.entry-status-message .success-message')
    .classList.remove('hidden');
}

function displayFailure(cell) {
  document.querySelectorAll('.entry-status-message h3').forEach(function (each) {
    each.classList.add('hidden');
  });
  document.querySelector('.try-again').setAttribute('data-cell', cell);
  document.querySelector('.entry-status-message .failure-message')
    .classList.remove('hidden');
}

document.querySelector('.try-again').addEventListener('click', function (event) {
  event.preventDefault();
  const badgesCell = event.target.dataset.cell;

  tryEntryAgain(badgesCell);
});

function tryEntryAgain(cell) {
  clearCell(cell);
  const badgeInputs = document.querySelectorAll('.badge-input');

  badgeInputs.forEach(function (each) {
    each.value = "";
  });
  badgeInputs[0].focus();

  document.querySelectorAll('.entry-status-message h3').forEach(function (each) {
    each.classList.add('hidden');
  });
}

document.querySelector('.next-guest').addEventListener('click', function (event) {
  event.preventDefault();
  window.location.reload();
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

  postValueToPersonRow(badgeCode, gameCode);
});

/**
 * Goes and finds badge number among all the rows in the Sheet
 */
function postValueToPersonRow(badgeCode, gameCode) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'F:F' // TODO: This is another magic number. Can we make it less magical?
  }).then(function (response) {
    // response is every value in column F
    const entryRow = findValueInNestedArrays(badgeCode, response.result.values);
    // entryRow will be just the row in the DB that contains the badgeCode
    postValueToRowAndColumn(gameCode, badgeCode, entryRow, 'G');
  });
}

/**
 * Searches nested arrays for value and returns the row number of the correct user
 */
function findValueInNestedArrays(value, array) {
  let index;

  array.forEach(function (eachRow, i) {
    if (eachRow.length && eachRow[0][0] === "[") {
      JSON.parse(eachRow[0]).forEach(function (eachCode) {
        if (eachCode === value) {
          index = i;
        }
      });
    }
  });

  if (index >= 0) {
    // The ''+ 1' is there to convert a 0-index array to a 1-index sheet
    return index + 1;
  } else {
    return "Person Not Found";
  }
}

/**
 * Retrieves data from given cell and, if it's empty, puts the given value there.
 * Otherwise, it logs that the cell is already full.
 */
function postValueToRowAndColumn(value, badgeCode, row, column) {
  // Check what value is in that cell
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${column}${row}`
  }).then(function (response) {
    let responseObj;

    if (response.result.values) {
      responseObj = JSON.parse(response.result.values[0][0]);
    } else {
      responseObj = {};
    }
    if (!responseObj[badgeCode]) { // If the object in the cell doesn't already have a value at a key matching the badgeCode
      responseObj[badgeCode] = value;
      gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${column}${row}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [
              [JSON.stringify(responseObj)]
            ]
          }
      }).then(function () {
        doubleCheckEntry(JSON.stringify(responseObj), `${column}${row}`, confirmGameCheckout);
      });

    } else { // The object does have a value at a key matching the badge number

      const message = `Please return ${responseObj[badgeCode]} before checking out another game.`;

      document.querySelector('.checkout-failure').classList.remove('hidden');
      document.querySelector('.checkout-failure').textContent = message;
      document.querySelector('.checkout-success').classList.add('hidden');
      setTimeout(function () {
        document.querySelector('.checkout-failure').classList.add('hidden');
      }, 3000);

    }
  });
}

function confirmGameCheckout(success) {
  if (success) {
    document.querySelector('.checkout-failure').classList.add('hidden');
    document.querySelector('.checkout-success').classList.remove('hidden');
  } else {
    console.log('We tried to post a checkout but it did not match when we double checked it');
  }
}

/**
 * Adds event for when returns form is submitted.
 */
document.querySelector('#returns-game').addEventListener('click', function (event) {
  event.preventDefault();

  const badgeCode = document.querySelector('#returns-badge-barcode').value;
  const gameCode = document.querySelector('#returns-game-barcode').value;

  returnGame(badgeCode, gameCode);
});

// TODO: What is the point of this?
function returnGame(badgeCode, gameCode) {
  findUserRow(badgeCode, gameCode);
}

function findUserRow(badgeCode, gameCode) {
  function containsCode(code) {
    return code === badgeCode;
  }

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'F:G' // TODO: This is another magic number. Can we make it less magical?
  }).then(function (response) {
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
  addValueToArrayCell(gameCode, `H${rowNumber}`).then(function () {
    clearValueFromObjectInCell(badgeCode, `G${rowNumber}`);
  });
}

function confirmGameReturned(success) {
  if (success) {
    console.log('Game returned');
  } else {
    console.log('Something went wrong, the game was not returned');
  }
}

// End Library Funtions

// Start Utility Functions

/**
 * Adds value to array of values in single cell
 */
function addValueToArrayCell(value, cell) {
  let jsonArray;

  return gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: cell
  }).then(function (response) {
    let cellArray = [];
    if (response.result.values) {
      cellArray = JSON.parse(response.result.values[0]);
    }
    cellArray.push(value);
    jsonArray = JSON.stringify(cellArray);
    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cell,
      valueInputOption: 'USER_ENTERED',
      resource: {
          values: [
            [jsonArray]
          ]
        }
    }).then(function () {
      doubleCheckEntry(jsonArray, cell, confirmGameReturned);
    });
  });
}

/**
 * Checks to make sure that the value we just added to the cell was in fact added.
 * Will loop for 5 seconds before giving up.
 * When it is done checking it will call the given callback function with either
 * a true or a false.
 */
// TODO: We need to go back and add a callBack for every place that I'm using this Fn.
function doubleCheckEntry(value, cell, callBack, loopCount) {
  let loopCountForPassing = loopCount || 0;

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: cell
  }).then(function (response) {
    const responseValue = response.result.values;

    if (!responseValue && value === '') {
      console.log(`Confirm that ${cell} is empty`);
      callBack(true);
    } else if (responseValue[0][0] !== value) {
      loopCountForPassing++;
      setTimeout(function () {
        doubleCheckEntry(value, cell, callBack, loopCountForPassing);
      }, 500);
    } else if (loopCountForPassing >= 10) {
      callBack(false);
    } else {
      callBack(true);
    }
  });
}

function clearCell(cell) {
  gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: cell,
    valueInputOption: 'USER_ENTERED',
    resource: {
        values: [
          ['']
        ]
      }
  }).then(function (response) {
    doubleCheckEntry('', cell, console.log);
  });
}

function clearValueFromObjectInCell(key, cell) {
  let valueObj;

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: cell
  }).then(function (response) {
    valueObj = JSON.parse(response.result.values[0][0] || {});
    valueObj[key] = '';

    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cell,
      valueInputOption: 'USER_ENTERED',
      resource: {
          values: [
            [JSON.stringify(valueObj)]
          ]
        }
    }).then(function (response) {
      doubleCheckEntry(valueObj, cell, console.log);
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

// End Utility Functions
