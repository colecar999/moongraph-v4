# Moongraph: Recommended Database Development Operations (PostgreSQL)

## 1. Overview

**Date:** October 26, 2023 (Note: Use current date when generating)
**Status:** Recommendation

This document outlines recommended practices and tools for ongoing development, visualization, maintenance, and schema evolution of the PostgreSQL database used by Morphik Core, the backend for Moongraph. These recommendations are aimed at ensuring a robust, maintainable, and collaborative development environment.

## 2. Core Principles

*   **Version Control for Schema:** Database schema changes should be version-controlled alongside application code.
*   **Reproducibility:** It should be easy to set up or migrate the database to any specific version across different environments (development, staging, production).
*   **Collaboration:** Tools and practices should support multiple developers working on the database schema and application logic concurrently.
*   **Separation of Concerns:** Distinguish between application-driven data access (via ORM), ad-hoc querying/visualization (via GUI tools), and structured schema migrations.

## 3. Key Tools and Their Roles

The recommended stack involves a combination of tools, each serving a specific purpose:

### 3.1. SQLAlchemy (ORM and Schema Definition)

*   **Current Usage:** Morphik Core already uses SQLAlchemy for:
    *   Defining database table structures as Python classes (Models like `UserModel`, `DocumentModel`).
    *   Interacting with the database (CRUD operations) from the Python application code in an object-oriented way.
    *   Initial schema creation via `Base.metadata.create_all()` in `PostgresDatabase.initialize()`. This is suitable for creating tables that don't yet exist.
*   **Ongoing Role:**
    *   Continue to define all new tables and their columns as SQLAlchemy models.
    *   Use SQLAlchemy sessions for all data manipulation within the application logic.
*   **Limitations to Note:** `Base.metadata.create_all()` is **not a migration tool**. It will not automatically apply alterations (e.g., adding columns, changing constraints) to tables that already exist in the database.

### 3.2. Database GUI Tools (Visualization, Ad-hoc Querying, Inspection)

These tools provide a graphical interface for interacting with the PostgreSQL database, similar to the experience developers might have with platforms like Supabase.

*   **Recommendation:** Choose **one primary GUI tool** for the team, though individuals can use their preference.
    *   **DBeaver (Free, Open Source, Multi-platform):**
        *   **Why:** Excellent general-purpose tool with strong PostgreSQL support, ER diagram generation, intuitive SQL editor, and data browsing. Good balance of features and ease of use.
    *   **pgAdmin (Free, Open Source):**
        *   **Why:** The official tool, very comprehensive for all aspects of PostgreSQL administration and development. Can be slightly heavier but offers deep insights.
    *   **Beekeeper Studio (Free/Paid, Open Source Core):**
        *   **Why:** Modern, clean UI, very user-friendly for common development tasks.
    *   **DataGrip (Commercial, by JetBrains):**
        *   **Why:** Extremely powerful, especially for SQL editing and integration with other JetBrains IDEs. A good option if the team already uses JetBrains tools and budget allows.
*   **Common Use Cases:**
    *   **Schema Exploration:** Visually inspecting table structures, columns, data types, indexes, and relationships.
    *   **Data Inspection & Quick Edits (in Development):** Viewing live data, running quick `SELECT` queries, making small manual data adjustments in development or staging environments (with caution!).
    *   **Ad-hoc Analysis:** Writing complex queries for one-off analysis or reporting that isn't part of the main application.
    *   **Query Optimization:** Using `EXPLAIN ANALYZE` (often with GUI support) to understand query performance.
    *   **Generating ER Diagrams:** Some tools can generate diagrams from the live database schema.

### 3.3. Database Migration Tool (Schema Evolution)

This is a **critical recommendation** for robust schema management.

*   **Recommendation:** **Alembic**
    *   **Why:**
        *   It's designed specifically for SQLAlchemy.
        *   It allows you to manage database schema changes in a version-controlled, incremental, and reversible way.
        *   It can compare your SQLAlchemy models to the database and help auto-generate migration scripts (Python files containing `op.add_column()`, `op.create_table()`, etc.).
        *   Migration scripts are stored in version control, providing a history of schema changes.
