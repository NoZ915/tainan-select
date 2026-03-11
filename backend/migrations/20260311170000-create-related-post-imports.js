"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("RelatedPostImports", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      source_type: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      raw_payload: {
        type: Sequelize.TEXT("long"),
        allowNull: false,
      },
      parsed_payload: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      import_result_summary: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("RelatedPostImports", ["created_at"], {
      name: "idx_related_post_imports_created_at",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("RelatedPostImports");
  },
};
