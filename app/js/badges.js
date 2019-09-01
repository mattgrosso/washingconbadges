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

const sheetId = '10W_uJoqvuQhAbGtIL233I0Y9Eigy6yWcqDcolOo-K70';

document.querySelector('#search-name').focus();

// Start Nav functions
const navLinks = document.querySelectorAll('a.advanced-options');
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

    const sectionName = this.dataset.section;
    backToStartOf(sectionName.replace('-section', ''));
  });
});

window.addEventListener('keydown', function (event) {
  const shift = event.shiftKey;
  const cmd = event.metaKey;
  const one = event.which === 49;
  if (cmd && shift && one) {
    event.preventDefault();
    toggleAuth();
  }
});

function toggleAuth() {
  const authButton = document.querySelector('.auth-buttons');
  authButton.classList.toggle('hidden');
}
// End Nav functions

// Start Registration functions

/**
 * Adds event to form submit to find user in spreadsheet and return user data
 */
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
    const id = `new-sale-${uuid()}`;

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
 *                                be name, email, or order number.
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
        "Try searching with a different parameter (email, order number, etc.)"
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
        "Maybe check spelling or try searching with a different parameter (email, order number, etc.)");
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
              <fieldset>\
              <label>Badge #${i + 1}</label>\
              <input \
                class="badge-input"\
                type="text" \
                value="${registrationEntry.badges[i] || ''}" \
                data-email="${registrationEntry.email}" \
                data-inputnumber="${i+1}" \
                data-inputcount="${inputCount}" \
                data-row="${registrationEntry.row}">
              </fieldset>\
              <i class="locked-input fas fa-unlock"></i>
              <i class="delete-badge-input fas fa-trash-alt"></i>`;
  }

  userBadges.innerHTML = inputs;
  checkLocks();
  document.querySelectorAll('.locked-input').forEach(function (each) {
    each.addEventListener('click', function (event) {
      event.preventDefault();

      this.classList.toggle('fa-lock');
      this.classList.toggle('fa-unlock');
      if (this.previousElementSibling.firstElementChild.nextElementSibling.hasAttribute('disabled')) {
        this.previousElementSibling.firstElementChild.nextElementSibling.removeAttribute('disabled');
        this.nextElementSibling.removeAttribute('disabled', true);
      } else {
        this.previousElementSibling.firstElementChild.nextElementSibling.setAttribute('disabled', true);
        this.nextElementSibling.setAttribute('disabled', true);
      }
    });
  });

  document.querySelectorAll('.delete-badge-input').forEach(function (each) {
    each.addEventListener('click', function (event) {
      event.preventDefault();
      const correspondingInputData =
        event.target.previousElementSibling.previousElementSibling.firstElementChild.nextElementSibling.dataset;
      const dataRow = correspondingInputData.row;
      const dataIndex = parseInt(correspondingInputData.inputnumber) - 1;
      getFromGoogle(`F${dataRow}`).then(function (response) {
        const badgeArray = JSON.parse(response.result.values[0]);
        badgeArray.splice(dataIndex, 1);

        postToGoogle(`F${dataRow}`, JSON.stringify(badgeArray)).then(function (resp) {
          postToGoogle(`C${dataRow}`, parseInt(correspondingInputData.inputcount) - 1).then(function () {
            findUser(correspondingInputData.email);
          });
        });
      });
    });
  });

}

function checkLocks() {
  document.querySelectorAll('.locked-input').forEach(function (each) {
    if (each.previousElementSibling.firstElementChild.nextElementSibling.value) {
      each.classList.value = 'locked-input fas fa-lock';
      each.previousElementSibling.firstElementChild.nextElementSibling.setAttribute('disabled', true);
    } else {
      each.classList.value = 'locked-input fas fa-unlock';
      each.previousElementSibling.firstElementChild.nextElementSibling.removeAttribute('disabled');
    }
  });
}

/**
 * Adds event to enter key press on badge inputs (mostly triggered by scanner)
 */
document.querySelector('.user-badges').addEventListener('keydown', function (event) {
  const enter = 13;
  const tab = 9;

  if (event.which === enter || event.which === tab) {
    event.preventDefault();
    const target = event.target;
    const badgeCode = target.value;

    // Entered invalid badge number or had a bad scan
    if (!badgeCodeIsValid(badgeCode)) {
      target.value = "";
      return;
    }

    const userRow = target.dataset.row;
    const inputNumber = target.dataset.inputnumber;
    const inputCount = target.dataset.inputcount;
    let emptyCount = parseInt(inputCount);
    const lastInput = inputCount === inputNumber;

    target.parentNode.parentNode.querySelectorAll('.badge-input').forEach(function (each) {
      if (each.value) {
        emptyCount--;
      }
    });

    checkLocks();
    addValueToArrayCell(badgeCode, `F${userRow}`, parseInt(inputNumber) - 1);

    if (lastInput && emptyCount) {
      document.querySelector('.badge-input[data-inputnumber="1"]').focus();
    } else if (emptyCount) {
      document.querySelector(`.badge-input[data-inputnumber="${parseInt(inputNumber) + 1}"]`).focus();
    } else {
      target.blur();
      displayMessage(
        "All badges entered!",
        "Click 'Next Guest'."
      );
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

noEnters.forEach(function (el, index) {
  el.addEventListener('keydown', function (event) {
    if (event.which === 13) {
      event.preventDefault();
      document.querySelector(`#${this.dataset.nextInput}`).focus();
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

  // Entered invalid badge number or had a bad scan
  if (!badgeCodeIsValid(badgeCode)) {
    document.querySelector('#checkout-badge-barcode').value = "";
    return;
  }

  if (badgeCode && gameCode) {
    postValueToPersonRow(badgeCode, gameCode);
  } else {
    displayMessage(
      'Missing Values',
      'Please try again'
    );
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
 * Searches nested arrays for badgecode and returns the row number of the correct user
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
  }
}

