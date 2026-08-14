"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Courses", "cour_no", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn("Courses", "course_dep_code", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addIndex("Courses", ["cour_no", "course_dep_code", "semester"], {
      name: "idx_courses_identity",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("Courses", "idx_courses_identity");
    await queryInterface.removeColumn("Courses", "course_dep_code");
    await queryInterface.removeColumn("Courses", "cour_no");
  },
};
