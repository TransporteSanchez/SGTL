function loadHeader() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "views/header.html");
  xhr.onload = function() {
    if (xhr.status === 200) {
      document.getElementById("header-container").innerHTML = xhr.responseText;
    }
  };
  xhr.send();
}