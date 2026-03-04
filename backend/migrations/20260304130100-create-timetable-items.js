'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TimetableItems', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      timetable_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Timetables',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      course_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Courses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('TimetableItems', ['timetable_id', 'course_id'], {
      name: 'uniq_timetable_items_timetable_course',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('TimetableItems', 'uniq_timetable_items_timetable_course');
    await queryInterface.dropTable('TimetableItems');
  },
};
