<?php
include("conexion.php");

$Nombrec = $_POST["Nombre_Cliente"];
$Cor = $_POST["Correo"];
$Cedulac = $_POST["Cedula_Cliente"];
$Direccionc = $_POST["Direccion_Cliente"];
$Telefonoc = $_POST["Telefono_Cliente"];



// Registro
if (isset($_POST["registrar"])) {
    $query = "INSERT INTO Cliente (Nombre_Cliente, Correo, Cedula_Cliente, Direccion_Cliente, Telefono_Cliente) 
              VALUES ('$Nombrec','$Cor','$Cedulac','$Direccionc', '$Telefonoc')";

    $stmt = sqlsrv_query($conn, $query);

    if ($stmt) {
        echo "<script> alert('Usuario registrado: $Cedula'); window.location='RegistroEmpleado.html' </script>";
    } else {
        echo "Error: " . $query . "<br>" . print_r(sqlsrv_errors(), true);
    }
}
?>