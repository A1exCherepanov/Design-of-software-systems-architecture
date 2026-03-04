function makeEachProductItemToucheble() {
  const productItems = document.querySelectorAll(".products_item");

  productItems.forEach((item) => {
    item.addEventListener("click", () => {
      productItems.forEach((item) => {
        item.classList.remove("products_item_active");
      });
      item.classList.add("products_item_active");
      checkActiveItem();
    });
  });
}

function checkActiveItem() {
  if (document.querySelector(".products_item_active")) {
    document.getElementById("addToCartButton").style.visibility = "visible";
  } else {
    document.getElementById("addToCartButton").style.visibility = "hidden";
  }
}
