verListado();


function salir ()

function limpiar()
{
    localStorage.removeItem("Matrícula");
    localStorage.removeItem("Nombre y Apellido");
    localStorage.removeItem("Materia");
    localStorage.removeItem("Ciclo Lectivo");
    localStorage.removeItem("Nota Parcial 1");
    localStorage.removeItem("Nota Parcial 2");
    localStorage.removeItem("Nota Práctico");  

    const tbody = document.querySelector("tbody");
    tbody.innerHTML= "";
    
}
