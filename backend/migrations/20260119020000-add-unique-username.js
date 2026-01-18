'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Users', ['name'], {
      unique: true,
      name: 'uniq_users_name',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'uniq_users_name');
  },
};
