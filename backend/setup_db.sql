# MySQL Setup Script
# Run this in your MySQL terminal (mysql -u root):
# 1. Create database
CREATE DATABASE IF NOT EXISTS sameeksha_ai;

# 2. Create user with password
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'password';

# 3. Grant privileges
GRANT ALL PRIVILEGES ON sameeksha_ai.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

# 4. Verify
SHOW DATABASES;