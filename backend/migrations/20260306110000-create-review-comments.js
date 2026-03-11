'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReviewComments', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      review_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Reviews',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ReviewComments', ['review_id'], {
      name: 'idx_review_comments_review_id',
    });

    await queryInterface.addIndex('ReviewComments', ['user_id'], {
      name: 'idx_review_comments_user_id',
    });

    await queryInterface.addIndex('ReviewComments', ['review_id', 'created_at'], {
      name: 'idx_review_comments_review_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ReviewComments');
  },
};
