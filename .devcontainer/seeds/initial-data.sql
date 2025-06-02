-- Initial development data
-- This file contains sample data for development purposes

-- Note: Since we're using Supabase auth, users are managed through the auth system
-- We'll focus on seeding data for custom tables

-- Sample profiles data (these would be linked to auth.users)
-- Uncomment and modify these when you have actual user IDs from Supabase auth

-- INSERT INTO profiles (id, username, updated_at, avatar_url, website) 
-- VALUES 
--   ('550e8400-e29b-41d4-a716-446655440001', 'developer', NOW(), NULL, 'https://example.com'),
--   ('550e8400-e29b-41d4-a716-446655440002', 'testuser', NOW(), NULL, NULL);

-- Sample files data
-- INSERT INTO files (
--   id, filename, "originalName", size, "mimeType", category, 
--   description, tags, folder, "bucketName", path, "publicUrl", 
--   "uploadedBy", "uploadedAt", "updatedAt"
-- ) VALUES 
--   (
--     '660e8400-e29b-41d4-a716-446655440001',
--     'sample-document.pdf',
--     'Sample Document.pdf',
--     1024000,
--     'application/pdf',
--     'document',
--     'A sample PDF document for testing',
--     'sample,test,document',
--     'documents',
--     'files',
--     'documents/sample-document.pdf',
--     'https://example.com/files/sample-document.pdf',
--     '550e8400-e29b-41d4-a716-446655440001',
--     NOW(),
--     NOW()
--   ),
--   (
--     '660e8400-e29b-41d4-a716-446655440002',
--     'test-image.jpg',
--     'Test Image.jpg',
--     512000,
--     'image/jpeg',
--     'image',
--     'A sample image for testing',
--     'sample,test,image',
--     'images',
--     'files',
--     'images/test-image.jpg',
--     'https://example.com/files/test-image.jpg',
--     '550e8400-e29b-41d4-a716-446655440002',
--     NOW(),
--     NOW()
--   );

-- Add your custom seed data here
-- Remember to use proper UUIDs and ensure referential integrity

-- Example of how to generate UUIDs in PostgreSQL:
-- SELECT gen_random_uuid();

-- For development, you might want to create some test data
-- that doesn't depend on auth.users existing yet
INSERT INTO files (
  filename, "originalName", size, "mimeType", category, 
  description, tags, folder, "bucketName", path, 
  "uploadedAt", "updatedAt"
) VALUES 
  (
    'welcome.txt',
    'Welcome.txt',
    1024,
    'text/plain',
    'document',
    'Welcome file for new developers',
    'welcome,info',
    'docs',
    'public',
    'docs/welcome.txt',
    NOW(),
    NOW()
  );

-- You can add more seed data as your application grows
-- Just make sure to update the TABLES_TO_BACKUP array in backup-db.js
-- to include any new tables you want to backup 