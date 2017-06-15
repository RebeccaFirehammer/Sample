/**************************************************
 * Required Google API.AI lines 
 **************************************************/
'use strict';   

process.env.DEBUG = 'actions-on-google:*';  
const App = require('actions-on-google').ApiAiApp;  

/**************************************************/

/*
*Database Connection & Queries
*/

//Connection
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "heb",
  database: "names"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

//INSERT
function insert(){
    var sql = "INSERT INTO posinterns (id, FirstName, LastName) VALUES ('?', '?', '?')";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
}

//SELECT
function select(){
  con.query("SELECT * FROM postinterns", function (err, result) {
    if (err) throw err;
    console.log(result);
  });
}

//DELETE
function delete1(){
  var sql = "DELETE FROM posinterns WHERE id = '?'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Number of records deleted: " + result.affectedRows);
  });
}

//UPDATE
function update(){
  var sql = "UPDATE posinterns SET id = '?' WHERE id = '?'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result.affectedRows + " record(s) updated");
  });
}

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';  
const TELL_NAME = 'tell.name';  

// API.AI parameter names
const CATEGORY_ARGUMENT = 'category';   

// API.AI Contexts/lifespans
const NAME_CONTEXT = 'choose_first-followup';
const DEFAULT_LIFESPAN = 5; 
const END_LIFESPAN = 0; 

const NAME_TYPE = { 
  FIRST: 'first',  
  LAST: 'last', 
};

const FIRST_NAMES = new Set([ 
  'Rebecca',    
  'Matt',   
  'Tom',    
  'Sakshi'  
]); 

const LAST_NAMES = new Set([
  'Firehammer', 
  'Christman',  
  'Nguyen', 
  'Choudhary'
]); 

const DATABASE_LINK = 'localhost';  
const NEXT_NAME_DIRECTIVE = 'Would you like to hear another name?';    
const CONFIRMATION_SUGGESTIONS = ['Sure', 'No thanks']; 

const NO_INPUTS = [ 
  'I didn\'t hear that.',   
  'If you\'re still there, say that again.',    
  'We can stop here. See you soon.' 
];  

// This sample uses a sound clip from the Actions on Google Sound Library
// https://developers.google.com/actions/tools/sound-library
const MEOW_SRC = 'https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg'; //lol, keeping this

function getRandomName (names) {    
  if (names.size <= 0) {    
    return null;    
  } 
  let randomIndex = (Math.random() * (names.size - 1)).toFixed();   
  let randomNameIndex = parseInt(randomIndex, 10);  
  let counter = 0;  
  let randomName = '';  
  for (let name of names.values()) {    
    if (counter === randomNameIndex) {  
      randomName = name;    
      break;    
    }   
    counter ++; 
  } 
  names.delete(randomName); 
  return randomName;    
}   

