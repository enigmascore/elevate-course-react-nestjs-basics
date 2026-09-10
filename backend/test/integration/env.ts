/**
 * Imported FIRST by the integration spec so the app boots against the
 * TEST database ( created by docker/postgres-init ) - never against dev
 * data. Everything else keeps its committed local default.
 */
process.env.DB_NAME = "blog_test";
