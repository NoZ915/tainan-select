import ReviewCommentModel from '../models/ReviewComment'
import UserModel from '../models/Users'
import { ReviewCommentResponse } from '../types/review'
import { col, fn, Op } from 'sequelize'

type ReviewCommentWithUser = ReviewCommentModel & {
  UserModel?: {
    name?: string
    avatar?: string | null
  }
}

class ReviewCommentRepository {
  async getCommentCountByReviewIds(review_ids: number[]): Promise<Map<number, number>> {
    const countMap = new Map<number, number>()
    if (review_ids.length === 0) return countMap

    const rows = await ReviewCommentModel.findAll({
      where: { review_id: { [Op.in]: review_ids } },
      attributes: ['review_id', [fn('COUNT', col('id')), 'comment_count']],
      group: ['review_id'],
      raw: true,
    }) as unknown as Array<{ review_id: number; comment_count: string }>

    rows.forEach((row) => {
      countMap.set(Number(row.review_id), Number(row.comment_count))
    })
    return countMap
  }

  async getCommentsByReviewId(review_id: number, user_id?: number): Promise<ReviewCommentResponse[]> {
    const comments = await ReviewCommentModel.findAll({
      where: { review_id },
      order: [['created_at', 'ASC']],
      include: [
        {
          model: UserModel,
          attributes: ['name', 'avatar'],
        },
      ],
    })

    return (comments as unknown as ReviewCommentWithUser[]).map((comment) => {
      const commentJson = comment.toJSON() as ReviewCommentModel['dataValues'] & {
        UserModel?: ReviewCommentResponse['UserModel']
      }
      const { user_id: _userId, ...commentWithoutUserId } = commentJson
      return {
        ...commentWithoutUserId,
        is_owner: user_id !== undefined && comment.user_id === user_id,
      }
    })
  }

  async createComment(review_id: number, user_id: number, content: string): Promise<void> {
    await ReviewCommentModel.create({ review_id, user_id, content })
  }

  async deleteComment(review_id: number, comment_id: number, user_id: number): Promise<void> {
    const deleted = await ReviewCommentModel.destroy({
      where: {
        id: comment_id,
        review_id,
        user_id,
      },
    })

    if (deleted === 0) {
      throw new Error('COMMENT_NOT_FOUND')
    }
  }

  async updateComment(review_id: number, comment_id: number, user_id: number, content: string): Promise<void> {
    const [updatedCount] = await ReviewCommentModel.update(
      { content },
      {
        where: {
          id: comment_id,
          review_id,
          user_id,
        },
      }
    )

    if (updatedCount === 0) {
      throw new Error('COMMENT_NOT_FOUND')
    }
  }
}

export default new ReviewCommentRepository()
