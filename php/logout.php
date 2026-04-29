<?php
// We need to start the session first so the server knows *which* session we are talking about.
session_start();

// Completely wipe out the session memory. This deletes their user ID and username, officially logging them out!
session_destroy();

// Redirect the user's browser back to the login page now that they are logged out.
header('Location: ../pages/login.html');

// Always use 'exit' after a redirect to tell the server to immediately stop running this file.
exit;
?>