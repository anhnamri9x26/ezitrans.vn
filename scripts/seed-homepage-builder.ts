import { prisma } from '../src/lib/prisma';

const builderData = {
  "ROOT": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { "width": "100%", "minHeight": "100vh", "paddingTop": "0px", "paddingBottom": "0px", "paddingLeft": "0px", "paddingRight": "0px", "backgroundColor": "#ffffff" },
    "displayName": "Page Content",
    "custom": {},
    "hidden": false,
    "nodes": ["node_hero", "node_main"],
    "linkedNodes": {}
  },
  "node_hero": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { "width": "100%", "backgroundColor": "#ffffff", "paddingTop": "80px", "paddingBottom": "80px", "paddingLeft": "20px", "paddingRight": "20px", "borderBottomWidth": "1px", "borderBottomColor": "#e2e8f0", "borderBottomStyle": "solid" },
    "displayName": "Hero Section",
    "custom": {},
    "parent": "ROOT",
    "hidden": false,
    "nodes": ["node_hero_inner"],
    "linkedNodes": {}
  },
  "node_hero_inner": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { "width": "100%", "maxWidth": "1200px", "marginLeft": "auto", "marginRight": "auto", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center" },
    "displayName": "Hero Inner",
    "custom": {},
    "parent": "node_hero",
    "hidden": false,
    "nodes": ["node_title", "node_tagline"],
    "linkedNodes": {}
  },
  "node_title": {
    "type": { "resolvedName": "HeadingBlock" },
    "isCanvas": false,
    "props": { "text": "{{settings.site_title}}", "tagName": "h1", "fontSize": "48px", "fontWeight": "800", "textColor": "#0f172a", "textAlign": "center", "marginBottom": "24px", "lineHeight": "1.2" },
    "displayName": "Heading",
    "custom": {},
    "parent": "node_hero_inner",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "node_tagline": {
    "type": { "resolvedName": "TextBlock" },
    "isCanvas": false,
    "props": { "text": "{{settings.site_tagline}}", "fontSize": "20px", "textColor": "#64748b", "textAlign": "center", "maxWidth": "800px", "marginLeft": "auto", "marginRight": "auto", "lineHeight": "1.6" },
    "displayName": "Text",
    "custom": {},
    "parent": "node_hero_inner",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "node_main": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { "width": "100%", "backgroundColor": "#f8fafc", "paddingTop": "80px", "paddingBottom": "120px", "paddingLeft": "20px", "paddingRight": "20px" },
    "displayName": "Main Section",
    "custom": {},
    "parent": "ROOT",
    "hidden": false,
    "nodes": ["node_main_inner"],
    "linkedNodes": {}
  },
  "node_main_inner": {
    "type": { "resolvedName": "Container" },
    "isCanvas": true,
    "props": { "width": "100%", "maxWidth": "1200px", "marginLeft": "auto", "marginRight": "auto" },
    "displayName": "Main Inner",
    "custom": {},
    "parent": "node_main",
    "hidden": false,
    "nodes": ["node_section_title", "node_post_grid"],
    "linkedNodes": {}
  },
  "node_section_title": {
    "type": { "resolvedName": "HeadingBlock" },
    "isCanvas": false,
    "props": { "text": "Bài viết mới nhất", "tagName": "h2", "fontSize": "30px", "fontWeight": "800", "textColor": "#0f172a", "textAlign": "center", "marginBottom": "48px" },
    "displayName": "Heading",
    "custom": {},
    "parent": "node_main_inner",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  },
  "node_post_grid": {
    "type": { "resolvedName": "PostGridBlock" },
    "isCanvas": false,
    "props": { "limit": "6", "columns": "3", "showDate": true, "showExcerpt": true, "showAuthor": true },
    "displayName": "Post Grid",
    "custom": {},
    "parent": "node_main_inner",
    "hidden": false,
    "nodes": [],
    "linkedNodes": {}
  }
};

const htmlContent = `
<div style="background-color: #ffffff; width: 100%; min-height: 100vh;">
  <div style="background-color: #ffffff; padding: 80px 20px; border-bottom: 1px solid #e2e8f0; width: 100%;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <h1 style="font-size: 48px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 24px; line-height: 1.2;">{{settings.site_title}}</h1>
      <p style="font-size: 20px; color: #64748b; text-align: center; max-width: 800px; margin: 0 auto; line-height: 1.6;">{{settings.site_tagline}}</p>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 80px 20px 120px 20px; width: 100%;">
    <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
      <h2 style="font-size: 30px; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 48px;">Bài viết mới nhất</h2>
      <div>{{post_grid:limit=6:columns=3:showDate=true:showExcerpt=true:showAuthor=true}}</div>
    </div>
  </div>
</div>
`;

async function main() {
  console.log('Seeding Homepage Page Builder Template...');

  // Check if it already exists
  const existing = await prisma.template.findFirst({
    where: { type: 'HOMEPAGE' }
  });

  if (existing) {
    console.log('Updating existing Homepage Template...');
    await prisma.template.update({
      where: { id: existing.id },
      data: {
        name: 'Trang chủ Page Builder',
        status: 'ACTIVE',
        isDefault: true,
        priority: 100,
        builderData: JSON.stringify(builderData),
        htmlContent: htmlContent
      }
    });
  } else {
    console.log('Creating new Homepage Template...');
    await prisma.template.create({
      data: {
        name: 'Trang chủ Page Builder',
        type: 'HOMEPAGE',
        status: 'ACTIVE',
        isDefault: true,
        priority: 100,
        builderData: JSON.stringify(builderData),
        htmlContent: htmlContent
      }
    });
  }

  console.log('Done! Homepage is now powered by Lexi Page Builder.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
