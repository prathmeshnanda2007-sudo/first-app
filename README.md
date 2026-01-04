# Smart Complaint Management System 🏙️

A smart civic complaint management platform where users can register complaints about issues like potholes, garbage, or water leaks, and track their resolution. Built using the MERN stack with Tailwind CSS and Cloudinary integration.

---

## 🚀 Features

- 🔐 User Authentication (JWT)
- 📬 Complaint Submission with image & location
- 🗂️ Complaint tracking and status updates
- 🧑‍💼 Role-based dashboards (Citizen, Admin/Officer)
- ☁️ Image upload using Cloudinary
- ✉️ Email notification system (nodemailer)

---

## 📦 Tech Stack

- Frontend: React, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express.js, MongoDB, Cloudinary
- Auth: JWT + Cookies
- Dev Tools: Vite, Postman, Toastify

---

## 🛠️ Setup Instructions

```bash
git clone https://github.com/yourusername/your-repo-name
cd your-repo-name
npm install
cd client
npm install
```

## Running the backfill workflow (example for forks)

If you maintain a fork or your own copy of this repo (e.g., `prathmeshnanda2007-sudo/first-app`), you can dispatch the Backfill Dashboard Summaries workflow using the GitHub CLI:

```powershell
# trigger the workflow on your fork (replace <your-repo> and <your-branch> as needed)
gh workflow run backfill-dashboard.yml --repo <your-username>/<your-repo> --ref main --field week=2026-W01 --field dry_run=true --field verbose=true --field project_id=messcheck-staging

# view runs and find the run id
gh run list --repo <your-username>/<your-repo> --workflow=backfill-dashboard.yml

# download the verbose artifact once the run has finished
gh run download <run-id> --repo <your-username>/<your-repo> --name backfill-verbose-2026-W01 -D ./downloaded-artifacts
```

Notes:
- `--field verbose=true` makes the script write `firebase/functions/artifacts/backfill-dashboard-verbose-<week>.csv` and `.json`, which the workflow uploads as an artifact for inspection.
- Use `--field dry_run=true` to ensure no writes are performed during validation.

