-- ============================================================
-- BASE DE DATOS: CorralonDB
-- Presupuestador de materiales - Corralón Don Pedro
-- Programación II - Ciclo 2026 - Clase 15
-- ============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CorralonDB')
BEGIN
    CREATE DATABASE CorralonDB;
END
GO

USE CorralonDB;
GO

-- ------------------------------------------------------------
-- TABLAS
-- ------------------------------------------------------------

-- 1. Materiales
IF OBJECT_ID('dbo.DetallePresupuesto', 'U') IS NOT NULL DROP TABLE dbo.DetallePresupuesto;
IF OBJECT_ID('dbo.Presupuestos', 'U') IS NOT NULL DROP TABLE dbo.Presupuestos;
IF OBJECT_ID('dbo.Materiales', 'U') IS NOT NULL DROP TABLE dbo.Materiales;
GO

CREATE TABLE dbo.Materiales (
    IdMaterial INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(80) NOT NULL,
    Unidad NVARCHAR(20) NOT NULL,
    Precio DECIMAL(12, 2) NOT NULL,
    Stock INT NOT NULL,
    CONSTRAINT PK_Materiales PRIMARY KEY CLUSTERED (IdMaterial ASC),
    CONSTRAINT CK_Materiales_Precio CHECK (Precio > 0),
    CONSTRAINT CK_Materiales_Stock CHECK (Stock >= 0)
);
GO

-- 2. Presupuestos (Cabecera)
CREATE TABLE dbo.Presupuestos (
    IdPresupuesto INT IDENTITY(1,1) NOT NULL,
    Cliente NVARCHAR(80) NOT NULL,
    Total DECIMAL(12, 2) NOT NULL,
    Fecha DATETIME NOT NULL CONSTRAINT DF_Presupuestos_Fecha DEFAULT (GETDATE()),
    CONSTRAINT PK_Presupuestos PRIMARY KEY CLUSTERED (IdPresupuesto ASC),
    CONSTRAINT CK_Presupuestos_Total CHECK (Total > 0)
);
GO

-- 3. DetallePresupuesto (Detalle con PrecioUnitario congelado)
CREATE TABLE dbo.DetallePresupuesto (
    IdPresupuesto INT NOT NULL,
    IdMaterial INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(12, 2) NOT NULL,
    CONSTRAINT PK_DetallePresupuesto PRIMARY KEY CLUSTERED (IdPresupuesto ASC, IdMaterial ASC),
    CONSTRAINT FK_Detalle_Presupuestos FOREIGN KEY (IdPresupuesto) REFERENCES dbo.Presupuestos (IdPresupuesto),
    CONSTRAINT FK_Detalle_Materiales FOREIGN KEY (IdMaterial) REFERENCES dbo.Materiales (IdMaterial),
    CONSTRAINT CK_Detalle_Cantidad CHECK (Cantidad > 0)
);
GO

-- ------------------------------------------------------------
-- DATOS INICIALES (12 materiales con precios y stock de prueba)
-- ------------------------------------------------------------
INSERT INTO dbo.Materiales (Nombre, Unidad, Precio, Stock) VALUES
(N'Cemento Holcim 50 kg', N'bolsa', 14200.00, 110),
(N'Cal hidratada 25 kg', N'bolsa', 6800.00, 80),
(N'Arena fina', N'm³', 38500.00, 25),
(N'Piedra partida 6-20', N'm³', 45200.00, 18),
(N'Ladrillo hueco 12x18x33', N'unidad', 950.00, 4500),
(N'Ladrillo común', N'unidad', 420.00, 7500),
(N'Hierro aletado 8 mm x 12 m', N'barra', 9800.00, 200),
(N'Hierro aletado 10 mm x 12 m', N'barra', 15300.00, 150),
(N'Malla sima 15x15 (6 m x 2,4 m)', N'unidad', 52000.00, 12),
(N'Membrana asfáltica 35 kg', N'rollo', 68500.00, 9),
(N'Placa de yeso 1,20 x 2,40', N'unidad', 18900.00, 40),
(N'Cerámico símil madera 1ra', N'm²', 21500.00, 0);
GO

-- ------------------------------------------------------------
-- PROCEDIMIENTOS ALMACENADOS
-- ------------------------------------------------------------

