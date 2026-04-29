<?php
// Start the session so we can automatically log the user in after they register.
session_start();
// Bring in our database connection tool.
require 'db.php';
// Tell the browser we are replying with raw JSON data, not a webpage.
header('Content-Type: application/json');

// Grab the JSON data (username and password) sent by the JavaScript fetch request.
$data = json_decode(file_get_contents('php://input'), true);

// If they left the username or password blank, stop here and send an error.
if (!$data || empty($data['username']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Please provide username and password']);
    exit;
}

// CRITICAL SECURITY: Never save plain-text passwords! 
// password_hash() scrambles the password into an unreadable string before saving it to the database.
$hash = password_hash($data['password'], PASSWORD_DEFAULT);

// Prepare the SQL command to create a new user in the database.
$stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");

// We use a 'try-catch' block because if the username already exists, the database will complain and throw an error.
try {
    // Run the command to save the new user, filling in the '?' blanks with their username and the scrambled password.
    if ($stmt->execute([$data['username'], $hash])) {
        // Registration successful! Log them in immediately by saving their new ID and username into the server's session memory.
        $_SESSION['user_id'] = $pdo->lastInsertId();
        $_SESSION['username'] = $data['username'];
        // Tell the JavaScript that the registration worked!
        echo json_encode(['success' => true]);
    }
} catch (PDOException $e) {
    // If the database threw an error, it's almost certainly because the username is already taken.
    echo json_encode(['success' => false, 'message' => 'Username might already exist']);
}
?>