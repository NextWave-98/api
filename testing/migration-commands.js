// Migration commands for Sequelize CLI

// 1. Generate a new migration
npx sequelize-cli migration:generate --name your-migration-name

// 2. Run pending migrations
npx sequelize-cli db:migrate

// 3. Rollback last migration
npx sequelize-cli db:migrate:undo

// 4. Rollback all migrations
npx sequelize-cli db:migrate:undo:all

// 5. Check migration status
npx sequelize-cli db:migrate:status