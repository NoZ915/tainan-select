import { RequestHandler } from "express";
import CourseService from "../services/courseService";

export const getAllSemesters: RequestHandler = async (req, res): Promise<void> => {
  try {
    const semesters = await CourseService.getAllSemesters();
    res.status(200).json({
      items: semesters.sort((a, b) => b.localeCompare(a)),
    });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
