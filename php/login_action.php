<?php
// session_start() is crucial! It tells the server to remember this user across different pages.
session_start();
// Bring in our database connection so we can talk to MySQL.
require 'db.php';
// Tell the browser we are sending back raw data (JSON), not an HTML webpage.
header('Content-Type: application/json');

// Read the username and password that the user's JavaScript just sent over.
$data = json_decode(file_get_contents('php://input'), true);

// If they forgot to type a username or password, stop and send an error message back.
if (!$data || empty($data['username']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Please provide username and password']);
    exit;
}

// Ask the database: "Do you have a user with this username?"
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
// Safely fill in the '?' blank with the username they typed.
$stmt->execute([$data['username']]);
// Fetch that user's record from the database.
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// If the user exists, we use password_verify to check if the password matches the scrambled hash in the database.
if ($user && password_verify($data['password'], $user['password'])) {
    // It matched! We save their ID and username in the server's "Session" memory so they stay logged in.
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    // Tell JavaScript the login was a success!
    echo json_encode(['success' => true]);
} else {
    // If the username wasn't found OR the password was wrong, send an error.
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
}
?>