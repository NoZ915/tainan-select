import { RequestHandler } from "express";
import FeatureRequestService from "../services/featureRequestService";
import UserService from "../services/userService";
import { FEATURE_REQUEST_STATUSES, FeatureRequestStatus } from "../types/featureRequest";

type FeatureRequestParams = { id: string };

const ERROR_STATUS_MAP: Record<string, number> = {
  EMPTY_CONTENT: 400,
  CONTENT_TOO_LONG: 400,
  INVALID_STATUS: 400,
  ADMIN_REPLY_TOO_LONG: 400,
  FEATURE_REQUEST_NOT_FOUND: 404,
  FORBIDDEN: 403,
};

const ERROR_MESSAGE_MAP: Record<string, string> = {
  EMPTY_CONTENT: "許願內容不可為空",
  CONTENT_TOO_LONG: "許願內容長度過長",
  INVALID_STATUS: "狀態參數不正確",
  ADMIN_REPLY_TOO_LONG: "回覆內容長度過長",
  FEATURE_REQUEST_NOT_FOUND: "找不到此許願",
  FORBIDDEN: "沒有權限執行此操作",
};

const resolveError = (err: unknown, fallbackMessage: string): { status: number; message: string } => {
  const key = err instanceof Error ? err.message : undefined;
  if (key && ERROR_STATUS_MAP[key]) {
    return { status: ERROR_STATUS_MAP[key], message: ERROR_MESSAGE_MAP[key] };
  }
  return { status: 500, message: fallbackMessage };
};

export const getFeatureRequests: RequestHandler = async (req, res): Promise<void> => {
  try {
    const statusParam = req.query.status;
    const status = FEATURE_REQUEST_STATUSES.includes(statusParam as FeatureRequestStatus)
      ? (statusParam as FeatureRequestStatus)
      : undefined;

    const featureRequests = await FeatureRequestService.getAll(status, req.user?.id);
    res.status(200).json(featureRequests);
  } catch (err) {
    const { status, message } = resolveError(err, "取得功能許願列表失敗");
    res.status(status).json({ message });
  }
};

export const createFeatureRequest: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const content = typeof req.body?.content === "string" ? req.body.content : "";
    await FeatureRequestService.create(req.user.id, content);
    res.status(201).json({ message: "許願新增成功" });
  } catch (err) {
    const { status, message } = resolveError(err, "新增許願失敗");
    res.status(status).json({ message });
  }
};

export const toggleFeatureRequestVote: RequestHandler<FeatureRequestParams> = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const feature_request_id = parseInt(req.params.id);
    const result = await FeatureRequestService.toggleVote(feature_request_id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    const { status, message } = resolveError(err, "按讚失敗");
    res.status(status).json({ message });
  }
};

export const updateFeatureRequestStatus: RequestHandler<FeatureRequestParams> = async (req, res): Promise<void> => {
  try {
    const feature_request_id = parseInt(req.params.id);
    const status = typeof req.body?.status === "string" ? req.body.status : "";
    await FeatureRequestService.updateStatus(feature_request_id, status);
    res.status(200).json({ message: "狀態更新成功" });
  } catch (err) {
    const { status, message } = resolveError(err, "更新狀態失敗");
    res.status(status).json({ message });
  }
};

export const updateFeatureRequestAdminReply: RequestHandler<FeatureRequestParams> = async (req, res): Promise<void> => {
  try {
    const feature_request_id = parseInt(req.params.id);
    const adminReply = typeof req.body?.admin_reply === "string" ? req.body.admin_reply : "";
    await FeatureRequestService.updateAdminReply(feature_request_id, adminReply);
    res.status(200).json({ message: "回覆更新成功" });
  } catch (err) {
    const { status, message } = resolveError(err, "更新回覆失敗");
    res.status(status).json({ message });
  }
};

export const deleteFeatureRequest: RequestHandler<FeatureRequestParams> = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const feature_request_id = parseInt(req.params.id);
    const user = await UserService.getUserById(req.user.id);
    await FeatureRequestService.remove(feature_request_id, req.user.id, Boolean(user?.is_admin));
    res.status(200).json({ message: "刪除成功" });
  } catch (err) {
    const { status, message } = resolveError(err, "刪除許願失敗");
    res.status(status).json({ message });
  }
};