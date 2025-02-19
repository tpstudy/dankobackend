-- Migration number: 0002 	 2024-12-27T22:05:18.794Z
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert a sample blog post
INSERT INTO posts (title, content)
VALUES
    ('Welcome to My Blog', '# Welcome

This is my first blog post using Markdown format.

## Features

- Markdown support
- Secure API access
- Easy to manage
');