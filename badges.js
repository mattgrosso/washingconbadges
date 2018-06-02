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

/**
 * Just dicking around
 */
 const sheetId = '1JfujUhs04UqOIS6wAjYEiI9XPGc97-WerNtnNf99paI';

// Ok, here's what I want to do. I want to look up someone's name from the list
// and return the value to the right of thier name.

// Start Nav functions
const navLinks = document.querySelectorAll('.section-select-buttons a');
const sections = document.querySelectorAll('main > section');

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
document.querySelector('#find-person').addEventListener('click', function (event) {
  event.preventDefault();

  const searchString = document.querySelector('#search-name').value;

  findUser(searchString);
});

document.querySelector('.user-badges').addEventListener('keydown', function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    const target = event.target;
    const badgeCode = target.value;
    const userRow = target.dataset.row;

    addBadgeCodeToUser(badgeCode, userRow);
  }
});

function addBadgeCodeToUser(badgeCode, userRow) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${userRow}:${userRow}`
  }).then(function (response) {
    let userBadgeArray = [];
    if (response.result.values[0][5]) {
      userBadgeArray = JSON.parse(response.result.values[0][5]);
    }
    userBadgeArray.push(parseInt(badgeCode));
    const jsonBadgeArray = JSON.stringify(userBadgeArray);
    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `F${userRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
          values: [
            [jsonBadgeArray]
          ]
        }
    }).then(function (response) {
      console.log(response);
    });
  });
}

function findUser(searchString) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `A:E`
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

function buildUserView(registrationEntry) {
  addTextToElement('.user-view .user-name', registrationEntry.name);
  addTextToElement('.user-view .user-email', registrationEntry.email);
  addTextToElement('.user-view .user-phone', registrationEntry.phone);
}

function addTextToElement(element, text) {
  document.querySelector(element).textContent = text;
}

function buildBadgeCodeInputs(registrationEntry) {
  let inputCount = registrationEntry.quantity;
  const userBadges = document.querySelector('.user-view .user-badges');
  let inputs = '';

  for (var i = 0; i < inputCount; i++) {
    inputs = `${inputs}<input type="text" data-email="${registrationEntry.email}" data-child-number="${i+1}" data-row="${registrationEntry.row}">`;
  }

  userBadges.innerHTML = inputs;
}

// End Registration functions

// Start Library functions

/**
 * When the badge is scanned at the library, it moves to the next field instead
 * of submitting the form
 */
document.querySelector('#checkout-badge-barcode').addEventListener('keydown', function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.querySelector('#checkout-game-barcode').focus();
  }
});

document.querySelector('#checkout-game').addEventListener('click', function (event) {
  event.preventDefault();

  const badgeCode = document.querySelector('#checkout-badge-barcode').value;
  const gameCode = document.querySelector('#checkout-game-barcode').value;

  postValueToPersonRow(badgeCode, gameCode);
});

function postValueToPersonRow(badgeCode, gameCode) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'F:F'
  }).then(function (response) {
    // The ''+ 1' is there to convert a 0-index array to a 1-index sheet
    const entryRow = findValueInArrays(badgeCode, response.result.values) + 1;
    postValueToRowAndColumn(gameCode, entryRow, 'G');
  });
}

function findValueInArrays(value, arrays) {
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
    return index;
  } else {
    return "Person Not Found";
  }
}

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
      }).then(function (response) {
        console.log(response);
      });
    } else { // Otherwise just notify us
      console.log('Cell Full');
    }
  });
}
// End Library Funtions
