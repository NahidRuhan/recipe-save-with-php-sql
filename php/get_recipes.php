<?php
session_start();
require 'db.php';

// This tells the browser: "The data I am about to send you is in JSON format, not HTML!"
header('Content-Type: application/json');

// Lock down the endpoint: If the user doesn't have an active session, kick them out.
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}
$userId = $_SESSION['user_id'];

// Prepare an SQL command: "Select all recipes but ONLY the ones that belong to this specific user"
$stmt = $pdo->prepare("SELECT * FROM recipes WHERE user_id = ? ORDER BY id DESC");
$stmt->execute([$userId]);
$recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Because we stored arrays (like ingredients) as raw JSON strings in the database, 
// we have to decode them back into lists so JavaScript can loop through them easily.
foreach ($recipes as &$recipe) {
    $recipe['ingredients'] = json_decode($recipe['ingredients']);
    $recipe['steps'] = json_decode($recipe['steps']);
    $recipe['pictures'] = json_decode($recipe['pictures']);
    $recipe['tags'] = json_decode($recipe['tags']);
}

// Send the final package of data back to the JavaScript file to be painted onto the screen!
echo json_encode($recipes);
?>