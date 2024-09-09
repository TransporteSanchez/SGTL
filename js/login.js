login()

function login() {

    const username = document.getElementById('username')
    const password = document.getElementById('password')
    const button = document.getElementById('button')

    button.addEventListener('click', (e) => {
        e.preventDefault()
        const data = {
            username: username.value,
            password: password.value
        }

        console.log(data)
    })

    if (username.value == "mferrando" && password.value == "sistemas3")
    {
        onclick=window.location.href = 'Index.html';
    }

    else if (username.value == "mbarrionuevo" && password.value == "programacion3")
    {
        onclick=window.location.href = 'Index.html';
    }

    else if (username.value == "analista" && password.value == "analista")
    {
        onclick=window.location.href = 'Index.html';
    }

    else{
        alert("Usuario o contraseña incorrecto");
    }

}
