-- Seed data for users table
-- Password hash is bcrypt hash of 'password123'

INSERT INTO users (id, email, name, role, department, job_title, phone, password_hash) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'John Admin', 'admin', 'Management', 'System Administrator', '+1 (555) 123-0001', '$2b$10$rQZ9K8X2mN3vL4pQ7sT1uA6bC9dE0fG1hI2jK3lM4nO5pQ6rS7tU8vW9xY0zA1'),
('550e8400-e29b-41d4-a716-446655440002', 'manager@example.com', 'Jane Manager', 'manager', 'Engineering', 'Senior Project Manager', '+1 (555) 123-0002', '$2b$10$rQZ9K8X2mN3vL4pQ7sT1uA6bC9dE0fG1hI2jK3lM4nO5pQ6rS7tU8vW9xY0zA1'),
('550e8400-e29b-41d4-a716-446655440003', 'user@example.com', 'Bob Developer', 'developer', 'Engineering', 'Full Stack Developer', '+1 (555) 123-0003', '$2b$10$rQZ9K8X2mN3vL4pQ7sT1uA6bC9dE0fG1hI2jK3lM4nO5pQ6rS7tU8vW9xY0zA1'),
('550e8400-e29b-41d4-a716-446655440004', 'viewer@example.com', 'Alice QA', 'qa', 'Design', 'UI/UX Designer', '+1 (555) 123-0004', '$2b$10$rQZ9K8X2mN3vL4pQ7sT1uA6bC9dE0fG1hI2jK3lM4nO5pQ6rS7tU8vW9xY0zA1'); 