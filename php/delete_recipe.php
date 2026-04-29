<?php
// Resume the user's session so we know who is trying to delete something
session_start();

// Bring in our database connection tool
require 'db.php';

// Tell the browser that our reply will be formatted as JSON data
header('Content-Type: application/json');

// Bouncer check: If the user is not logged in, stop immediately and say "Unauthorized"
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}
// Remember the logged-in user's ID
$userId = $_SESSION['user_id'];

// Check if the JavaScript actually told us WHICH recipe to delete (it sends this in the URL like '?id=5')
if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'No recipe ID provided']);
    exit;
}

$recipeId = $_GET['id'];

// Prepare the SQL command to delete the recipe. 
// VERY IMPORTANT: We add "AND user_id = ?" to guarantee a user can only delete their OWN recipes, not someone else's!
$stmt = $pdo->prepare("DELETE FROM recipes WHERE id = ? AND user_id = ?");
// Safely fill in the '?' blanks with the recipe ID and user ID, then run the command
$stmt->execute([$recipeId, $userId]);

// Tell the JavaScript that it was successful, and let it know how many rows were actually deleted
echo json_encode(['success' => true, 'deletedCount' => $stmt->rowCount()]);
?>