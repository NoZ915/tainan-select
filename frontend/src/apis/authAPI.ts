import { AuthStatusResponse } from "../types/authType";
import { axiosInstance } from "./axiosInstance";

export const getAuthStatus = async (): Promise<AuthStatusResponse> => {
  const response = await axiosInstance.get("/auth/status", { withCredentials: true });
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await axiosInstance.post("/auth/logout");
};
