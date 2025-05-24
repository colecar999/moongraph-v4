# Feature Implementation Guide: Files Table Extension

## 1. Overview and Goals

This document outlines the plan to enhance the files table located on the `/documents/files` page. The primary goals are:
-   Display more comprehensive information about each document by adding new data columns.
-   Provide users with insights into the document's processing state, particularly regarding text and multimodal (ColPali) embeddings.
-   Improve the user experience by adopting the more advanced table component used in the `/dashboard` route.
-   Allow users to customize the visibility of table columns.

## 2. New Columns to be Added

The following fields will be added as new columns to the files data table:

| Column Header                 | Data Source (from Document object)                     | Notes                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| **Core Document Info**        |                                                        |                                                                       |
| Filename                      | `filename`                                             | Already present, will be retained.                                    |
| Type                          | `content_type` (derived)                               | Already present, will be retained.                                    |
| Status                        | `system_metadata.status`                               | Already present, will be retained.                                    |
| ID                            | `external_id`                                          | Already present (implicitly or explicitly), will be retained.         |
| Owner                         | `owner.id` (or resolved name)                          | To display the primary document owner.                                |
| Folder Name                   | `system_metadata.folder_name`                          |                                                                       |
| Created At                    | `system_metadata.created_at`                           | Timestamp of document creation.                                       |
| Updated At                    | `system_metadata.updated_at`                           | Timestamp of last document update.                                    |
| Version                       | `system_metadata.version`                              | Document version.                                                     |
| **Chunk & Embedding Info**    |                                                        |                                                                       |
| Number of Chunks              | `len(chunk_ids)`                                       | Count of total text chunks.                                           |
| Std. Embedding Status       | `system_metadata.standard_embedding_status`          | "success", "failed", "not_attempted". New field.                    |
| Std. Embedding Chunks       | `system_metadata.standard_chunk_count`               | Count of successfully standard-embedded chunks. New field.            |
| ColPali Embedding Status    | `system_metadata.colpali_embedding_status`           | "success", "failed", "not_attempted", "skipped". New field.       |
| ColPali Embedding Chunks    | `system_metadata.colpali_chunk_count`                | Count of successfully ColPali-embedded chunks. New field.             |
| **Access Control Info**       |                                                        |                                                                       |
| Readers                       | `access_control.readers`                               | List of reader IDs/names.                                             |
| Writers                       | `access_control.writers`                               | List of writer IDs/names.                                             |
| Admins                        | `access_control.admins`                                | List of admin IDs/names.                                              |

## 3. Ingestion Worker Modifications

To provide detailed information about embedding processes, the ingestion worker (`morphik-core/core/workers/ingestion_worker.py`) will be modified to add new fields to the `system_metadata` of each document.

**File to Modify**: `morphik-core/core/workers/ingestion_worker.py`

**New `system_metadata` fields**:

*   `standard_embedding_status` (string): Stores the outcome of the standard text embedding process.
    *   Possible values: `"success"`, `"failed"`, `"not_attempted"`.
*   `standard_chunk_count` (integer): The number of text chunks for which standard embeddings were successfully generated.
*   `colpali_embedding_status` (string): Stores the outcome of the ColPali (multimodal) embedding process.
    *   Possible values: `"success"`, `"failed"`, `"not_attempted"`, `"skipped"`.
*   `colpali_chunk_count` (integer): The number of multivector/image chunks for which ColPali embeddings were successfully generated.

**Logic for Populating New Fields in `process_ingestion_job`**:

1.  **Initialize Fields**: At the beginning of the job, or before embedding steps, initialize these new status fields to a default like `"not_attempted"` and counts to `0`.
2.  **Standard Embeddings**:
    *   After `embeddings = await document_service.embedding_model.embed_for_ingestion(processed_chunks)`:
        *   If successful and `embeddings` are produced:
            *   Set `doc.system_metadata["standard_embedding_status"] = "success"`
            *   Set `doc.system_metadata["standard_chunk_count"] = len(processed_chunks)` (or `len(embeddings)`)
        *   If `processed_chunks` was empty:
            *   Set `doc.system_metadata["standard_embedding_status"] = "not_attempted"`
            *   Set `doc.system_metadata["standard_chunk_count"] = 0`
        *   If an exception occurs during this stage (e.g., in `e_embed_text` catch block):
            *   Set `doc.system_metadata["standard_embedding_status"] = "failed"`
            *   The overall document status will also be set to "failed".
