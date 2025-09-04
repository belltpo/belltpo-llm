# Generated migration to reset email unique constraint conflicts

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prechat', '0005_alter_prechatsubmission_email'),
    ]

    operations = [
        # Drop all existing tables to avoid conflicts
        migrations.RunSQL(
            """
            DROP TABLE IF EXISTS prechat_chatconversation;
            DROP TABLE IF EXISTS prechat_submissions;
            DROP TABLE IF EXISTS prechat_prechatsubmission;
            """,
            reverse_sql="SELECT 1;"
        ),
        # Recreate PrechatSubmission table
        migrations.RunSQL(
            """
            CREATE TABLE prechat_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(254) NOT NULL,
                mobile VARCHAR(20) NOT NULL,
                region VARCHAR(50) NOT NULL,
                session_token VARCHAR(255) UNIQUE,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            );
            """,
            reverse_sql="DROP TABLE IF EXISTS prechat_submissions;"
        ),
        # Recreate ChatConversation table
        migrations.RunSQL(
            """
            CREATE TABLE prechat_chatconversation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role VARCHAR(10) NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                submission_id INTEGER NOT NULL,
                FOREIGN KEY (submission_id) REFERENCES prechat_submissions (id) ON DELETE CASCADE
            );
            """,
            reverse_sql="DROP TABLE IF EXISTS prechat_chatconversation;"
        ),
    ]
