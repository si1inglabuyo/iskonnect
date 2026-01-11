
/* 
const sequelize = new Sequelize(
     process.env.DB_NAME || 'postgres',
     process.env.DB_USER || 'postgres',
     process.env.DB_PASSWORD || 'taemomabaho123',
     {
          host: process.env.DB_HOST || 'db.ylooptlfspbjcoltzpar.supabase.co',
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          dialectOptions: {
               ssl: {
                    require: true,
                    rejectUnauthorized: false
               }
          },
          logging: false
     }
);
*/

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
    family: 4, 
  },
});

module.exports = sequelize;