3.  **ColPali Embeddings**:
    *   Determine if ColPali is active (`using_colpali_effective`).
    *   If not active:
        *   Set `doc.system_metadata["colpali_embedding_status"] = "not_attempted"`
        *   Set `doc.system_metadata["colpali_chunk_count"] = 0`
    *   If active and `processed_chunks_multivector` is empty prior to embedding:
        *   Set `doc.system_metadata["colpali_embedding_status"] = "skipped"` (attempted but no suitable chunks)
        *   Set `doc.system_metadata["colpali_chunk_count"] = 0`
    *   After `colpali_embeddings = await document_service.colpali_embedding_model.embed_for_ingestion(processed_chunks_multivector)`:
        *   If successful and `colpali_embeddings` are produced:
            *   Set `doc.system_metadata["colpali_embedding_status"] = "success"`
            *   Set `doc.system_metadata["colpali_chunk_count"] = len(processed_chunks_multivector)` (or `len(colpali_embeddings)`)
        *   If an exception occurs (e.g., in `e_embed_colpali` catch block):
            *   Set `doc.system_metadata["colpali_embedding_status"] = "failed"`
            *   Set `doc.system_metadata["colpali_chunk_count"] = 0` (as the current logic proceeds without ColPali embeddings on error).
4.  **Storage**: Ensure these new fields in `doc.system_metadata` are persisted when the document record is updated (e.g., before or during `document_service._store_chunks_and_doc`).

## 4. UI Table Update

The existing data table in the `/documents/files` page will be upgraded to align with the advanced table implementation used in the `/dashboard` route.

**Component to Update**: `DocumentList.tsx` (likely located at `morphik-core/ee/ui-component/components/documents/DocumentList.tsx`), which serves the page `frontend/src/app/(authenticated)/documents/files/page.tsx`. This component should be refactored or replaced to use `@tanstack/react-table` following the patterns established in `frontend/src/components/data-table.tsx`.

**Key Implementation Steps & Requirements**:

1.  **Dependency**: Ensure `@tanstack/react-table` is available.
2.  **Data Schema (Zod)**: Define a Zod schema for the `Document` data that will be displayed in the table, including the existing fields and the new `system_metadata` fields for embedding status and counts.
3.  **Column Definitions (`ColumnDef`)**:
    *   Create an array of `ColumnDef` objects for the files table.
    *   Each column specified in Section 2 of this guide must have a corresponding `ColumnDef`.
    *   Define `accessorKey` or `accessorFn` for data retrieval for each column.
    *   Customize cell rendering (`cell: ({ row }) => ...`) for complex data types, badges (e.g., for status, type), timestamps (format them user-readably), and lists (e.g., for readers/writers/admins - display count or truncated list).
    *   **Filename Cell**: The cell renderer for the `filename` column specifically should contain a trigger (e.g., a link-styled button displaying the filename) that opens the document details view (see point 8).
    *   Define header rendering, including sort direction indicators.
4.  **Table Hook (`useReactTable`)**:
    *   Utilize the `useReactTable` hook from `@tanstack/react-table` to initialize the table instance.
    *   Implement state management for:
        *   `data`: The array of document objects.
        *   `columns`: The column definitions.
        *   `rowSelection`: For selectable rows (if this feature is desired for files, similar to the dashboard table).
        *   `columnVisibility`: To control which columns are visible, linking to the "Customize Columns" feature.
        *   `columnFilters`: For per-column or global filtering capabilities.
        *   `sorting`: For multi-column sorting.
        *   `pagination`: For client-side or server-side pagination.
        *   `selectedDocumentForDetail`: A new state to hold the document object whose details are to be shown in the Drawer.
    *   Configure the necessary table models (e.g., `getCoreRowModel`, `getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel`, `getFacetedRowModel`).
