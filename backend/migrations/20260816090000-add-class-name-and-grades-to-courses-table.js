"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Courses", "class_name", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("Courses", "grades", {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Courses", "grades");
    await queryInterface.removeColumn("Courses", "class_name");
  },
};
