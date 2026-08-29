BEGIN;

CREATE TABLE "users" (
  "id" varchar(64) PRIMARY KEY,
  "email" text NOT NULL,
  "password_hash" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");

CREATE TABLE "sessions" (
  "id" varchar(64) PRIMARY KEY,
  "user_id" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions" ("expires_at");

-- This unclaimed user temporarily owns all pre-auth data. On the first signup,
-- the API only lets BOOTSTRAP_OWNER_EMAIL claim it.
INSERT INTO "users" ("id", "email", "password_hash")
VALUES ('orbit-bootstrap-owner', 'owner@orbit.local', NULL);

ALTER TABLE "people" ADD COLUMN "owner_id" varchar(64);
ALTER TABLE "interactions" ADD COLUMN "owner_id" varchar(64);
ALTER TABLE "connections" ADD COLUMN "owner_id" varchar(64);

UPDATE "people" SET "owner_id" = 'orbit-bootstrap-owner';
UPDATE "interactions" SET "owner_id" = 'orbit-bootstrap-owner';
UPDATE "connections" SET "owner_id" = 'orbit-bootstrap-owner';

ALTER TABLE "people" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "interactions" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "connections" ALTER COLUMN "owner_id" SET NOT NULL;

ALTER TABLE "people" ADD CONSTRAINT "people_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "connections" ADD CONSTRAINT "connections_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE INDEX "people_owner_id_idx" ON "people" ("owner_id");
CREATE INDEX "interactions_owner_id_idx" ON "interactions" ("owner_id");
CREATE INDEX "connections_owner_id_idx" ON "connections" ("owner_id");

COMMIT;
