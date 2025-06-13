import axios from "axios";
import config from "../config.json";
import { logout } from "../services/user_service";

const api = axios.create({
  baseURL: `${config.bakendURL}/api`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(".otc");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



export default api;