/**
 * Retrieves data from given cell and, if it's empty, puts the given value there.
 * Otherwise, it logs that the cell is already full.
 */
// TODO: Update the name and description of this function. It is it less general now.
function postValueToRowAndColumn(gameCode, badgeCode, row, column) {
  getFromGoogle(`${row}:${row}`).then(function (response) {
    const userRow = response.result.values[0];
    const gameTitle = findGameTitle(gameCode).name;
    const checkoutObject = {
      gameCode: gameCode,
      checkedOutAt: Date.now()
    };
    const playToWin = gameTitle.substr(gameTitle.length-5) === '(ptw)';
    let responseObj;

    if (response.result.values) {
      try {
        responseObj = JSON.parse(userRow[6]);
      } catch (e) {
        responseObj = {};
      }
    } else {
      responseObj = {};
    }

    if (!responseObj[badgeCode]) { // If the object in the cell doesn't already have a value at a key matching the badgeCode
      responseObj[badgeCode] = checkoutObject;
      postToGoogle(`${column}${row}`, JSON.stringify(responseObj)).then(function () {
        if (playToWin && !userRow[4]) {
          promptForPhone(row);
        } else {
          confirmGameCheckout();
        }
      });
    } else { // The object does have a value at a key matching the badge number
      displayMessage(
        `${findGameTitle(responseObj[badgeCode].gameCode).name}`,
        'Is checked out with this badge. Please return it.'
      );
    }
  });
}

function promptForPhone(userRow) {
  const phonePrompt = document.querySelector('.phone-prompt');
  const phoneInput = document.querySelector('#phone-prompt-input');

  phoneInput.value = null;
  phonePrompt.classList.remove('hidden');

  document.querySelector('#enter-phone').addEventListener('click', function (event) {
    event.preventDefault();
    postToGoogle(`E${userRow}`, phoneInput.value.replace(/\D/g,'')).then(function () {
      confirmGameCheckout();
      phonePrompt.classList.add('hidden');
    });
  });

  document.querySelector('#no-phone-number').addEventListener('click', function (event) {
    event.preventDefault();
    postToGoogle(`E${userRow}`, 'declined').then(function () {
      confirmGameCheckout();
      phonePrompt.classList.add('hidden');
    });
  });
}

function confirmGameCheckout() {
  displayMessage(
    "All set!",
    'Enjoy the game!',
    2000
  );
  setTimeout(function () {
    backToStartOf('checkout');
  }, 2000);
}

/**
 * Adds event for when returns form is submitted.
 */
