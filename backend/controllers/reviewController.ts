import { RequestHandler } from "express";
import RreviewService from "../services/reviewService";

export const getAllReviewsByCourseId: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const course_id = parseInt(req.params.course_id);
    const reviews = await RreviewService.getAllReviewsByCourseId(course_id);
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const createReview: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = req.user.user_id;
    const { course_id, gain, sweetness, coolness, comment } = req.body;
    await RreviewService.createReview({
      user_id,
      course_id,
      gain,
      sweetness,
      coolness,
      comment
    });
    res.status(200).json({ message: "Create review successful" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
