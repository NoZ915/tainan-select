import { RequestHandler } from "express";
import ReviewService from "../services/reviewService";
import ReviewReactionService from "../services/reviewReactionService";
import ReviewCommentService from "../services/reviewCommentService";

type CourseParams = { course_id: string };
type ReviewParams = { review_id: string };
type ReviewCommentParams = { review_id: string; comment_id: string };

export const getAllReviewsByCourseId: RequestHandler<CourseParams> = async (
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

export const getAllReviewsByUserId: RequestHandler = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user_id = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const reviews = await ReviewService.getAllReviewsByUserId(user_id, limit, offset);
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err });
  }
}

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

export const deleteReview: RequestHandler<ReviewParams> = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const review_id = parseInt(req.params.review_id);
    const user_id = req.user.id;

    await ReviewService.deleteReview(review_id, user_id);
    res.status(200).json({ message: "Delete review successful" })
  } catch (err) {
    res.status(500).json({ message: err });
  }
}

export const getLatestReviews: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const latestReviews = await ReviewService.getLatestReviews(user_id);
    res.status(200).json(latestReviews);
  } catch (err) {
    res.status(500).json({ message: err });
  }
}

export const getReviewReactions: RequestHandler<ReviewParams> = async (req, res): Promise<void> => {
  try {
    const review_id = parseInt(req.params.review_id);
    if (Number.isNaN(review_id)) {
      res.status(400).json({ message: "Invalid review_id" });
      return;
    }

    const user_id = req.user?.id;
    const result = await ReviewReactionService.getReviewReactions(review_id, user_id);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Review not found") {
      res.status(404).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: err });
  }
}

export const toggleReviewReaction: RequestHandler<ReviewParams> = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const review_id = parseInt(req.params.review_id);
    const { key } = req.body;
    if (Number.isNaN(review_id)) {
      res.status(400).json({ message: "Invalid review_id" });
      return;
    }
    if (typeof key !== "string" || key.trim() === "") {
      res.status(400).json({ message: "Invalid reaction key" });
      return;
    }

    const result = await ReviewReactionService.toggleReaction(review_id, req.user.id, key.trim());
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Review not found") {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err.message === "REACTION_PRESET_NOT_FOUND" || err.message === "REACTION_PRESET_INACTIVE") {
        res.status(400).json({ message: err.message });
        return;
      }
    }
    res.status(500).json({ message: err });
  }
}

export const getReviewComments: RequestHandler<ReviewParams> = async (req, res): Promise<void> => {
  try {
    const review_id = parseInt(req.params.review_id);
    if (Number.isNaN(review_id)) {
      res.status(400).json({ message: "Invalid review_id" });
      return;
    }

    const user_id = req.user?.id;
    const comments = await ReviewCommentService.getCommentsByReviewId(review_id, user_id);
    res.status(200).json(comments);
  } catch (err) {
    if (err instanceof Error && err.message === "Review not found") {
      res.status(404).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: err });
  }
}

export const createReviewComment: RequestHandler<ReviewParams> = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const review_id = parseInt(req.params.review_id);
    if (Number.isNaN(review_id)) {
      res.status(400).json({ message: "Invalid review_id" });
      return;
    }

    const { content } = req.body;
    if (typeof content !== "string") {
      res.status(400).json({ message: "Invalid content" });
      return;
    }

    await ReviewCommentService.createComment(review_id, req.user.id, content);
    res.status(201).json({ message: "Create review comment successful" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Review not found") {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err.message === "COMMENT_EMPTY" || err.message === "COMMENT_TOO_LONG") {
        res.status(400).json({ message: err.message });
        return;
      }
    }
    res.status(500).json({ message: err });
  }
}

export const deleteReviewComment: RequestHandler<ReviewCommentParams> = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const review_id = parseInt(req.params.review_id);
    const comment_id = parseInt(req.params.comment_id);
    if (Number.isNaN(review_id) || Number.isNaN(comment_id)) {
      res.status(400).json({ message: "Invalid params" });
      return;
    }

    await ReviewCommentService.deleteComment(review_id, comment_id, req.user.id);
    res.status(200).json({ message: "Delete review comment successful" });
  } catch (err) {
    if (err instanceof Error && err.message === "COMMENT_NOT_FOUND") {
      res.status(404).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: err });
  }
}

export const updateReviewComment: RequestHandler<ReviewCommentParams> = async (req, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const review_id = parseInt(req.params.review_id);
    const comment_id = parseInt(req.params.comment_id);
    if (Number.isNaN(review_id) || Number.isNaN(comment_id)) {
      res.status(400).json({ message: "Invalid params" });
      return;
    }

    const { content } = req.body;
    if (typeof content !== "string") {
      res.status(400).json({ message: "Invalid content" });
      return;
    }

    await ReviewCommentService.updateComment(review_id, comment_id, req.user.id, content);
    res.status(200).json({ message: "Update review comment successful" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "COMMENT_NOT_FOUND") {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err.message === "COMMENT_EMPTY" || err.message === "COMMENT_TOO_LONG") {
        res.status(400).json({ message: err.message });
        return;
      }
    }
    res.status(500).json({ message: err });
  }
}
