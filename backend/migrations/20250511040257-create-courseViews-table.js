'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('CourseViews', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      course_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      viewed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  
    await queryInterface.addIndex('CourseViews', ['course_id', 'user_id', 'viewed_at'], {
      name: 'idx_course_user_viewed',
    });
  
    await queryInterface.addIndex('CourseViews', ['course_id', 'ip_address', 'user_agent', 'viewed_at'], {
      name: 'idx_course_ip_ua_viewed',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('CourseViews', 'idx_course_user_viewed');
    await queryInterface.removeIndex('CourseViews', 'idx_course_ip_ua_viewed');
    await queryInterface.dropTable('CourseViews');
  }
};
