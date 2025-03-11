import CourseService from "../services/courseService"
import { Request, RequestHandler, Response } from "express";

export const getAllCourses: RequestHandler = async (req, res): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search ? (req.query.search as string).trim() : "";

    const { courses, total } = await CourseService.getAllCourses({ page, limit, offset, search });
    res.status(200).json({
      courses,
      pagination: {
        countPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    res.status(500).json({ message: err });
  }
}