/* Start your action */
exports.namesOfInterns = (request, response) => {
  const app = new App({ request, response });   
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body)); 

  /*Fulfill action business logic */
  //Greet the user and direct them to next turn
  function unhandledDeepLinks (app) {   
      if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
      app.ask(app.buildRichResponse()   
        .addSimpleResponse(`Welcome to POS Intern Names! I'd really rather \   
          not talk about ${app.getRawInput()}. Wouldn't you rather talk about \
          POS Interns? I can tell you first names or last names. \
          Which do you want to hear about?`)  
        .addSuggestions(['First names', 'Last names']), NO_INPUTS);  
    } else {    
      app.ask(`Welcome to Intern Names! I'd really rather \
        not talk about ${app.getRawInput()}. \
        Wouldn't you rather talk about Interns? I can tell you \
        first names, last names, or id numbers. Which do you want to hear about?`,
        NO_INPUTS); 
    }   
  } 

  //Say a name
  function tellName (app) { 
    let firstNames = app.data.firstNames    
      ? new Set(app.data.firstNames) : FIRST_NAMES; 
    let lastNames = app.data.lastNames ? new Set(app.data.lastNames) : LAST_NAMES;  
    
    if (firstNames.size === 0 && lastNames.size === 0) {
      app.tell('Actually it looks like you heard all the names. ' +
        'Thanks for listening!');
      return;   
    }

    let nameCategory = app.getArgument(CATEGORY_ARGUMENT);

    if (nameCategory === NAME_TYPE.FIRST_NAMES) {
      let name = getRandomName(firstNames);
      if (name === null) {  
        if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {  
          let suggestions = ['Last names'];   
          app.ask(app.buildRichResponse()   
            .addSimpleResponse(noNamesLeft(app, nameCategory, NAME_TYPE.LAST_NAMES))
            .addSuggestions(suggestions), NO_INPUTS);   
        } else {    
          app.ask(noNamesLeft(app, nameCategory, NAME_TYPE.LAST_NAMES), 
            NO_INPUTS); 
        }   
        return; 
      } 

      let namePrefix = 'Sure, here\'s a first name. <audio src="${MEOW_SRC}"></audio>';  
      app.data.firstNames = Array.from(firstNames); 
      if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
        app.ask(app.buildRichResponse() 
          .addSimpleResponse(namePrefix)
          .addBasicCard(app.buildBasicCard(name))   
          .addSimpleResponse(NEXT_NAME_DIRECTIVE)   
          .addSuggestions(CONFIRMATION_SUGGESTIONS), NO_INPUTS);
      } else {  
        app.ask(namePrefix + name + NEXT_NAME_DIRECTIVE, NO_INPUTS);
      } 
      return;
    } else if (nameCategory === NAME_TYPE.LAST_NAMES) { 
      let name = getRandomName(lastNames);
      if (name === null) {
        if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
          let suggestions = ['First names']; 
          app.ask(app.buildRichResponse()   
            .addSimpleResponse(noNamesLeft(app, nameCategory, NAME_TYPE.FIRST_NAMES)) 
            .addSuggestions(suggestions), NO_INPUTS);   
        } else {    
          app.ask(noNamesLeft(app, nameCategory, NAME_TYPE.FIRST_NAMES), NO_INPUTS);
        }   
        return; 
      } 

      let namePrefix = 'Okay, here\'s a last name. <audio src="${MEOW_SRC}"></audio>';
      app.data.lastNames = Array.from(lastNames);
      if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
        app.ask(app.buildRichResponse() 
          .addSimpleResponse(namePrefix)
          .addBasicCard(app.buildBasicCard(name))
          .addSimpleResponse(NEXT_NAME_DIRECTIVE)
          .addSuggestions(CONFIRMATION_SUGGESTIONS), NO_INPUTS);
      } else {  
        app.ask(namePrefix + name + NEXT_NAME_DIRECTIVE, NO_INPUTS);
      } 
      return;   
    } else {    
      // Conversation repair is handled in API.AI, but this is a safeguard
      if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
        app.ask(app.buildRichResponse() 
          .addSimpleResponse(`Sorry, I didn't understand. I can tell you an \
intern's first name or last name. Which one do you want to \
hear about?`)   
          .addSuggestions(['First names', 'Last names']), NO_INPUTS);
      } else {
        app.ask(`Sorry, I didn't understand. I can tell you an \
intern's first name or last name. Which one do you want to \
hear about?`, NO_INPUTS);
      } 
    }
  }

  // Say they've heard it all about this category
  function noNamesLeft (app, currentCategory, redirectCategory) {
    let parameters = {};
    parameters[CATEGORY_ARGUMENT] = redirectCategory;
    // Replace the outgoing name context with different parameters
    app.setContext(NAMES_CONTEXT, DEFAULT_LIFESPAN, parameters);
    let response = `Looks like you've heard all the POS Interns \
      ${currentCategory}. I could tell you about\
      ${redirectCategory} instead. `; 
    response += `So what would you like to hear about?`;
    return response;
  }

  let actionMap = new Map();
  actionMap.set(UNRECOGNIZED_DEEP_LINK, unhandledDeepLinks);
  actionMap.set(TELL_NAME, tellName);

  app.handleRequest(actionMap); 
};  
/*END your action*/