document.querySelector('#return-game').addEventListener('click', function (event) {
  event.preventDefault();

  const badgeCode = document.querySelector('#returns-badge-barcode').value;
  const gameCode = document.querySelector('#returns-game-barcode').value;

  if (!badgeCodeIsValid(badgeCode)) {
    document.querySelector('#returns-badge-barcode').value = "";
    return;
  }

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
  try {
    const checkedOut = JSON.parse(userRow[1]);
    if (checkedOut[badgeCode].gameCode === gameCode) {
      const cell = `G${rowNumber}`;
      addGameToHistory(badgeCode, rowNumber, gameCode);
    } else {
      displayMessage(
        'Wrong Game.',
        `Please return ${findGameTitle(checkedOut[badgeCode].gameCode).name}`
      );
    }
  } catch (e) {
    displayMessage(
      'Something went wrong.',
      'Probably the badge or the game scanned badly. Please check values and try again. If this issue persists, contact @mattgrosso on Slack or press the help button',
      8000);
    console.log(e);
  }
}

function addGameToHistory(badgeCode, rowNumber, gameCode) {
  addValueToArrayCell(gameCode, `H${rowNumber}`)
    .then(function () {
      clearValueFromObjectInCell(badgeCode, `G${rowNumber}`);
    });
}

function confirmGameReturned() {
  displayMessage(
    'Hope you enjoyed the game!',
    null,
    2000);
  setTimeout(function () {
    backToStartOf('returns');
  }, 2000);
}

// End Library Funtions


// Start User Lookup Functions
document.querySelector('#lookup-user').addEventListener('click', function (event) {
  event.preventDefault();
  document.querySelector('.user-lookup-results').classList.add('hidden');


  let badgeCode = document.querySelector('.user-lookup-section form input').value;

  findRowForBadge(badgeCode);
});

function findRowForBadge(badgeCode) {
  getFromGoogle('F:F').then(function (response) {
    // response is every value in column F
    const entryRow = findBadgeCode(badgeCode, response.result.values);
    // entryRow will be just the row in the DB that contains the badgeCode
    if (entryRow) {
      getUserData(entryRow).then(function (response) {
        displayUserData(response);
      });
    }
  });
}

function getUserData(row) {
  return getFromGoogle(`${row}:${row}`).then(function (response) {

    const userArray = response.result.values[0];
    const badgeCodes = userArray[5] || "[]";
    const purchased = userArray[2] || '0';
    const activated = userArray[5] || 0;
    const currentStatus = userArray[6] || "[]";
    const user = {
      order_id: userArray[0],
      email: userArray[1],
      name: userArray[3],
      phone: userArray[4],
      badges: {
        badgeCodes: JSON.parse(badgeCodes),
        purchased: parseInt(purchased),
        activated: JSON.parse(activated).length,
        allActivated: parseInt(purchased) === JSON.parse(activated).length,
        currentStatus: JSON.parse(currentStatus)
      },
      history: userArray[7]
    };

    return user;
  });
}

function displayUserData(user) {
  const userLookupName = document.querySelector('.user-lookup-name');
  const userLookupOrderId = document.querySelector('.user-lookup-orderId');
  const userLookupEmail = document.querySelector('.user-lookup-email');
  const userLookupPhone = document.querySelector('.user-lookup-phone');
  const userLookupStatusList = document.querySelector('.user-lookup-checkout-status ul');
  const userLookupHistory = document.querySelector('.user-lookup-history ul');

  userLookupName.innerText = user.name;
  userLookupOrderId.innerText = user.order_id;
  userLookupEmail.innerText = user.email;
  userLookupPhone.innerText = user.phone;

  let badgeCount = user.badges.activated;
  let badgeSatuses = '<li class="headers"><p>Badge</p><p>Game</p></li>';
  for (var i = 0; i < badgeCount; i++) {
    const badge = user.badges.badgeCodes[i] || 'Not Activated';
    const game = findGameTitle(user.badges.currentStatus[badge]).name || '-';

    badgeSatuses += `<li>\
                      <p>${badge}</p>\
                      <p>${game}</p>\
                    </li>`;
  }

  userLookupStatusList.innerHTML = badgeSatuses;

  const historyArray = "";
  try {
    const historyArray = JSON.parse(user.history);
  } catch (e) {}

  const historyCount = historyArray.length;
  let history = '';
  for (var j = 0; j < historyCount; j++) {
    const game = findGameTitle(historyArray[j]).name;

    history += `<li>\
                  <p>${game}</p>\
                </li>`;
  }

  userLookupHistory.innerHTML = history;

  document.querySelector('.user-lookup-section form input').value = null;
  document.querySelector('.user-lookup-results').classList.remove('hidden');
}
// End User Lookup Functions

// Start winners section Functions

// Look through the list of play-to-win games that are not checked out
// For each of those games, scan the checkout histories to find the names of people who checked it out.
// Return each game and the info for the winner in a list
document.querySelector('#generate-winners').addEventListener('click', function (event) {
  event.preventDefault();

  getFromGoogle('A:H').then(function (response) {
    let allData = response.result.values;
    let drawings = [];

    generateListOfP2WInLibrary().then(function (p2WInLibrary) {
      p2WInLibrary.forEach(function (gameCode) {
        let rowsInTheRunning = [];

        allData.forEach(function (eachRow, index) {
          if (eachRow[7]) {
            try {
              if (JSON.parse(eachRow[7]).includes(gameCode)) {
                rowsInTheRunning.push(index);
              }
            } catch (e) {

            }
          }
        });

        let uniqueWinners = [];

        for (var i = 0; i < findGameTitle(gameCode).quantity; i++) {
          const randomWinnerIndex = randomNumberNotInArray(rowsInTheRunning.length, uniqueWinners);

          if (typeof randomWinnerIndex === "number") {
            const winnersRow = rowsInTheRunning[randomWinnerIndex];

            uniqueWinners.push(randomWinnerIndex);
            drawings.push({
              gameTitle: findGameTitle(gameCode).name.substr(0, findGameTitle(gameCode).name.length-6),
              gameCode: gameCode,
              entries: rowsInTheRunning,
              winner: allData[winnersRow]
            });
          } else {
            console.log(randomWinnerIndex);
          }
        }
      });

      // Put the winners array into the database.
      postToGoogle('K1', JSON.stringify(drawings)).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
          console.log('Google says it worked.');
        } else {
          console.log('Google says something went wrong.');
        }
      });
    });


    const winnersList = document.querySelector('#winners-list');
    let listItems = '<li class="headers"><p>Game</p><p>Winner</p></li>';

    drawings.forEach(function (each) {
      if (each.winner) {
        listItems += `<li>
                        <p>${each.gameTitle}</p>
                        <div>
                          <p>${each.winner[3]}</p>
                          <p>${prettifyPhoneNumber(each.winner[4])}</p>
                          <p>${each.winner[1]}</p>
                        </div>
                      </li>`;
      }
    });

    winnersList.innerHTML = listItems;

    document.querySelector('#generate-winners').classList.add('hidden');
    document.querySelector('#send-an-sms').classList.remove('hidden');

    document.querySelector('#send-an-sms').addEventListener('click', function (event) {
      event.preventDefault();

      const winningDrawings = drawings.filter(function (drawing) {
        return drawing.winner;
      });
      let sentCount = 0;

      winningDrawings.forEach(function (each) {
        sendSMS(each.winner[4], each.gameTitle, each.winner[3]);
        sentCount++;
      });

      displayMessage(
        `${sentCount} texts were sent.`
      );
    });

  });
});

