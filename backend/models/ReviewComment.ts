import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional,
} from 'sequelize'
import db from './index'
import ReviewModel from './Review'
import UserModel from './Users'

interface ReviewCommentCreationAttributes
  extends Optional<InferCreationAttributes<ReviewCommentModel>, 'id' | 'created_at' | 'updated_at'> {}

class ReviewCommentModel extends Model<
  InferAttributes<ReviewCommentModel>,
  ReviewCommentCreationAttributes
> {
  declare id: number
  declare review_id: number
  declare user_id: number
  declare content: string
  declare created_at: Date
  declare updated_at: Date
}

ReviewCommentModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db.sequelize,
    tableName: 'ReviewComments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

ReviewCommentModel.belongsTo(ReviewModel, { foreignKey: 'review_id' })
ReviewModel.hasMany(ReviewCommentModel, { foreignKey: 'review_id' })

ReviewCommentModel.belongsTo(UserModel, { foreignKey: 'user_id' })
UserModel.hasMany(ReviewCommentModel, { foreignKey: 'user_id' })

export default ReviewCommentModel
