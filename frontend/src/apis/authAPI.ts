import { AuthStatusResponse } from "../types/authType";
import { axiosInstance } from "./axiosInstance";

export const getAuthStatus = async (): Promise<AuthStatusResponse> => {
  const response = await axiosInstance.get("/auth/status");
  return response.data;
};

export const checkAuthStatus = async (): Promise<{ authenticated: boolean }> => {
  const response = await axiosInstance.get("/auth/checkStatus");
  return response.data;
}

export const logoutUser = async (): Promise<void> => {
  await axiosInstance.post("/auth/logout");
};
