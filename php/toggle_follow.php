<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['following_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing following ID']);
    exit;
}
$followingId = (int)$data['following_id'];

// Check if already following
$check = $pdo->prepare("SELECT * FROM follows WHERE follower_id = ? AND following_id = ?");
$check->execute([$userId, $followingId]);

if ($check->rowCount() > 0) {
    $del = $pdo->prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
    $del->execute([$userId, $followingId]);
    echo json_encode(['success' => true, 'action' => 'unfollowed']);
} else {
    $ins = $pdo->prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)");
    $ins->execute([$userId, $followingId]);
    echo json_encode(['success' => true, 'action' => 'followed']);
}
?>