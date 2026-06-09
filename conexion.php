<?php
header('Content-Type: text/html; charset=utf-8');

$serverName = "aniwalks.database.windows.net";
$connectionOptions = array(
    "Database" => "AniwalksFinal2",
    "Uid" => "aniwalks",
    "PWD" => "luisa.2318",
    "CharacterSet" => "UTF-8"
);

$conn = sqlsrv_connect($serverName, $connectionOptions);

if (!$conn) {
    die("Error de conexión a la base de datos: " . print_r(sqlsrv_errors(), true));
} else {
    echo "Conexión exitosa a la base de datos"; 
}

?>