document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch(`${API_BASE_URL}/sign-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status) {
        localStorage.setItem("token", data.token);
        window.location.href = "index.html";
      } else {
        alert(data.message);
      }
    })
    .catch((err) => {
      console.error("Ошибка:", err);
      alert("Ошибка подключения к серверу. Убедитесь, что сервисы запущены.");
    });
});
