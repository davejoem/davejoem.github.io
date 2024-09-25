var date = document.getElementById('now');
var now = new Date(Date.now());
var year = now.getFullYear();
date.innerHTML = year;