'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("Courses", "review_count", {
      type: Sequelize.INTEGER, 
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.removeColumn("Courses", "review_count");
  }
};
