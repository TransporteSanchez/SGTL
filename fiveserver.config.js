// Five Server (la VM lo usa en el puerto 5500): que no recargue el navegador cuando la API escribe en su carpeta (el log
// de WhatsApp en App_Data, la compilación en bin y obj). Es lo mismo que liveServer.settings.ignoreFiles de
// .vscode/settings.json, que Five Server no lee (reporte de la VM del 25/10, F3). Live Server (5502) sigue con lo suyo.
module.exports = {
    ignore: ['**/App_Data/**', '**/bin/**', '**/obj/**', '**/.vs/**', '.vscode/**'],
    ignorePattern: /[\\/](App_Data|bin|obj|\.vs|\.vscode)[\\/]/
};
