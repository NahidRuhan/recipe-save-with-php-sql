<?php
// Resume the session to check who is logged in
session_start();
// Bring in our database connection tool
require 'db.php';

// Tell the browser we are sending back raw JSON data, not a webpage
header('Content-Type: application/json');

// Bouncer check: If the user is not logged in, stop immediately and return an error
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
// Remember the logged-in user's ID
$userId = $_SESSION['user_id'];

// Check if the URL has an '?id=X' attached to it. We need to know WHICH recipe to get!
if (!isset($_GET['id'])) {
    echo json_encode(['error' => 'No recipe ID provided']);
    exit;
}

// Prepare a secure SQL query to find the specific recipe by its ID. 
// We removed the 'AND user_id = ?' restriction so you can view recipes from chefs you follow!
$stmt = $pdo->prepare("SELECT * FROM recipes WHERE id = ?");
// Fill in the '?' blank with the requested recipe ID
$stmt->execute([$_GET['id']]);
// Fetch the single row from the database
$recipe = $stmt->fetch(PDO::FETCH_ASSOC);

// If the recipe was successfully found...
if ($recipe) {
    // The database stores lists (like ingredients) as raw text strings (JSON). 
    // We decode them back into proper PHP arrays here so JavaScript can easily loop through them later.
    $recipe['ingredients'] = json_decode($recipe['ingredients']);
    $recipe['steps'] = json_decode($recipe['steps']);
    $recipe['pictures'] = json_decode($recipe['pictures']);
    $recipe['tags'] = json_decode($recipe['tags']);
    // Send the fully assembled recipe data back to the JavaScript!
    echo json_encode($recipe);
} else {
    // If the recipe doesn't exist (or belongs to someone else), send a standard "404 Not Found" error
    http_response_code(404);
    echo json_encode(['error' => 'Recipe not found']);
}
?>