5.  **Rendering**:
    *   Use the `flexRender` utility from `@tanstack/react-table` to render headers and cells.
    *   Employ the shared UI components from `frontend/src/components/ui/` (e.g., `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Button`, `Checkbox`, `DropdownMenu`, `Input`, `Select`, `Badge`, `Drawer`) to ensure visual consistency with `data-table.tsx`.
    *   Integrate icons from `@tabler/icons-react` where appropriate (e.g., for sorting, actions).
6.  **Toolbar/Controls**:
    *   Implement a toolbar area above or below the table.
    *   Include a global filter input field.
    *   Implement pagination controls (rows per page selector, first/previous/next/last page buttons).
    *   The "Customize Columns" dropdown (detailed in Section 5) will be part of this toolbar.
7.  **Styling**:
    *   Ensure the overall look and feel (density, fonts, borders, hover states) match the `data-table.tsx` component.
    *   Pay attention to responsive behavior.
8.  **Document Details View (Drawer)**:
    *   Replace the current side menu (opened on full row click) with a `Drawer` component (from `frontend/src/components/ui/drawer.tsx`).
    *   The `Drawer` should be triggered by clicking the filename (or a dedicated trigger within the filename cell) as defined in the `ColumnDef`.
    *   When a filename is clicked, the corresponding document object should be set in the `selectedDocumentForDetail` state, and the `Drawer` should open.
    *   The `Drawer` should display the content previously shown in the side menu, likely using the existing `DocumentDetail` component, passing `selectedDocumentForDetail` as a prop.
    *   The `Drawer` component should provide standard modal behaviors: darkening/overlaying the background content and closing when the user clicks outside the drawer or presses the Escape key.
9.  **Drag-and-Drop Upload**: 
    *   The existing drag-and-drop file upload functionality over the table area (currently handled in `DocumentsSection.tsx`) must be preserved.
    *   The new table implementation should be structured within its parent component (`DocumentsSection.tsx`) such that the drag listeners and overlay visuals continue to function correctly over the table area.
10. **Features to Replicate (from `data-table.tsx`)**:
    *   Sorting (ascending/descending by clicking column headers).
    *   Filtering (global text filter, potentially per-column filters if deemed necessary).
    *   Pagination.
    *   Row selection (if required for future bulk actions on files).
    *   Column visibility/customization.
11. **Features to Exclude (unless specified otherwise)**:
    *   Drag-and-drop row reordering (which is present in the dashboard's `data-table.tsx` but likely not needed for the files list).

*Note: The new columns listed in Section 2 will be integrated into this `@tanstack/react-table` structure.*

## 5. "Customize Columns" Functionality

A "Customize Columns" dropdown or similar UI mechanism will be added to the files table.

**Functionality**:
*   Users will be able to select which columns (from the expanded list including new and existing ones) are visible in the table.
*   The system should ideally remember the user's column visibility preferences, potentially using browser local storage for persistence across sessions.
*   A default set of visible columns should be defined.

## 6. Displaying Embedding Information in the UI

The new embedding status and chunk count columns will provide users with direct feedback on the ingestion process:

*   **Standard Embeddings**:
    *   Display: `Std. Embedding Status` (e.g., "Success", "Failed")
    *   Display: `Std. Embedding Chunks` (e.g., "152 chunks")
*   **ColPali Embeddings**:
    *   Display: `ColPali Embedding Status` (e.g., "Success", "Skipped")
    *   Display: `ColPali Embedding Chunks` (e.g., "12 chunks", "0 chunks")

This allows users to quickly assess:
*   If embeddings were generated successfully.
*   The volume of embeddings, which can be correlated with document size/content type.
*   Whether standard text embeddings and/or advanced multimodal ColPali embeddings are available for the document.

## 7. API Impact

*   The `/documents` and `/batch/documents` API endpoints will inherently return these new `system_metadata` fields as part of the `Document` object once the ingestion worker modifications are in place. No direct API contract changes are required for these specific fields, as they are added to an existing JSONB field.
*   The frontend will consume these new fields from the existing API responses. 