'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CourseViews', 'client_id', {
      type: Sequelize.STRING(36),
      allowNull: true,
      after: 'user_id',
    });

    await queryInterface.addIndex('CourseViews', ['course_id', 'client_id', 'viewed_at'], {
      name: 'idx_course_client_viewed',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('CourseViews', 'idx_course_client_viewed');
    await queryInterface.removeColumn('CourseViews', 'client_id');
  },
};
