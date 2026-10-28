// Five Server (el de la VM): en el puerto 5502, el mismo que Live Server en la Mac y en la máquina de Facu
// (.vscode/settings.json). Así el enlace del recupero de contraseña y la clave de Google Maps sirven en todas (Rocío,
// 28/10; antes la VM usaba el 5500). Y que no recargue el navegador cuando la API escribe en su carpeta (el log de
// WhatsApp en App_Data, la compilación en bin y obj): es lo mismo que liveServer.settings.ignoreFiles, que Five Server no
// lee (reporte de la VM del 25/10, F3).
module.exports = {
    port: 5502,
    ignore: ['**/App_Data/**', '**/bin/**', '**/obj/**', '**/.vs/**', '.vscode/**'],
    ignorePattern: /[\\/](App_Data|bin|obj|\.vs|\.vscode)[\\/]/
};