*   **How it Works (Simplified):**
    1.  **Setup:** Initialize Alembic in your project (one-time setup).
    2.  **Define Models:** Define your tables as SQLAlchemy models (as you are doing).
    3.  **Generate Migration:** When you change a model (e.g., add `UserModel.last_login_at`), you run an Alembic command. Alembic inspects your models and the database, then generates a new migration script.
    4.  **Review & Edit Script:** Review the auto-generated script. Sometimes, especially for complex changes (data migrations, tricky constraint changes), you'll need to manually edit it.
    5.  **Apply Migration:** Run an Alembic command to "upgrade" your database, which executes the script.
    6.  **Version Control:** Commit the migration script to Git.
*   **Benefits:**
    *   Handles adding, removing, or altering columns, tables, indexes, and constraints on existing databases.
    *   Ensures all developers and environments (dev, staging, prod) have a consistent schema version.
    *   Makes deployments safer and more predictable.
    *   Provides a clear history of schema changes.
*   **Transition:**
    *   The current `Base.metadata.create_all()` can still be used for brand new setups (e.g., a developer's first local setup, or CI environments that start with an empty database).
    *   Once Alembic is in place, subsequent schema changes should be managed via Alembic migrations. You might create an initial Alembic migration that reflects the schema already created by `create_all`.

### 3.4. `psql` (Command-Line Interface)

*   **Role:** PostgreSQL's native CLI tool.
*   **Use Cases:**
    *   Quick, direct SQL execution when already in a terminal.
    *   Running SQL scripts (e.g., for bulk data operations, some types of maintenance).
    *   Database administration tasks (user creation, permission grants at the DB level, configuration) if not using a GUI tool.
    *   Scripting and automation of database tasks.

## 4. Recommended Workflow for Schema Changes

1.  **Define/Modify Model:** Make changes to your SQLAlchemy model class in `postgres_database.py` (e.g., add a new column to `UserModel`).
2.  **Generate Alembic Migration:** Use Alembic commands to generate a new migration script based on the model changes.
    *   `alembic revision -m "add_last_login_at_to_users"` (creates an empty revision)
    *   Then, either let Alembic auto-generate the changes (`--autogenerate`) or manually write the `op.add_column(...)` etc. in the script.
3.  **Review & Test Migration:** Carefully review the generated script. Test the migration locally by running `alembic upgrade head`. Check the database schema with a GUI tool to confirm. Test downgrading if necessary: `alembic downgrade -1`.
4.  **Commit:** Commit both the model changes and the Alembic migration script to version control.
5.  **Deployment:** As part of your deployment process (to staging or production), run `alembic upgrade head` to apply pending migrations to the target database.

## 5. Data Seeding and Test Data

*   **Alembic for Schema, Scripts for Data:** Use Alembic for schema changes. For populating initial data (e.g., default roles, permissions) or generating test data, consider:
    *   **Alembic `data` migrations:** Alembic can also handle data migrations (using `op.bulk_insert` or `op.execute("SQL INSERT...")`), which can be useful for seeding data that's tied to schema versions.
    *   **Separate Python Scripts:** Scripts that use SQLAlchemy to create and insert data. These can be run manually or as part of a setup process.
    *   **Fixture Libraries:** For testing (e.g., `pytest-factoryboy`), use factories to generate consistent test data.

## 6. Backup and Recovery

*   While not strictly a "dev ops" tool, ensure regular automated backups of your PostgreSQL database are in place for all important environments (staging, production).
*   Tools like `pg_dump` (CLI) or features within GUI tools/cloud provider services can be used for this.
*   Periodically test your recovery process.

## 7. Summary for Developers

*   **Primary Interaction:** Through SQLAlchemy models and session for application logic.
*   **Schema Evolution:** **Use Alembic.** Define models, then generate and apply Alembic migrations.
*   **Visualization & Ad-hoc Queries:** Use a GUI tool like DBeaver or pgAdmin to connect to your local or dev database.
*   **Quick CLI Tasks:** `psql` is your friend.

Adopting these practices, especially a migration tool like Alembic, will significantly improve the stability, maintainability, and collaborative nature of database development for Moongraph. 