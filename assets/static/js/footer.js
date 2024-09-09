function loadFooter() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "views/footer.html");
    xhr.onload = function() {
      if (xhr.status === 200) {
        document.getElementById("footer-container").innerHTML = xhr.responseText;
      }
    };
    xhr.send();
  }