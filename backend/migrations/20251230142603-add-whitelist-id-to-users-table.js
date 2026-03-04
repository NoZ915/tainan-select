'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'whitelist_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Whitelists',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('Users', ['whitelist_id'], {
      name: 'idx_users_whitelist_id',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Users', 'idx_users_whitelist_id');
    await queryInterface.removeColumn('Users', 'whitelist_id');
  },
};
