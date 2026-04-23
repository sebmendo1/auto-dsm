-- user_onboarding: persisted wizard state (1:1 with auth user)
-- New rows are created on app_users insert; backfill for existing app_users.

CREATE TABLE IF NOT EXISTS "public"."user_onboarding" (
  "user_id" "uuid" NOT NULL,
  "display_name" "text",
  "personal_website" "text",
  "role" "text",
  "team_size" "text",
  "company_name" "text",
  "company_website" "text",
  "intended_repo_full_name" "text",
  "intended_project_name" "text",
  "current_step" "text",
  "profile_completed_at" timestamp with time zone,
  "last_scan_started_at" timestamp with time zone,
  "last_scan_error" "text",
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "user_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_onboarding_current_step_idx"
  ON "public"."user_onboarding" ("current_step")
  WHERE "current_step" IS NOT NULL;

CREATE OR REPLACE FUNCTION "public"."user_onboarding_set_updated_at"()
  RETURNS "trigger" AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "user_onboarding_set_updated_at"
  BEFORE UPDATE ON "public"."user_onboarding"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."user_onboarding_set_updated_at"();

-- After a row is inserted in app_users, create user_onboarding for new accounts.
CREATE OR REPLACE FUNCTION "public"."ensure_user_onboarding_row"()
  RETURNS "trigger" AS $$
BEGIN
  INSERT INTO "public"."user_onboarding" ("user_id")
  VALUES (NEW.id)
  ON CONFLICT ("user_id") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public';

CREATE TRIGGER "app_users_ensure_onboarding"
  AFTER INSERT ON "public"."app_users"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."ensure_user_onboarding_row"();

-- Backfill existing app_users
INSERT INTO "public"."user_onboarding" ("user_id")
SELECT "id" FROM "public"."app_users" AS au
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."user_onboarding" uo WHERE uo.user_id = au.id
)
ON CONFLICT ("user_id") DO NOTHING;

ALTER TABLE "public"."user_onboarding" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_onboarding_select_own" ON "public"."user_onboarding"
  FOR SELECT
  TO "authenticated"
  USING (("auth"."uid"() = "user_id"));

CREATE POLICY "user_onboarding_insert_own" ON "public"."user_onboarding"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "user_onboarding_update_own" ON "public"."user_onboarding"
  FOR UPDATE
  TO "authenticated"
  USING (("auth"."uid"() = "user_id"))
  WITH CHECK (("auth"."uid"() = "user_id"));

GRANT ALL ON TABLE "public"."user_onboarding" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."user_onboarding" TO "authenticated";
REVOKE ALL ON TABLE "public"."user_onboarding" FROM "anon";

COMMENT ON TABLE "public"."user_onboarding" IS 'Onboarding wizard fields and resume position; 1:1 with auth user.';
