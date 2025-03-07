import axios from "axios";
import "dotenv/config";

export const axiosInstance = axios.create({
  baseURL: process.env.VITE_API_BASE_URL
});
console.log(process.env.VITE_API_BASE_URL);