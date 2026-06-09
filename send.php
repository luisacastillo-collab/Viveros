<?php
include("conexion.php");

$Nombre_Empleado = $_POST["Nombre_Empleado"];
$Apellido_Empleado = $_POST["Apellido_Empleado"];
$Cedula_Empleado = $_POST["Cedula_Empleado"];
$Direccion_Empleado = $_POST["Direccion_Empleado"];
$Telefono_Empleado = $_POST["Telefono_Empleado"];
$Experiencia = $_POST["Experiencia"];
$Cantidad_Paseos_Realizados = $_POST["Cantidad_Paseos_Realizados"];
$Puntuacion_Dada = $_POST["Puntuacion_Dada"];


// Registro
if (isset($_POST["registrar"])) {
    $query = "INSERT INTO Empleado (Nombre_Empleado,Apellido_Empleado,Cedula_Empleado,Direccion_Empleado, Telefono_Empleado, Experiencia, Cantidad_Paseos_Realizados, Puntuacion_Dada) 
              VALUES ('$Nombre_Empleado','$Apellido_Empleado','$Cedula_Empleado','$Direccion_Empleado', '$Telefono_Empleado', '$Experiencia','$Cantidad_Paseos_Realizados','$Puntuacion_Dada')";

    $stmt = sqlsrv_query($conn, $query);

    if ($stmt) {
        echo "<script> alert('Usuario registrado: $Cedula_Empleado'); window.location='cliente.html' </script>";
    } else {
        echo "Error: " . $query . "<br>" . print_r(sqlsrv_errors(), true);
    }
}
?>