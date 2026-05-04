<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}
$userId = $_SESSION['user_id'];

// Select recipes ONLY from users that the current user is following
$stmt = $pdo->prepare("
    SELECT r.*, u.username as author_name 
    FROM recipes r
    JOIN users u ON r.user_id = u.id
    JOIN follows f ON r.user_id = f.following_id
    WHERE f.follower_id = ?
    ORDER BY r.id DESC
");
$stmt->execute([$userId]);
$recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($recipes as &$recipe) {
    $recipe['ingredients'] = json_decode($recipe['ingredients']);
    $recipe['steps'] = json_decode($recipe['steps']);
    $recipe['pictures'] = json_decode($recipe['pictures']);
    $recipe['tags'] = json_decode($recipe['tags']);
}

echo json_encode($recipes);
?>