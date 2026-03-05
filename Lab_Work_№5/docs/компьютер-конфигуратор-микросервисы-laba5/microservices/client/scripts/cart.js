function addProductToCart() {
  const addToCartButton = document.getElementById("addToCartButton");

  addToCartButton.addEventListener("click", function () {
    const productItem = document.querySelector(".products_item_active");
    if (!productItem) {
      alert("Выберите товар, чтобы добавить его в корзину.");
      return;
    }

    const id = productItem.id;
    const price = productItem.getAttribute("price");
    const title = productItem.querySelector(".products_item_title").textContent;
    const imageSrc = productItem.querySelector("img").src;
    const href = productItem.querySelector(".products_item_link").href;

    let cart = JSON.parse(localStorage.getItem("cart")) || {};
    cart[id] = { title, price, imageSrc, href };

    localStorage.setItem("cart", JSON.stringify(cart));
    checkCartAndShowButton();
  });
}

function checkCartAndShowButton() {
  refreshShowCartButton();
  if (localStorage.getItem("cart")) {
    const cart = JSON.parse(localStorage.getItem("cart"));
    if (Object.keys(cart).length > 0) {
      document.getElementById("showCartButton").style.visibility = "visible";
    }
  }
}

function refreshShowCartButton() {
  const cart = JSON.parse(localStorage.getItem("cart")) || {};
  const cartButton = document.getElementById("showCartButton");
  if (cartButton) {
    cartButton.setAttribute("data-count", Object.keys(cart).length);
  }
}

document.addEventListener("DOMContentLoaded", addProductToCart);
document.addEventListener("DOMContentLoaded", checkCartAndShowButton);
