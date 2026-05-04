<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}
$userId = $_SESSION['user_id'];

// Check if there is a search query provided
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Fetch all users except the currently logged-in user, and check if we are already following them
if ($search !== '') {
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, 
               IF(f.follower_id IS NOT NULL, 1, 0) as is_following
        FROM users u
        LEFT JOIN follows f ON u.id = f.following_id AND f.follower_id = ?
        WHERE u.id != ? AND u.username LIKE ?
        ORDER BY u.username ASC
    ");
    // Use % wildcards for partial matches (e.g. searching 'jo' matches 'john')
    $stmt->execute([$userId, $userId, "%" . $search . "%"]);
} else {
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, 
               IF(f.follower_id IS NOT NULL, 1, 0) as is_following
        FROM users u
        LEFT JOIN follows f ON u.id = f.following_id AND f.follower_id = ?
        WHERE u.id != ?
        ORDER BY u.username ASC
    ");
    $stmt->execute([$userId, $userId]);
}

$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
?>