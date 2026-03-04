'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('ReactionPresets', [
      { key: 'like', label: 'Like', type: 'unicode', unicode: '\u{1F44D}', image_path: null, sort_order: 10, is_active: true, created_at: now, updated_at: now },
      { key: 'heart', label: 'Heart', type: 'unicode', unicode: '\u{2764}\u{FE0F}', image_path: null, sort_order: 20, is_active: true, created_at: now, updated_at: now },
      { key: 'lol', label: 'LOL', type: 'unicode', unicode: '\u{1F602}', image_path: null, sort_order: 30, is_active: true, created_at: now, updated_at: now },
      { key: 'cry', label: 'Cry', type: 'unicode', unicode: '\u{1F62D}', image_path: null, sort_order: 40, is_active: true, created_at: now, updated_at: now },
      { key: 'angry', label: 'Angry', type: 'unicode', unicode: '\u{1F621}', image_path: null, sort_order: 50, is_active: true, created_at: now, updated_at: now },
      { key: 'mind_blown', label: 'Mind Blown', type: 'unicode', unicode: '\u{1F92F}', image_path: null, sort_order: 60, is_active: true, created_at: now, updated_at: now },
      { key: 'pray', label: 'Pray', type: 'unicode', unicode: '\u{1F64F}', image_path: null, sort_order: 70, is_active: true, created_at: now, updated_at: now },
      { key: 'eyes', label: 'Eyes', type: 'unicode', unicode: '\u{1F440}', image_path: null, sort_order: 80, is_active: true, created_at: now, updated_at: now },
      { key: 'tn_bird', label: 'TN Bird', type: 'image', unicode: null, image_path: '/reactions/tn_bird.webp', sort_order: 90, is_active: true, created_at: now, updated_at: now },
      { key: 'tn_beef_soup', label: 'TN Beef Soup', type: 'image', unicode: null, image_path: '/reactions/tn_beef_soup.webp', sort_order: 100, is_active: true, created_at: now, updated_at: now },
      { key: 'tn_black_wheel', label: 'TN Black Wheel', type: 'image', unicode: null, image_path: '/reactions/tn_black_wheel.webp', sort_order: 110, is_active: true, created_at: now, updated_at: now },
      { key: 'tn_temple', label: 'TN Temple', type: 'image', unicode: null, image_path: '/reactions/tn_temple.webp', sort_order: 120, is_active: true, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ReactionPresets', {
      key: {
        [Sequelize.Op.in]: [
          'like',
          'heart',
          'lol',
          'cry',
          'angry',
          'mind_blown',
          'pray',
          'eyes',
          'tn_bird',
          'tn_beef_soup',
          'tn_black_wheel',
          'tn_temple',
        ],
      },
    });
  },
};
