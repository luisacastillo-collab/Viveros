<?php
include("conexion.php");

$Nombre = $_POST["Nombre_Empleado"];
$Apellido = $_POST["Apellido_Empleado"];
$Cedula = $_POST["Cedula_Empleado"];
$Direccion = $_POST["Direccion_Empleado"];
$Telefono = $_POST["Telefono_Empleado"];
$Experienciaa = $_POST["Experiencia"];
$Paseos = $_POST["Cantidad_Paseos_Realizados"];


// Registro
if (isset($_POST["registrar"])) {
    $query = "INSERT INTO Empleado (Nombre_Empleado, Apellido_Empleado, Cedula_Empleado, Direccion_Empleado, Telefono_Empleado, Experiencia, Cantidad_Paseos_Realizados) 
              VALUES ('$Nombre','$Apellido','$Cedula','$Direccion', '$Telefono','$Experienciaa','$Paseos')";

    $stmt = sqlsrv_query($conn, $query);

    if ($stmt) {
        echo "<script> alert('Usuario registrado: $Cedula'); window.location='RegistroEmpleado.html' </script>";
    } else {
        echo "Error: " . $query . "<br>" . print_r(sqlsrv_errors(), true);
    }
}
?>