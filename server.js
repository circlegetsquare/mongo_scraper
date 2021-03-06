// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Initialize Express
var app = express();

//Dynamic Ports
var port = process.env.PORT || 3000;

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://heroku_5x84lq8t:o54aumhs6l83k51ji41unlvh94@ds147274.mlab.com:47274/heroku_5x84lq8t");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes
// ======

// A GET request to scrape the Google News website
app.get("/scrape", function(req, res) {
  var newArticleCount = 1;
  // First, we grab the body of the html with request
  request("https://news.google.com/news/?ned=us&hl=en", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    console.log("scraper running!");
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $('c-wiz .M1Uqc').each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children('a[role=heading]').text();
      result.link = $(this).children('a[role=heading]').attr("href");
      result.source = $(this).children('div').children('span[jsname=lVVfob]').text();
      
      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        
        // Log any errors
        if (err) {
          console.log("err");
        }
        // Or log the doc
        else {
          console.log(doc);
          newArticleCount++;
          console.log(newArticleCount);
        }
      });
    });
    res.json(newArticleCount);
  });
  // Tell the browser that we finished scraping the text
  //console.log("Scrape Complete");
  //res.sendStatus(newArticleCount);
  
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log("error");
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});



// This will get the notes from MongoDB
app.get("/notes/:id", function(req, res) {
  // Grab every doc in the Articles array
  Note.find({ "articleId": req.params.id }, function(error, doc) {
    // Log any errors
    if (error) {
      console.log("error");
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
      //console.log(doc);
    }
  });
});

// This will delete a note
app.delete("/note-delete/:id", function(req, res) {
  // Grab every doc in the Articles array
  Note.findOneAndRemove({ "_id": req.params.id }, function(error, doc) {
    // Log any errors
    if (error) {
      console.log("error");
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
      //console.log(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Create a new note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});


// Set port to listen
app.listen(port, function() {
  console.log("App running on port " + port + "!");
});
