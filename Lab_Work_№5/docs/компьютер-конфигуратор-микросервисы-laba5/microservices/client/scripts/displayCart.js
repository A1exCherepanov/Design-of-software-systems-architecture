function showCart() {
  const cartItemsJson = localStorage.getItem("cart");
  let cartItems = {};
  if (cartItemsJson) cartItems = JSON.parse(cartItemsJson);

  let cartHtml = "";
  for (const key in cartItems) {
    if (cartItems.hasOwnProperty(key)) {
      const item = cartItems[key];
      cartHtml += `
        <div class="cart_item" id="${key}">
            <h3>${item.title}</h3>
            <img src="${item.imageSrc}" alt="" width="120">
            <p>${item.price} руб.</p>
            <div class="cart_item_flex">
              <a href="${item.href}">На сайт</a>
              <button class="remove_from_cart_btn">Удалить из корзины</button>
            </div>
        </div>
      `;
    }
  }

  if (!cartHtml) {
    cartHtml = "<p style='color:#999;text-align:center;padding:40px;'>Корзина пуста</p>";
  }

  document.querySelector(".cart").innerHTML = cartHtml;
  countTotalPrice(cartItems);
  addRemoveButtons();
}

function countTotalPrice(cartItems) {
  let totalPrice = 0;
  for (const key in cartItems) {
    const item = cartItems[key];
    if (cartItems.hasOwnProperty(key)) {
      totalPrice += Number(item.price);
    }
  }
  document.querySelector(".price").innerHTML =
    "Итоговая стоимость: " + totalPrice + " руб.";
}

function addRemoveButtons() {
  const removeButtons = document.querySelectorAll(".remove_from_cart_btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", removeFromCart);
  });
}

function removeFromCart(event) {
  const item = event.target.closest(".cart_item");
  if (item) {
    const cartItemsJson = localStorage.getItem("cart");
    let cartItems = {};
    if (cartItemsJson) {
      cartItems = JSON.parse(cartItemsJson);
    }
    delete cartItems[item.id];
    localStorage.setItem("cart", JSON.stringify(cartItems));
    item.remove();
    countTotalPrice(cartItems);
  }
}

document.addEventListener("DOMContentLoaded", showCart);
document.addEventListener("DOMContentLoaded", addRemoveButtons);
