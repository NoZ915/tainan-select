import { RequestHandler } from "express";
import ReviewService from "../services/reviewService";

export const getAllReviewsByCourseId: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const course_id = parseInt(req.params.course_id);
    const reviews = await ReviewService.getAllReviewsByCourseId(course_id, user_id);
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const upsertReview: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const user_id = req.user.id;
    const { course_id, gain, sweetness, coolness, comment } = req.body;
    await ReviewService.upsertReview({
      user_id,
      course_id,
      gain,
      sweetness,
      coolness,
      comment
    });
    res.status(200).json({ message: "Upsert review successful" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const deleteReview: RequestHandler = async (req, res): Promise<void> => {
  try{
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const review_id  = parseInt(req.params.review_id);
    const user_id = req.user.id;

    await ReviewService.deleteReview(review_id, user_id);
    res.status(200).json({ message: "Delete review successful" })
  }catch(err){
    res.status(500).json({ message: err });
  }
}

export const getLatestReviews: RequestHandler = async (req, res): Promise<void> => {
  try{
    const user_id = req.user?.id;
    const latestReviews = await ReviewService.getLatestReviews(user_id);
    res.status(200).json(latestReviews);
  }catch(err){
    res.status(500).json({ message: err });
  }
}