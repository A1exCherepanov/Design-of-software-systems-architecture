const token = localStorage.getItem("token") || "";
const requestOptions = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
};

fetch(`${API_BASE_URL}/verify-token`, requestOptions).then((res) => {
  if (!res.ok) window.location.href = "sign-in.html";
});
