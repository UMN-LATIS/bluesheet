import axios from "axios";

const token = document.head.querySelector('meta[name="csrf-token"]');

if (!token) {
  console.error(
    "CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token",
  );
}

const axiosInstance = axios.create({
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "X-CSRF-TOKEN": token ? token.content : undefined,
  },
});

window.axios = axiosInstance;

export default axiosInstance;
