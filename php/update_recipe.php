<?php
// Resume the session to check who is currently logged in.
session_start();
// Bring in our database connection tool.
require 'db.php';

// Tell the browser we are sending back raw JSON data, not an HTML webpage.
header('Content-Type: application/json');

// Bouncer check: If the user is not logged in, stop immediately and return an error!
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
// Remember the logged-in user's ID.
$userId = $_SESSION['user_id'];

// Grab the raw updated data that JavaScript sent over.
$json_data = file_get_contents('php://input');
// Convert that raw text into a PHP array we can easily use.
$data = json_decode($json_data, true);

// Double-check that they actually sent data, and that it includes the recipe's ID and title.
if (!$data || !isset($data['id']) || !isset($data['title'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data received']);
    exit;
}

$recipeId = $data['id'];
$title = $data['title'];

// MySQL cannot store lists (like an array of ingredients) directly in a single column.
// So, we use json_encode to convert those lists back into raw strings before saving them!
$ingredients = json_encode($data['ingredients'] ?? []);
$steps = json_encode($data['steps'] ?? []);
$pictures = json_encode($data['pictures'] ?? []);
$tags = json_encode($data['tags'] ?? []);

// Prepare the SQL command to UPDATE an existing row instead of inserting a new one.
// The 'AND user_id = ?' part is a massive security check—it ensures a user can only update their own recipes!
$stmt = $pdo->prepare("UPDATE recipes SET title = ?, ingredients = ?, steps = ?, pictures = ?, tags = ? WHERE id = ? AND user_id = ?");

// Run the command, replacing the '?' placeholders with the actual updated data in the exact same order.
if ($stmt->execute([$title, $ingredients, $steps, $pictures, $tags, $recipeId, $userId])) {
    // Tell JavaScript the update was a success!
    echo json_encode(['success' => true]);
} else {
    // If the database rejected the update, send back a failure message.
    echo json_encode(['success' => false, 'message' => 'Failed to update recipe']);
}
?>