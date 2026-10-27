const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const controladores = path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers');
const configuracion = fs.readFileSync(path.join(controladores, 'FacturacionConfiguracionController.cs'), 'utf8');
const comprobantes = fs.readFileSync(path.join(controladores, 'ComprobantesController.cs'), 'utf8');

function bloque(fuente, desde, hasta) {
    const inicio = fuente.indexOf(desde);
    assert.ok(inicio >= 0, 'falta ' + desde);
    const fin = hasta ? fuente.indexOf(hasta, inicio + desde.length) : fuente.length;
    assert.ok(fin > inicio, 'falta el cierre de ' + desde);
    return fuente.slice(inicio, fin);
}

function probarTiposDeCreditoDisponibles() {
    const opciones = bloque(configuracion, 'Route("tipos-emision-credito")', 'Route("emision/{tipo}")');
    const consulta = opciones.match(/new SqlCommand\(@"([\s\S]*?)", c\)/);
    assert.ok(consulta, 'falta la consulta de tipos de crédito configurados');

    const db = new DatabaseSync(':memory:');
    try {
        db.exec(`
            ATTACH DATABASE ':memory:' AS dbo;
            CREATE TABLE dbo.TIPOS_COMPROBANTE (Tipo TEXT, Descripcion TEXT, Impacto TEXT);
            CREATE TABLE dbo.FACTURACION_TIPOS_COMPROBANTE (Tipo TEXT, Activo INTEGER, NumeradorID INTEGER, SucursalID INTEGER);
            CREATE TABLE dbo.FACTURACION_NUMERADORES (Numerador_ID INTEGER, Activo INTEGER, UltimoNumero INTEGER);
            CREATE TABLE dbo.FACTURACION_SUCURSALES (Sucursal_ID INTEGER, Activa INTEGER);
            INSERT INTO dbo.TIPOS_COMPROBANTE VALUES
                ('CI','Crédito interno','C'),('NC','Nota de crédito','C'),('REC','Recibo','C'),
                ('CX','Crédito inactivo','C'),('CN','Crédito con numerador inactivo','C'),
                ('CS','Crédito con sucursal inactiva','C'),('CA','Crédito agotado','C'),
                ('FC','Factura interna','D');
            INSERT INTO dbo.FACTURACION_NUMERADORES VALUES
                (1,1,4),(2,1,8),(3,0,2),(4,1,99999999);
            INSERT INTO dbo.FACTURACION_SUCURSALES VALUES (1,1),(2,0);
            INSERT INTO dbo.FACTURACION_TIPOS_COMPROBANTE VALUES
                ('CI',1,1,1),('CI',1,2,1),('NC',1,1,1),('REC',1,1,1),
                ('CX',0,1,1),('CN',1,3,1),('CS',1,1,2),('CA',1,4,1),('FC',1,1,1);
        `);
        const tipos = db.prepare(consulta[1]).all().map(fila => fila.Tipo);
        assert.deepStrictEqual(tipos, ['CI', 'NC'],
            'la cancelación ofrece créditos internos y NC activos, una sola vez por sigla; excluye recibos y configuraciones inválidas');
    } finally {
        db.close();
    }
}

function probarCancelacionPorImpactoYProforma() {
    const obtener = bloque(comprobantes, 'public IHttpActionResult ObtenerFacturaCancelatoria(', '[HttpPost]');
    assert.match(obtener, /FacturaTipo\s*=\s*factura\.Tipo/,
        'el GET identifica la sigla real del comprobante vinculado');

    const emitir = bloque(comprobantes, 'public IHttpActionResult Emitir(');
    assert.match(emitir, /bool cancelatorioProforma\s*=\s*request\.ProformaID\.HasValue/,
        'la cancelatoria se identifica por el vínculo con la proforma');
    assert.match(emitir, /cancelatorioProforma\s*\?\s*"C"/,
        'un crédito cancelatorio configurable registra impacto C');
    assert.match(emitir, /if\s*\(cancelatorioProforma\)\s*permiso\s*=\s*"NC_EMITIR"/,
        'el crédito cancelatorio requiere permiso de emisión de crédito');
    assert.match(emitir, /configuracion\.Impacto\s*!=\s*impacto/,
        'el servidor contrasta el impacto con el tipo configurado');
    assert.match(emitir, /cancelatorioProforma\s*\?\s*null\s*:\s*request\.FechaVencimiento/,
        'el crédito cancelatorio no tiene vencimiento');
    assert.match(emitir, /cancelatorioProforma\s*&&\s*request\.Aplicaciones\.Count\s*>\s*0/,
        'no admite aplicaciones elegidas por el cliente');
    assert.match(emitir, /request\.Tipo\s*==\s*"NC"\s*\|\|\s*cancelatorioProforma\s*\?\s*request\.IVA\.Value\s*:\s*Redondear/,
        'el crédito cancelatorio conserva el IVA exacto de la factura, aunque los renglones tengan distintos redondeos');
    assert.match(emitir, /if\s*\(cancelatorioProforma\)[\s\S]*?LeerFacturaReferencia/,
        'la referencia de la cancelatoria se lee para cualquier sigla de crédito');
    assert.match(emitir, /request\.Neto\s*!=\s*netoPendiente[\s\S]*?total\s*!=\s*referencia\.Pendiente/,
        'la API exige la composición y el total exactos del comprobante original');
    assert.match(emitir, /referencia\.Aplicado\s*!=\s*0/,
        'la cancelación total se bloquea si ya existen aplicaciones');
    assert.match(emitir, /if\s*\(impacto\s*==\s*"C"\)[\s\S]*?INSERT dbo\.CUENTA_CORRIENTE_APLICACIONES/,
        'el crédito configurable aplica el total contra el comprobante de deuda');
    assert.match(emitir, /if\s*\(cancelatorioProforma\)[\s\S]*?UPDATE dbo\.COMPROBANTES_PROFORMAS/,
        'el crédito configurable desvincula la proforma y libera sus viajes');
    assert.match(emitir, /bool notaCreditoCorriente\s*=\s*request\.Tipo\s*==\s*"NC"\s*&&\s*!cancelatorioProforma/,
        'la NC corriente mantiene su flujo separado');
}

probarTiposDeCreditoDisponibles();
probarCancelacionPorImpactoYProforma();
console.log('OK: crédito interno cancelatorio configurable en API');