-- Listar Materiales
CREATE OR ALTER PROCEDURE dbo.usp_ListarMateriales
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IdMaterial, Nombre, Unidad, Precio, Stock
    FROM dbo.Materiales
    ORDER BY Nombre ASC;
END;
GO

-- Listar Presupuestos (con COUNT de items agrupado)
CREATE OR ALTER PROCEDURE dbo.usp_ListarPresupuestos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        P.IdPresupuesto,
        P.Cliente,
        P.Total,
        P.Fecha,
        COUNT(D.IdMaterial) AS CantidadItems
    FROM dbo.Presupuestos AS P
    INNER JOIN dbo.DetallePresupuesto AS D
        ON D.IdPresupuesto = P.IdPresupuesto
    GROUP BY P.IdPresupuesto, P.Cliente, P.Total, P.Fecha
    ORDER BY P.Fecha DESC;
END;
GO

-- Crear Presupuesto (OPENJSON + Transacción + Validaciones + 2 OUTPUT)
CREATE OR ALTER PROCEDURE dbo.usp_CrearPresupuesto
    @Cliente NVARCHAR(80),
    @Items   NVARCHAR(MAX),
    @IdPresupuesto INT OUTPUT,
    @Total DECIMAL(12, 2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Cliente IS NULL OR LTRIM(RTRIM(@Cliente)) = N''
        BEGIN
            ;THROW 50020, N'El nombre del cliente no puede estar vacío.', 1;
        END;

        /* El carrito JSON, convertido en una tabla temporal */
        DECLARE @Carrito TABLE (
            IdMaterial INT,
            Cantidad   INT
        );

        INSERT INTO @Carrito (IdMaterial, Cantidad)
        SELECT IdMaterial, Cantidad
        FROM OPENJSON(@Items)
            WITH (
                IdMaterial INT '$.id',
                Cantidad   INT '$.cantidad'
            );

        IF NOT EXISTS (SELECT 1 FROM @Carrito)
        BEGIN
            ;THROW 50031, N'El presupuesto no tiene items.', 1;
        END;

        IF EXISTS (SELECT 1 FROM @Carrito WHERE Cantidad IS NULL OR Cantidad <= 0)
        BEGIN
            ;THROW 50020, N'Todas las cantidades deben ser mayores a cero.', 1;
        END;

        /* ¿Existen todos los materiales? */
        IF EXISTS (
            SELECT 1
            FROM @Carrito AS C
            LEFT JOIN dbo.Materiales AS M ON M.IdMaterial = C.IdMaterial
            WHERE M.IdMaterial IS NULL
        )
        BEGIN
            ;THROW 50029, N'Algún material del carrito no existe.', 1;
        END;

        /* ¿Alcanza el stock de todos? */
        IF EXISTS (
            SELECT 1
            FROM @Carrito AS C
            INNER JOIN dbo.Materiales AS M ON M.IdMaterial = C.IdMaterial
            WHERE M.Stock < C.Cantidad
        )
        BEGIN
            ;THROW 50030, N'No hay stock suficiente de algún material.', 1;
        END;

        /* El total se calcula acá, con los precios de la TABLA */
        SELECT @Total = SUM(M.Precio * C.Cantidad)
        FROM @Carrito AS C
        INNER JOIN dbo.Materiales AS M ON M.IdMaterial = C.IdMaterial;

        INSERT INTO dbo.Presupuestos (Cliente, Total)
        VALUES (LTRIM(RTRIM(@Cliente)), @Total);

        SET @IdPresupuesto = SCOPE_IDENTITY();

        INSERT INTO dbo.DetallePresupuesto
            (IdPresupuesto, IdMaterial, Cantidad, PrecioUnitario)
        SELECT @IdPresupuesto, C.IdMaterial, C.Cantidad, M.Precio
        FROM @Carrito AS C
        INNER JOIN dbo.Materiales AS M ON M.IdMaterial = C.IdMaterial;

        /* El presupuesto reserva la mercadería: descuenta stock */
        UPDATE M
        SET M.Stock = M.Stock - C.Cantidad
        FROM dbo.Materiales AS M
        INNER JOIN @Carrito AS C ON C.IdMaterial = M.IdMaterial;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        ;THROW;
    END CATCH;
END;
GO
