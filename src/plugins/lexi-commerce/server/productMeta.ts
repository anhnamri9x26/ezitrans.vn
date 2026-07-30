import { prisma } from '@/lib/prisma';

export async function saveProductMeta(post: any, body?: any) {
  if (post?.type !== 'PRODUCT' || !body?.productMeta) return;

  const meta = body.productMeta;
  const manageStock = Boolean(meta.manageStock);
  const rawStockQuantity = meta.stockQuantity === '' || meta.stockQuantity === undefined || meta.stockQuantity === null
    ? null
    : Number(meta.stockQuantity);
  const stockQuantity = manageStock && Number.isFinite(rawStockQuantity)
    ? Math.max(0, Number(rawStockQuantity))
    : null;
  const allowBackorder = manageStock ? Boolean(meta.allowBackorder) : false;

  await prisma.$executeRaw`
    INSERT INTO "ProductMeta" (
      "postId", "sku", "englishName", "technicalName", "shortDescription",
      "salesStatus", "stockStatus", "isFeatured", "galleryIds", "regularPrice", "salePrice",
      "productKind", "priceMode", "unit", "manageStock", "stockQuantity", "allowBackorder",
      "steelGrade", "hardness", "surface", "origin", "dynamicSpecs", "specTable",
      "documents", "linkedProducts", "ctaLabel", "quoteForm", "quotePhone", "quoteNote", "advancedNote"
    ) VALUES (
      ${post.id}, ${meta.sku ?? null}, ${meta.englishName ?? null}, ${meta.technicalName ?? null}, ${meta.shortDescription ?? null},
      ${meta.salesStatus ?? null}, ${meta.stockStatus ?? null}, ${Boolean(meta.isFeatured)}, ${meta.galleryIds ?? null}, ${meta.regularPrice ?? null}, ${meta.salePrice ?? null},
      ${meta.productKind ?? 'SIMPLE'}, ${meta.priceMode ?? 'CONTACT_QUOTE'}, ${meta.unit ?? null}, ${manageStock}, ${stockQuantity}, ${allowBackorder},
      ${meta.steelGrade ?? null}, ${meta.hardness ?? null}, ${meta.surface ?? null}, ${meta.origin ?? null}, ${meta.dynamicSpecs ?? null}, ${meta.specTable ?? null},
      ${meta.documents ?? null}, ${meta.linkedProducts ?? null}, ${meta.ctaLabel ?? null}, ${meta.quoteForm ?? null}, ${meta.quotePhone ?? null}, ${meta.quoteNote ?? null}, ${meta.advancedNote ?? null}
    )
    ON CONFLICT ("postId") DO UPDATE SET
      "sku" = EXCLUDED."sku", "englishName" = EXCLUDED."englishName", "technicalName" = EXCLUDED."technicalName",
      "shortDescription" = EXCLUDED."shortDescription", "salesStatus" = EXCLUDED."salesStatus",
      "stockStatus" = EXCLUDED."stockStatus", "isFeatured" = EXCLUDED."isFeatured",
      "galleryIds" = EXCLUDED."galleryIds", "regularPrice" = EXCLUDED."regularPrice",
      "salePrice" = EXCLUDED."salePrice", "productKind" = EXCLUDED."productKind",
      "priceMode" = EXCLUDED."priceMode", "unit" = EXCLUDED."unit", "manageStock" = EXCLUDED."manageStock",
      "stockQuantity" = EXCLUDED."stockQuantity", "allowBackorder" = EXCLUDED."allowBackorder",
      "steelGrade" = EXCLUDED."steelGrade", "hardness" = EXCLUDED."hardness", "surface" = EXCLUDED."surface",
      "origin" = EXCLUDED."origin", "dynamicSpecs" = EXCLUDED."dynamicSpecs", "specTable" = EXCLUDED."specTable",
      "documents" = EXCLUDED."documents", "linkedProducts" = EXCLUDED."linkedProducts", "ctaLabel" = EXCLUDED."ctaLabel",
      "quoteForm" = EXCLUDED."quoteForm", "quotePhone" = EXCLUDED."quotePhone", "quoteNote" = EXCLUDED."quoteNote",
      "advancedNote" = EXCLUDED."advancedNote"
  `;
}

export async function attachProductMeta(post: any) {
  if (post?.type !== 'PRODUCT') return post;
  const productMetaRows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "ProductMeta" WHERE "postId" = ${post.id} LIMIT 1
  `;
  return { ...post, productMeta: productMetaRows[0] || null };
}
