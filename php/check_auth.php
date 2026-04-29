<?php
// session_start() allows us to access the $_SESSION memory where we saved the user's login info earlier.
session_start();

// Tell the browser that the response will be raw data (JSON), not a webpage (HTML).
header('Content-Type: application/json');

// Check if the server remembers this user (if 'user_id' exists in the session memory).
if (isset($_SESSION['user_id'])) {
    // If yes, tell the JavaScript "Yes, they are logged in" and pass along their username to display on the screen.
    echo json_encode(['logged_in' => true, 'username' => $_SESSION['username']]);
} else {
    // If no, tell the JavaScript "No, they are a guest."
    echo json_encode(['logged_in' => false]);
}
?>