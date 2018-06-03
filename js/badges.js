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

// Start my own code

const sheetId = '1JfujUhs04UqOIS6wAjYEiI9XPGc97-WerNtnNf99paI';

// Start Nav functions
const navLinks = document.querySelectorAll('.section-select-buttons a');
const sections = document.querySelectorAll('main > section');

/**
 * Adds click events to the nav links for single paginess
 */
navLinks.forEach(function (each) {
  each.addEventListener('click', function () {
    sections.forEach(function (eachSection) {
      eachSection.classList.add('hidden');
    });
    const thisSection = document.querySelector(`main > section.${this.dataset.section}`);
    thisSection.classList.remove('hidden');
  });
});
// End Nav functions

// Start Registration functions
/**
 * Adds event to form submit to find user in spreadsheet and return user data
 * @param  {[type]} event [description]
 * @return {[type]}       [description]
 */
document.querySelector('#find-person').addEventListener('click', function (event) {
  event.preventDefault();

  const searchString = document.querySelector('#search-name').value;

  findUser(searchString);
});

/**
 * Retrieves user data for user that contains matching textContent
 * @param  {string} searchString  This is the query string from the form. It can
 *                                be name, email, or phone. // TODO: It would be nice if this could find partial matches and could return multiple options to choose from.
 */
function findUser(searchString) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `A:E` // TODO: This is basically a magic number. Is there a way to make it less magical?
  }).then(function (response) {
    const data = response.result.values;

    data.forEach(function (each, i) {
      if (each.includes(searchString)) {
        const registrationEntry = {
          row: i + 1,
          orderId: each[0],
          email: each[1],
          quantity: each[2],
          name: each[3],
          phone: each[4]
        };

        buildUserView(registrationEntry);
        buildBadgeCodeInputs(registrationEntry);
      }
    });
  });
}

/**
 * Adds text content to user profile in registration view.
 */
function buildUserView(registrationEntry) {
  addTextToElement('.user-view .user-name', registrationEntry.name);
  addTextToElement('.user-view .user-email', registrationEntry.email);
  addTextToElement('.user-view .user-phone', registrationEntry.phone);
}

/**
 * Adds given text to given element
 */
function addTextToElement(element, text) {
  document.querySelector(element).textContent = text;
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
    inputs = `${inputs}<input type="text" data-email="${registrationEntry.email}" data-child-number="${i+1}" data-row="${registrationEntry.row}">`;
  }

  userBadges.innerHTML = inputs;
}

/**
 * Adds event to enter key press on badge inputs (mostly triggered by scanner)
 */
document.querySelector('.user-badges').addEventListener('keydown', function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    const target = event.target;
    const badgeCode = target.value;
    const userRow = target.dataset.row;

    addBadgeCodeToUser(badgeCode, userRow);
  }
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
    if (event.keyCode === 13) {
      event.preventDefault();
      this.nextElementSibling.focus();
    }
  });
});

/**
 * Adds event for when checkout form is subbmitted.
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
    const entryRow = findValueInNestedArrays(badgeCode, response.result.values);
    postValueToRowAndColumn(gameCode, entryRow, 'G');
  });
}

/**
 * Searches nested arrays for value and returns the row number of the correct user
 */
function findValueInNestedArrays(value, array) {
  let index;

  arrays.forEach(function (eachRow, i) {
    if (eachRow[0][0] === "[") {
      JSON.parse(eachRow[0]).forEach(function (eachCode) {
        if (eachCode === parseInt(value)) {
          index = i;
        }
      });
    }
  });

  if (index >= 0) {
    // The ''+ 1' is there to convert a 0-index array to a 1-index sheet
    return index  + 1;
  } else {
    return "Person Not Found";
  }
}

/**
 * Retrieves data from given cell and, if it's empty, put the given value there.
 * Otherwise, it logs that the cell is already full.
 * @param  {[type]} value  [description]
 * @param  {[type]} row    [description]
 * @param  {[type]} column [description]
 * @return {[type]}        [description]
 */
function postValueToRowAndColumn(value, row, column) {
  // Check what value is in that cell
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${column}${row}`
  }).then(function (response) {
    // TODO: Start here. You need to figure out how to check that each individual badge that someone has, has out one game and no more.
    if (!response.result.values) {
      gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${column}${row}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [
              [value]
            ]
          }
      }).then(function () {
        console.log('Data pushed to spreadsheet');
      });
    } else {
      // We need to do something else with this.
      console.log('Cell Full');
    }
  });
}

function returnGame(badgeCode, gameCode) {

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
      doubleCheckEntry(jsonArray, cell);
    });
  });
}

/**
 * Checks to make sure that the value we just added to the cell was in fact added.
 * Will loop for 5 seconds before giving up.
 */
function doubleCheckEntry(value, cell, loopCount) {
  let loopCountForPassing = loopCount || 0;

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: cell
  }).then(function (response) {
    const responseValue = response.result.values;

    if (!responseValue && value === '') {
      console.log(`Confirm that ${cell} is empty`);
    } else if (responseValue[0][0] !== value) {
      loopCountForPassing++;
      setTimeout(function () {
        doubleCheckEntry(value, cell, loopCountForPassing);
      }, 500);
    } else if (loopCountForPassing >= 10) {
      console.log('Giving up');
    } else {
      console.log(`Confirm that ${cell} does contain ${value}`);
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
    doubleCheckEntry('', cell);
  });
}

// End Utility Functions
