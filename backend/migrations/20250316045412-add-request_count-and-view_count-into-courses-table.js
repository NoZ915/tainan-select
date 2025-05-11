'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Courses', 'request_count', {
      type: Sequelize.INTEGER,
      allowNull: false, 
      defaultValue: 0, 
    });

    await queryInterface.addColumn('Courses', 'view_count', {
      type: Sequelize.INTEGER, 
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.removeColumn('Courses', 'request_count');
    // await queryInterface.removeColumn('Courses', 'view_count');
  }
};
