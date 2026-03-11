'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CourseRelatedPosts', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      course_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Courses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      source: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'dcard',
      },
      post_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      forum_alias: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'nutn',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      excerpt: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      post_url: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      created_at_source: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      matched_keywords: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      synced_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    await queryInterface.addIndex('CourseRelatedPosts', ['course_id'], {
      name: 'idx_course_related_posts_course_id',
    });

    await queryInterface.addIndex('CourseRelatedPosts', ['post_id'], {
      name: 'idx_course_related_posts_post_id',
    });

    await queryInterface.addIndex('CourseRelatedPosts', ['course_id', 'score'], {
      name: 'idx_course_related_posts_course_score',
    });

    await queryInterface.addConstraint('CourseRelatedPosts', {
      fields: ['course_id', 'source', 'post_id'],
      type: 'unique',
      name: 'uniq_course_related_posts_course_source_post',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CourseRelatedPosts');
  },
};
