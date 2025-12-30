'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Whitelists', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      student_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // email index (unique)
    await queryInterface.addIndex('Whitelists', ['email'], {
      unique: true,
      name: 'uniq_whitelists_email',
    });

    // student_id index（不 unique，純加速查詢）
    await queryInterface.addIndex('Whitelists', ['student_id'], {
      name: 'idx_whitelists_student_id',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Whitelists');
  },
};
