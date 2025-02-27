import CourseService from "../services/courseService"
import { Request, RequestHandler, Response } from "express";

export const getAllCourses: RequestHandler = async (req, res): Promise<void> => {
  try {
    const courses = await CourseService.getAllCourses();
    res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ message: err });
  }
}