function generateListOfCheckedOutP2W() {
  const playToWinNumbers = Object.keys(playToWinGames);
  const checkedOutP2W = [];

  return getFromGoogle('G:G').then(function (response) {
    response.result.values.forEach(function (row) {
      row.forEach(function (cell) {
        playToWinNumbers.forEach(function (playToWinNumber) {
          if (cell.includes(playToWinNumber)) {
            checkedOutP2W.push(playToWinNumber);
          }
        });
      });
    });

    return checkedOutP2W;
  });
}

function generateListOfP2WInLibrary() {
  return generateListOfCheckedOutP2W().then(function (checkedOutList) {
    const playToWinNumbers = Object.keys(playToWinGames);

    return playToWinNumbers.filter(function (gameNumber) {
      return !checkedOutList.includes(gameNumber);
    });
  });
}

function sendSMS(number, game, name) {
  const query = `number=${number}&game=${game}&name=${name}`;

  fetch(`https://serene-fortress-48905.herokuapp.com/sms?${query}`, {
      method: "POST",
      mode: "no-cors",
      headers: {
          "Content-Type": "application/json",
      },
      body: "This is broken anyway",
  }).then(function (response) {
    console.log(`${name} was notified that they won ${game} at ${number}`);
    return response;
  });
}

// End winners section Functions

// Start Current Log Section

document.querySelector('#current-log-link').addEventListener('click', function (event) {
  event.preventDefault();

  const logList = document.querySelector('#current-log');

  getFromGoogle('A:H').then(function (response) {
    const allData = response.result.values;
    let listItems = '<li class="headers"><p>Name</p><p>Game</p><p>Checked Out</p></li>';

    allData.forEach(function (eachRow, index) {
      if (index === 0) {
        return;
      }

      let checkoutStatus;
      const rowNumber = index;

      if (eachRow[6]) {
        try {
          checkoutStatus = JSON.parse(eachRow[6]);
        } catch (e) {}

        Object.keys(checkoutStatus).forEach(function (eachBadge) {
          if (checkoutStatus[eachBadge]) {
            const guestName = allData[index][3];
            const gameTitle = findGameTitle(checkoutStatus[eachBadge].gameCode).name;
            const checkedOut = checkoutStatus[eachBadge].checkedOutAt;

            listItems += `<li>
                          <p>${guestName}</p>
                          <p>${gameTitle}</p>
                          <p>${timeStampToMinutesAgo(checkedOut)}</p>
                        </li>`;
          }
        });
      }

      logList.innerHTML = listItems;
    });
  });
});

