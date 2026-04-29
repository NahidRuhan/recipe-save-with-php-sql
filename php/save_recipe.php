<?php
// Resume the session to check who is currently logged in.
session_start();
// Bring in our database connection tool.
require 'db.php';

// Tell the browser we are replying with JSON data, not a webpage.
header('Content-Type: application/json');

// Bouncer check: If the user is not logged in, stop immediately and return an error!
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Please log in.']);
    exit;
}
// Remember the logged-in user's ID so we can attach the new recipe to them.
$userId = $_SESSION['user_id'];

// Grab the raw data that JavaScript sent over in the "body" of the fetch() request.
$json_data = file_get_contents('php://input');
// Convert that raw text into a PHP array we can easily use.
$data = json_decode($json_data, true);

// Double-check that they actually sent data, and that the recipe at least has a title.
if (!$data || !isset($data['title'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data received']);
    exit;
}

// Grab the title as a normal string of text.
$title = $data['title'];
// MySQL cannot store lists (like an array of ingredients) directly in a single column.
// So, we use json_encode to convert those lists back into raw strings before saving them!
$ingredients = json_encode($data['ingredients'] ?? []);
$steps = json_encode($data['steps'] ?? []);
$pictures = json_encode($data['pictures'] ?? []);
$tags = json_encode($data['tags'] ?? []);

// Prepare the SQL command to create a new row in the 'recipes' table. 
// We use '?' placeholders instead of the actual data to protect against hackers (SQL Injection).
$stmt = $pdo->prepare("INSERT INTO recipes (user_id, title, ingredients, steps, pictures, tags) VALUES (?, ?, ?, ?, ?, ?)");

// Run the command! We pass in the actual data here to fill in those '?' blanks in the exact same order.
if ($stmt->execute([$userId, $title, $ingredients, $steps, $pictures, $tags])) {
    // If it worked, tell JavaScript it was a success, and grab the new recipe's unique ID number!
    echo json_encode(['success' => true, 'insertedId' => $pdo->lastInsertId()]);
} else {
    // If the database rejected it, send back a failure message.
    echo json_encode(['success' => false, 'message' => 'Failed to save recipe']);
}
?>