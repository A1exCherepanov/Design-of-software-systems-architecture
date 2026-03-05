function fetchData(activeBtnId) {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<p style='text-align:center;padding:40px;color:#999;'>Загрузка...</p>";

  fetch(`${API_BASE_URL}/${activeBtnId}`)
    .then((res) => res.json())
    .then((data) => (productsContainer.innerHTML = data))
    .then(() => makeEachProductItemToucheble())
    .then(() => checkActiveItem())
    .catch((error) => {
      console.error("Ошибка при получении данных с сервера:", error);
      productsContainer.innerHTML = "<p style='text-align:center;padding:40px;color:red;'>Ошибка загрузки данных. Убедитесь, что все сервисы запущены.</p>";
    });
}
