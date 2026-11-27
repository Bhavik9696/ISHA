const bcrypt = require('bcryptjs');
const Admin  = require('../models/Admin');

/**
 * On first boot, hash the ADMIN_PASSWORD env var and store it in MongoDB.
 * On subsequent boots it's a no-op (password already seeded).
 */
async function seedAdminPassword() {
  const existing = await Admin.findOne();
  if (existing) {
    console.log('🔑  Admin password already seeded.');
    return;
  }

  const plainPassword = process.env.ADMIN_PASSWORD;
  if (!plainPassword) {
    console.warn('⚠️  ADMIN_PASSWORD env var is not set — skipping admin seed.');
    return;
  }

  const hash = await bcrypt.hash(plainPassword, 12);
  await Admin.create({ passwordHash: hash });
  console.log('🔑  Admin password seeded successfully.');
}

module.exports = { seedAdminPassword };

