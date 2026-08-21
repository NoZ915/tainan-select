'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GuestTimetableSnapshots', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      semester: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      course_ids: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      last_synced_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('GuestTimetableSnapshots', {
      fields: ['client_id', 'semester'],
      type: 'unique',
      name: 'uniq_guest_timetable_snapshots_client_semester',
    });

    await queryInterface.addIndex('GuestTimetableSnapshots', ['semester', 'last_synced_at'], {
      name: 'idx_guest_timetable_snapshots_semester_synced_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GuestTimetableSnapshots');
  },
};
