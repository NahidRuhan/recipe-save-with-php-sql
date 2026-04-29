<?php
// db.php - Handles the database connection.
// Every other PHP file includes this file so they can talk to MySQL.
$host = 'localhost';
$dbname = 'recipe_app';
$username = 'root'; // Default XAMPP username
$password = '';     // Default XAMPP password is empty

try {
    // 'PDO' is the PHP tool used to securely connect to databases.
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // If the database is broken or the password is wrong, the code kills itself and spits out an error.
    die("Database connection failed: " . $e->getMessage());
}
?>