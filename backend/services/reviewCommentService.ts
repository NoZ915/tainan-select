import ReviewCommentRepository from '../repositories/reviewCommentRepository'
import ReviewRepository from '../repositories/reviewRepository'
import { ReviewCommentResponse } from '../types/review'

const MAX_REVIEW_COMMENT_LENGTH = 500

class ReviewCommentService {
  async getCommentsByReviewId(review_id: number, user_id?: number): Promise<ReviewCommentResponse[]> {
    await ReviewRepository.ensureReviewExists(review_id)
    return await ReviewCommentRepository.getCommentsByReviewId(review_id, user_id)
  }

  async createComment(review_id: number, user_id: number, content: string): Promise<void> {
    await ReviewRepository.ensureReviewExists(review_id)

    const normalizedContent = content.trim()
    if (!normalizedContent) {
      throw new Error('COMMENT_EMPTY')
    }

    if (normalizedContent.length > MAX_REVIEW_COMMENT_LENGTH) {
      throw new Error('COMMENT_TOO_LONG')
    }

    await ReviewCommentRepository.createComment(review_id, user_id, normalizedContent)
  }

  async deleteComment(review_id: number, comment_id: number, user_id: number): Promise<void> {
    await ReviewCommentRepository.deleteComment(review_id, comment_id, user_id)
  }

  async updateComment(review_id: number, comment_id: number, user_id: number, content: string): Promise<void> {
    const normalizedContent = content.trim()
    if (!normalizedContent) {
      throw new Error('COMMENT_EMPTY')
    }

    if (normalizedContent.length > MAX_REVIEW_COMMENT_LENGTH) {
      throw new Error('COMMENT_TOO_LONG')
    }

    await ReviewCommentRepository.updateComment(review_id, comment_id, user_id, normalizedContent)
  }
}

export default new ReviewCommentService()