// End Current Log Section

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
 * Retrieves the P2W flag from the sheet and returns a promise with the result.
 * @return {Promise} Boolean of value.
 */
function checkP2WFlag() {
  return getFromGoogle('J1').then(function (response) {
    return JSON.parse(JSON.parse(response.result.values[0][0]));
  });
}

/**
 * Toggles flag for activating P2W mode.
 * @return {Promise}
 */
function toggleP2WFlag() {
  return checkP2WFlag().then(function (response) {
    if (response) {
      return postToGoogle('J1', JSON.stringify("false"));
    } else {
      return postToGoogle('J1', JSON.stringify("true"));
    }
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
      try {
        cellArray = JSON.parse(response.result.values[0]);
      } catch (e) {}
    }
    if (index || index === 0) {
      cellArray[index] = value;
    } else {
      cellArray.push(value);
    }
    try {
      jsonArray = JSON.stringify(cellArray);
    } catch (e) {}
    postToGoogle(cell, jsonArray).then(function () {
      if (callBack) {
        callBack();
      }
    });
  });
}

function clearValueFromObjectInCell(key, cell) {
  getFromGoogle(cell).then(function (response) {
    let valueObj = JSON.parse(response.result.values[0][0] || {});
    valueObj[key] = '';

    postToGoogle(cell, JSON.stringify(valueObj)).then(function (response) {
      confirmGameReturned();
    });
  });
}

/**
 * Adds given text to given element
 */
function addTextToElement(element, text) {
  document.querySelector(element).textContent = text;
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
  return playToWinGames[barcode] || demoGames[barcode] || {name: barcode, quantity: 1};
}

// Ensures that a given barcode is 13 digits long and is all numbers
function badgeCodeIsValid(badgeCode) {
  if (badgeCode.length !== 13) {
    displayMessage(
      "Wrong number of digits for badge number.",
      "Maybe you typed into the wrong field? Or maybe the scanner had a bad scan. Just try again."
    );

    return false;
  }

  if (!badgeCode.match(/^[0-9]*$/)) {
    displayMessage(
      "You've got letters (or something) in your badge code.",
      "Maybe you typed into the wrong field? Or maybe the scanner had a bad scan. Just try again."
    );

    return false;
  }

  return true;
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
    document.querySelectorAll('.hidden-at-start').forEach(function (each) {
      each.classList.add('hidden');
    });
    document.querySelectorAll('.visible-at-start').forEach(function (each) {
      each.classList.remove('hidden');
    });
    document.querySelector('.registration-section').classList.remove('hidden');
    document.querySelector('.registration-section .starting-point').focus();
  } else if (startPoint === "checkout") {
    document.querySelector('.checkout-section').classList.remove('hidden');
    document.querySelector('.checkout-section .starting-point').focus();
  } else if (startPoint === "returns") {
    document.querySelector('.returns-section').classList.remove('hidden');
    document.querySelector('.returns-section .starting-point').focus();
  } else if (startPoint === "user-lookup") {
    document.querySelector('.user-lookup-section').classList.remove('hidden');
    document.querySelector('.user-lookup-section .starting-point').focus();
  } else if (startPoint === "winners") {
    document.querySelector('.winners-section').classList.remove('hidden');
  } else if (startPoint === "current-log") {
    document.querySelector('.current-log-section').classList.remove('hidden');
  } else {
    document.querySelector('.registration-section').classList.remove('hidden');
    document.querySelector('.registration-section .starting-point').focus();
  }
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

function randomNumberNotInArray(cap, array) {
  const random = Math.floor(Math.random() * cap);

  if (array.length === cap) {
    return 'No unique randoms left';
  }
  if (array.includes(random)) {
    return randomNumberNotInArray(cap, array);
  } else {
    return random;
  }
}

function timeStampToMinutesAgo(timestamp) {
  return `${Math.floor((Date.now() - timestamp)/1000/60)} minutes ago`;
}
// End Utility Functions
