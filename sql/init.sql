-- Creación de la base de datos desde cero
DROP DATABASE IF EXISTS cormex_db;
CREATE DATABASE cormex_db;
USE cormex_db;

-- 1. Tabla de Ciudades
CREATE TABLE ciudades (
    id_ciudad INT AUTO_INCREMENT PRIMARY KEY,
    nombre_ciudad VARCHAR(100) NOT NULL
);

-- 2. Tabla de Empleados
CREATE TABLE empleados (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudad INT NOT NULL,
    nombre_empleado VARCHAR(15) NOT NULL,
    apellido_paterno VARCHAR(15) NOT NULL,
    apellido_materno VARCHAR(15) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sueldo DECIMAL(10,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_ciudad) REFERENCES ciudades(id_ciudad)
);

-- 3. Tabla de Rutas
CREATE TABLE rutas (
    id_ruta INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudad INT NOT NULL,
    id_empleado INT NOT NULL,
    nombre_ruta VARCHAR(15) NOT NULL,
    tipo_servicio VARCHAR(15) NOT NULL,
    capacidad INT NOT NULL,
    FOREIGN KEY (id_ciudad) REFERENCES ciudades(id_ciudad),
    FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

-- 4. Stored Procedure para Baja Lógica (Soft Delete)
DELIMITER //

CREATE PROCEDURE sp_eliminar_empleado(
    IN p_id_empleado INT,
    OUT p_exito BOOLEAN,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_cantidad_rutas INT;

    SELECT COUNT(*) INTO v_cantidad_rutas
    FROM rutas
    WHERE id_empleado = p_id_empleado;

    IF v_cantidad_rutas > 0 THEN
        SET p_exito = FALSE;
        SET p_mensaje = 'El empleado cuenta con rutas asignadas. Favor de modificar las rutas primero.';
    ELSE
        UPDATE empleados
        SET activo = FALSE
        WHERE id_empleado = p_id_empleado;
        
        SET p_exito = TRUE;
        SET p_mensaje = 'Empleado dado de baja exitosamente.';
    END IF;
END //

DELIMITER ;

-- 5. Datos Semilla (Inserts de prueba)
INSERT INTO ciudades (nombre_ciudad) VALUES 
('Culiacán'), 
('Mazatlán'), 
('Escuinapa'), 
('Los Mochis'),
('Guasave');

INSERT INTO empleados (id_ciudad, nombre_empleado, apellido_paterno, apellido_materno, fecha_nacimiento, sueldo, activo) VALUES 
(1, 'Juan Jose', 'Lopez', 'Perez', '1990-09-01', 100.00, TRUE),
(2, 'Carlos', 'Ruiz', 'Gomez', '1985-08-20', 350.50, TRUE),
(3, 'Luis', 'Soto', 'Mejia', '1998-11-10', 400.00, TRUE),
(1, 'Pedro', 'Garcia', 'Luna', '2001-01-15', 300.00, TRUE);

INSERT INTO rutas (id_ciudad, id_empleado, nombre_ruta, tipo_servicio, capacidad) VALUES 
(1, 1, 'BACUBIRITO 1', 'Personal', 15), 
(1, 4, 'CULIACAN SUR', 'Artículos', 80),
(2, 2, 'MAZATLAN COSTA', 'Personal', 30),
(3, 3, 'ESCUINAPA CENT', 'Artículos', 50);