"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Courses", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      course_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      academy: {
        type: Sequelize.STRING(100),
      },
      instructor: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      instructor_url: {
        type: Sequelize.STRING(255),
      },
      course_room: {
        type: Sequelize.STRING(50),
      },
      course_time: {
        type: Sequelize.STRING(100),
      },
      course_url: {
        type: Sequelize.STRING(255),
      },
      credit_hours: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      semester: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("Courses");
  },
};