'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReactionPresets', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      label: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('unicode', 'image'),
        allowNull: false,
      },
      unicode: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      image_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.createTable('ReviewReactions', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      review_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Reviews',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      preset_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'ReactionPresets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('ReviewReactions', {
      fields: ['review_id', 'user_id', 'preset_id'],
      type: 'unique',
      name: 'uniq_review_reactions_review_user_preset',
    });

    await queryInterface.addIndex('ReviewReactions', ['review_id'], {
      name: 'idx_review_reactions_review_id',
    });
    await queryInterface.addIndex('ReviewReactions', ['user_id'], {
      name: 'idx_review_reactions_user_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ReviewReactions');
    await queryInterface.dropTable('ReactionPresets');
  },
};
