const database = require('./index.js');

(async () => {
  try {
    //await database.schema.dropTableIfExists('users');
    //await database.schema.withSchema('public').createTable('users', (table) => {
    await database.schema.createTableIfNotExists('leaders', (table) => {
      
        // Auto assigned ID
        table.increments();

        // Player name
        table.string('name');

        // Player score
        table.string('score');
    })
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
})();

(async () => {
  try {
    //await database.schema.dropTableIfExists('users');
    //await database.schema.withSchema('public').createTable('users', (table) => {
    await database.schema.createTableIfNotExists('singleplayerleaders', (table) => {
      
        // Auto assigned ID
        table.increments();

        // Player name
        table.string('name');

        // Player score
        table.string('score');
    })
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
})();