"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Reviews", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      course_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Courses",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      gain: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        validate: {
          min: 1.0,
          max: 5.0,
        },
      },
      sweetness: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        validate: {
          min: 1.0,
          max: 5.0,
        },
      },
      coolness: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        validate: {
          min: 1.0,
          max: 5.0,
        },
      },
      comment: {
        type: Sequelize.TEXT,
      },
      favorites: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

  async down(queryInterface) {
    // await queryInterface.dropTable("Reviews");
  },
};
