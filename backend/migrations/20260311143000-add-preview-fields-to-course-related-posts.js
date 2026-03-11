"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("CourseRelatedPosts", "preview_title", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("CourseRelatedPosts", "preview_description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("CourseRelatedPosts", "preview_image_url", {
      type: Sequelize.STRING(512),
      allowNull: true,
    });

    await queryInterface.addColumn("CourseRelatedPosts", "preview_site_name", {
      type: Sequelize.STRING(128),
      allowNull: true,
    });

    await queryInterface.addColumn("CourseRelatedPosts", "content", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("CourseRelatedPosts", "comments_json", {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("CourseRelatedPosts", "comments_json");
    await queryInterface.removeColumn("CourseRelatedPosts", "content");
    await queryInterface.removeColumn("CourseRelatedPosts", "preview_site_name");
    await queryInterface.removeColumn("CourseRelatedPosts", "preview_image_url");
    await queryInterface.removeColumn("CourseRelatedPosts", "preview_description");
    await queryInterface.removeColumn("CourseRelatedPosts", "preview_title");
  },
};
