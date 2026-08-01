'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FeatureRequests', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      admin_reply: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      vote_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('FeatureRequests', ['status'], {
      name: 'idx_feature_requests_status',
    });
    await queryInterface.addIndex('FeatureRequests', ['vote_count'], {
      name: 'idx_feature_requests_vote_count',
    });

    await queryInterface.createTable('FeatureRequestVotes', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      feature_request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FeatureRequests',
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('FeatureRequestVotes', {
      fields: ['feature_request_id', 'user_id'],
      type: 'unique',
      name: 'uniq_feature_request_votes_request_user',
    });

    await queryInterface.addIndex('FeatureRequestVotes', ['feature_request_id'], {
      name: 'idx_feature_request_votes_request_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FeatureRequestVotes');
    await queryInterface.dropTable('FeatureRequests');
  },
};
