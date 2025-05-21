# Restructuring Project to Use morphik-core as a Git Submodule

---

## Overview
This guide provides a step-by-step plan to restructure your project to use the open source [morphik-core](https://github.com/morphik-org/morphik-core) as a git submodule, specifically in the `/external/morphik-core` directory. It also covers how to separate your own code from morphik-core and Next.js files using automated tools and backup strategies. This approach keeps your codebase clean, makes it easy to update morphik-core, and protects your own work from being overwritten.

---

## Why Use a Submodule?
- **Separation:** Keeps open source code separate from your own.
- **Easy Updates:** Pull in new features and fixes from morphik-core with a single command.
- **Safe Customization:** Avoids accidental overwrites of your own files.
- **Standard Practice:** Widely used in the industry for managing third-party source dependencies.

---

## Step-by-Step Plan (with Progress Checkboxes)

- [ ] **1. Choose a Directory for the Submodule**
    - Use `external/morphik-core/` for the submodule location.

- [ ] **2. Identify and Separate Your Code**
    - Clone reference repos for comparison:
      ```sh
      git clone https://github.com/morphik-org/morphik-core.git /tmp/morphik-core
      npx create-next-app@latest /tmp/nextjs-app
      ```
    - Compare your project to morphik-core and Next.js to find unique files:
      ```sh
      diff -qr /Users/colecarnes/Documents/Apps/moongraph-v3 /tmp/morphik-core | grep "Only in /Users/colecarnes/Documents/Apps/moongraph-v3" > unique_to_project.txt
      diff -qr /Users/colecarnes/Documents/Apps/moongraph-v3/frontend /tmp/nextjs-app | grep "Only in /Users/colecarnes/Documents/Apps/moongraph-v3/frontend" > unique_to_frontend.txt
      ```
    - Review the lists and move your unique files to a safe backup location:
      ```sh
      mkdir /Users/colecarnes/Documents/Apps/moongraph-v3/my_code_backup
      # Move files as needed
      mv /Users/colecarnes/Documents/Apps/moongraph-v3/path/to/your_file.py /Users/colecarnes/Documents/Apps/moongraph-v3/my_code_backup/
      ```
    - If unsure about a file, move it to the backup for safety.

- [ ] **3. Remove morphik-core Files from the Root**
    - After backing up your code, remove morphik-core files from your project root:
      ```sh
      # Example: Remove a directory (double-check before running!)
      rm -rf core ee sdks utils docs examples scripts storage logs
      ```

- [ ] **4. Add morphik-core as a Submodule**
    - Add the submodule in `/external/morphik-core`:
      ```sh
      git submodule add https://github.com/morphik-org/morphik-core.git external/morphik-core
      git add .gitmodules external/morphik-core
      git commit -m "Add morphik-core as a submodule in /external"
      ```

- [ ] **5. Restore Your Code**
    - Move your code from `my_code_backup/` back into the appropriate directories in your project.

- [ ] **6. Update Imports/References**
    - Update your code to reference morphik-core from its new location (`external/morphik-core`).
    - Test your project to ensure everything works as expected.

- [ ] **7. Protect Your Config Files**
    - Keep your config files (like `morphik.toml`, `.env`, etc.) **outside** the submodule directory.
    - Add them to `.gitignore` if you don't want them tracked by git.
    - Before updating the submodule, back up any local config files if needed.

- [ ] **8. How to Update morphik-core in the Future**
    - Run:
      ```sh
      cd external/morphik-core
      git pull origin main
      cd ../..
      git add external/morphik-core
      git commit -m "Update morphik-core"
      ```
    - Always test your project after updating the submodule.

- [ ] **9. If You Need to Make Changes to morphik-core**
    - **Best:** Fork morphik-core on GitHub and use your fork as the submodule source.
    - **Alternative:** Make changes in a separate branch and keep a clear record of your changes.
    - **Tip:** Contribute improvements upstream if they are general-purpose!

---

## Ongoing Maintenance Tips
- **Never edit submodule code directly in your main repo.**
- **Document your process** for updating and maintaining the submodule in your README or a dedicated doc.
- **Test after every update** to catch breaking changes early.
- **Keep your config and user data outside the submodule.**

---

## References
- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [morphik-core GitHub](https://github.com/morphik-org/morphik-core)

---

**This approach keeps your project robust, updatable, and beginner-friendly!** 