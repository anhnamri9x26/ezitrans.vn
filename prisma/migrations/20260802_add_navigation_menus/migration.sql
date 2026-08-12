-- First-class WordPress-like navigation menus and theme locations.
-- Existing settings are preserved for rollback and legacy theme compatibility.

CREATE TABLE "NavigationMenu" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "items" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NavigationMenu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NavigationMenuAssignment" (
  "id" SERIAL NOT NULL,
  "themeId" TEXT NOT NULL,
  "locationKey" TEXT NOT NULL,
  "menuId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NavigationMenuAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NavigationMenu_slug_key" ON "NavigationMenu"("slug");
CREATE INDEX "NavigationMenu_name_idx" ON "NavigationMenu"("name");
CREATE UNIQUE INDEX "NavigationMenuAssignment_themeId_locationKey_key" ON "NavigationMenuAssignment"("themeId", "locationKey");
CREATE INDEX "NavigationMenuAssignment_menuId_idx" ON "NavigationMenuAssignment"("menuId");
CREATE INDEX "NavigationMenuAssignment_themeId_idx" ON "NavigationMenuAssignment"("themeId");

ALTER TABLE "NavigationMenuAssignment"
  ADD CONSTRAINT "NavigationMenuAssignment_menuId_fkey"
  FOREIGN KEY ("menuId") REFERENCES "NavigationMenu"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

WITH active_theme AS (
  SELECT COALESCE((SELECT "value" FROM "Setting" WHERE "key" = 'active_theme' LIMIT 1), 'default') AS id
), inserted_header AS (
  INSERT INTO "NavigationMenu" ("name", "slug", "items")
  SELECT 'Menu Header', 'menu-header', s."value"
  FROM "Setting" s
  WHERE s."key" = 'theme_menu_header'
    AND NOT EXISTS (SELECT 1 FROM "NavigationMenu" WHERE "slug" = 'menu-header')
  RETURNING "id"
), header_menu AS (
  SELECT "id" FROM inserted_header
  UNION ALL
  SELECT "id" FROM "NavigationMenu" WHERE "slug" = 'menu-header'
  LIMIT 1
)
INSERT INTO "NavigationMenuAssignment" ("themeId", "locationKey", "menuId")
SELECT active_theme.id, 'header-primary', header_menu."id"
FROM active_theme, header_menu
ON CONFLICT ("themeId", "locationKey") DO NOTHING;

WITH active_theme AS (
  SELECT COALESCE((SELECT "value" FROM "Setting" WHERE "key" = 'active_theme' LIMIT 1), 'default') AS id
), inserted_footer AS (
  INSERT INTO "NavigationMenu" ("name", "slug", "items")
  SELECT 'Menu Footer', 'menu-footer', s."value"
  FROM "Setting" s
  WHERE s."key" = 'theme_menu_footer'
    AND NOT EXISTS (SELECT 1 FROM "NavigationMenu" WHERE "slug" = 'menu-footer')
  RETURNING "id"
), footer_menu AS (
  SELECT "id" FROM inserted_footer
  UNION ALL
  SELECT "id" FROM "NavigationMenu" WHERE "slug" = 'menu-footer'
  LIMIT 1
)
INSERT INTO "NavigationMenuAssignment" ("themeId", "locationKey", "menuId")
SELECT active_theme.id, 'footer-primary', footer_menu."id"
FROM active_theme, footer_menu
ON CONFLICT ("themeId", "locationKey") DO NOTHING;

INSERT INTO "Setting" ("key", "value", "createdAt", "updatedAt")
VALUES ('navigation_menus_initialized', 'true', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "value" = 'true', "updatedAt" = CURRENT_TIMESTAMP;
