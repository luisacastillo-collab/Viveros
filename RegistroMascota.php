<?php
include("conexion.php");

$Tipo = $_POST["Tipo_Mascota"];
$Nombrem = $_POST["Nombre_Mascota"];
$Raz = $_POST["Raza"];
$Tam = $_POST["Tamaño"];
$Desc = $_POST["Descripcion"];

// Registro
if (isset($_POST["registrar"])) {
    $query = "INSERT INTO Mascota (Tipo_Mascota, Nombre_Mascota, Raza, Tamaño, Descripcion) 
              VALUES ('$Tipo','$Nombrem','$raz','$Tam', '$Desc')";

    $stmt = sqlsrv_query($conn, $query);

    if ($stmt) {
        echo "<script> alert('Usuario registrado: $Nombrem'); window.location='RegistroEmpleado.html' </script>";
    } else {
        echo "Error: " . $query . "<br>" . print_r(sqlsrv_errors(), true);
    }
}
?>