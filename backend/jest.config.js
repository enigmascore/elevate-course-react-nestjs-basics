/** Unit tests live next to the code ( *.spec.ts ); integration tests
 *  live under test/integration and need docker ( Postgres + MailHog ). */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  testTimeout: 30000,
};
