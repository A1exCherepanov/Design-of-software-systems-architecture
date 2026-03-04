document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".btn");

  buttons.forEach((button) => {
    button.addEventListener("click", function (event) {
      buttons.forEach((btn) => btn.classList.remove("btn-active"));
      this.classList.add("btn-active");
      const activeBtnId = event.target.id;
      fetchData(activeBtnId);
    });
  });

  const activeBtnId = document.querySelector(".btn-active").id;
  fetchData(activeBtnId);
});

document.addEventListener("DOMContentLoaded", function () {
  const productItems = document.querySelectorAll(".products_item");

  function toggleActiveClass() {
    productItems.forEach((item) => {
      item.classList.remove("products_item_active");
    });
    this.classList.add("products_item_active");
  }

  productItems.forEach((item) =>
    item.addEventListener("click", toggleActiveClass)
  );
});
