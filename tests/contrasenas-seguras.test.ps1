$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent $PSScriptRoot
$fuente = Join-Path $raiz 'WebApi_TransporteSanchez\Security\ContrasenasSeguras.cs'

if (-not (Test-Path $fuente)) {
    throw "No existe la utilidad de contraseñas seguras: $fuente"
}

Add-Type -Path $fuente

function Assert-True([bool] $condicion, [string] $mensaje) {
    if (-not $condicion) {
        throw $mensaje
    }
}

$contrasenaPrueba = 'Prueba9X'
$primerHash = [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::CrearHash($contrasenaPrueba)
$segundoHash = [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::CrearHash($contrasenaPrueba)

Assert-True ($primerHash -ne $segundoHash) 'Dos hashes del mismo valor deben usar sales diferentes.'
Assert-True ($primerHash.StartsWith('PBKDF2-SHA256$600000$')) 'El hash debe incluir algoritmo e iteraciones.'
Assert-True ([WebApi_TransporteSanchez.Security.ContrasenasSeguras]::EsHashVigente($primerHash)) 'El formato PBKDF2 debe reconocerse como vigente.'
Assert-True ([WebApi_TransporteSanchez.Security.ContrasenasSeguras]::Verificar($contrasenaPrueba, $primerHash)) 'El hash debe verificar el valor original.'
Assert-True (-not [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::Verificar('OtraPrueba9X', $primerHash)) 'El hash no debe verificar un valor distinto.'
Assert-True (-not [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::EsHashVigente($contrasenaPrueba)) 'Un valor heredado no debe reconocerse como hash vigente.'
Assert-True ([WebApi_TransporteSanchez.Security.ContrasenasSeguras]::Verificar($contrasenaPrueba, $contrasenaPrueba)) 'La comparación heredada debe aceptar el valor correcto durante la transición.'
$hashMalformado = 'PBKDF2-SHA256$1$sal$hash'
Assert-True (-not [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::Verificar($hashMalformado, $hashMalformado)) 'Un hash malformado no debe aceptarse como contraseña heredada.'

$mensaje = ''
Assert-True ([WebApi_TransporteSanchez.Security.ContrasenasSeguras]::CumplePolitica($contrasenaPrueba, [ref] $mensaje)) 'La contraseña de prueba debe cumplir la política.'
Assert-True (-not [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::CumplePolitica('SinNumeros', [ref] $mensaje)) 'La política debe exigir un número.'
Assert-True (-not [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::CumplePolitica('12345678', [ref] $mensaje)) 'La política debe exigir una letra.'
Assert-True (-not [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::CumplePolitica('C1ave', [ref] $mensaje)) 'La política debe exigir al menos ocho caracteres.'
Assert-True (-not [WebApi_TransporteSanchez.Security.ContrasenasSeguras]::CumplePolitica('Clave123456789012345678', [ref] $mensaje)) 'La política debe limitar la longitud máxima.'

Write-Output 'OK: hashes seguros, migración heredada y política verificados.'
