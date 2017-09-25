// Grab the articles as a json, clear container, and display data
var displayArticles = function() {
  $.getJSON("/articles", function(data) {
    $("#articles").empty();
    // For each one
    for (var i = 0; i < data.length; i++) {
      // Display the apropos information on the page
      $("#articles").prepend('<p data-id="' + data[i]._id + '">' + data[i].title + '<br /><a href=' + data[i].link + ' target="blank">' + data[i].source + ' </a></p>');
    }
  });
};

$(document).on("click", "#scrape-button", function(){
  console.log("Running Button Scrape");
  $.ajax({
    method: "GET",
    url: "/scrape"
  })
  .done(function(data){
    displayArticles();
  });
});

// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#modal-body").empty();
  $('#notes-modal').modal('show');

  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .done(function(data) {
      console.log(data);
      // The title of the article
      $("#modal-title").empty().append(data.title);
      // An list area to hold notes
      $("#modal-notes").empty().append("<ul class='list-group note-container'><li class='list-group-item'>No notes for this article yet.</li></ul>");
      //An input to enter a note
      $("#modal-input").empty().append("<textarea id='noteinput' placeholder='Add a new note' rows='4' cols='60'></textarea>");
      // A button to submit a new note, with the id of the article saved to it and a close button
      $("#modal-footer").empty().append("<div class='modal-footer'> <button data-id='" + data._id + "' id='savenote' class='btn btn-primary'>Save Note</button><button type='button' class='btn btn-secondary' data-dismiss='modal'>Close</button>");

      // If there's a note in the article
      if (data.note) {

        $.ajax({
          method: "GET",
          url: "/notes/" + thisId
        })
        // Place the body of the note in the body textarea
        .done(function(data){
          var html = "<ul class='list-group note-container'>";
          for (var i = 0; i < data.length; i++) {
            html += "<li class='list-group-item note'>" + data[i].note + "<button class='btn btn-danger note-delete' id=" + data[i]._id + ">x</button></li>";
            };
          html += "</ul>";
          $("#modal-notes").empty().append(html);
        });
        
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      note: $("#noteinput").val(),
      articleId: thisId
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      //$("#noteinput").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#noteinput").val("");
});

// When you click the X button to delete a note
$(document).on("click", ".note-delete", function() {
  // Grab the id associated with the article from the X button
  var thisId = $(this).attr("id");

  // Run a DELETE request to delete the note
  $.ajax({
    method: "DELETE",
    url: "/note-delete/" + thisId
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
    });

  // Also, remove the note item you just deleted
  $("#" + thisId).parent().remove();
});

displayArticles();
