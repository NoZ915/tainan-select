'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 重新命名欄位 request_count -> interests_count
    await queryInterface.renameColumn('Courses', 'request_count', 'interests_count');
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.renameColumn('Courses', 'interests_count', 'request_count');
  }
};
