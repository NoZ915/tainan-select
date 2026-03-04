'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Timetables', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      semester: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('Timetables', ['user_id', 'semester'], {
      name: 'uniq_timetables_user_semester',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Timetables', 'uniq_timetables_user_semester');
    await queryInterface.dropTable('Timetables');
  },
};
