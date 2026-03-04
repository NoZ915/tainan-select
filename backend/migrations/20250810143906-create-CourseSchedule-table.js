'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CourseSchedules', {
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
      day: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      start_period: {
        type: Sequelize.STRING(1),
        allowNull: false,
      },
      span: {
        type: Sequelize.TINYINT,
        allowNull: false,
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

    await queryInterface.addIndex('CourseSchedules', ['course_id'], {
      name: 'idx_course_schedules_course_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('CourseSchedules', 'idx_course_schedules_course_id');
    await queryInterface.dropTable('CourseSchedules');
  }
};