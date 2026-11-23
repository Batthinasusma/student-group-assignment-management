
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

// Create assignment - Professor only
router.post("/", verifyToken, async (req, res) => {
    try {
        const {
            title,
            description,
            onedrive_link,
            due_date,
            group_id
        } = req.body;

        if (req.user.role !== "professor") {
            return res.status(403).json({
                message: "Only professors can create assignments"
            });
        }

        if (!title || !group_id) {
            return res.status(400).json({
                message: "Title and group ID are required"
            });
        }

        const group = await db.query(
            "SELECT id FROM groups WHERE id = $1",
            [group_id]
        );

        if (group.rows.length === 0) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const result = await db.query(
            `INSERT INTO assignments
             (title, description, onedrive_link, due_date, created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                title,
                description || "",
                onedrive_link || "",
                due_date || null,
                req.user.id
            ]
        );

        await db.query(
            `INSERT INTO assignment_allocations
             (assignment_id, group_id)
             VALUES ($1, $2)`,
            [result.rows[0].id, group_id]
        );

        res.status(201).json({
            message: "Assignment created successfully",
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error("Assignment creation error:", error.message);
        res.status(500).json({
            message: "Assignment creation failed"
        });
    }
});

// View assignments
router.get("/", verifyToken, async (req, res) => {
    try {
        let result;

        if (req.user.role === "professor") {
            result = await db.query(
                `SELECT * FROM assignments
                 WHERE created_by = $1
                 ORDER BY id DESC`,
                [req.user.id]
            );
        } else {
            result = await db.query(
                `SELECT DISTINCT a.*
                 FROM assignments a
                 JOIN assignment_allocations aa
                   ON a.id = aa.assignment_id
                 LEFT JOIN group_members gm
                   ON aa.group_id = gm.group_id
                 WHERE gm.student_id = $1
                    OR aa.student_id = $1
                 ORDER BY a.id DESC`,
                [req.user.id]
            );
        }

        res.json(result.rows);

    } catch (error) {
        console.error("Fetch assignments error:", error.message);
        res.status(500).json({
            message: "Unable to fetch assignments"
        });
    }
});

// Student submits assignment
router.post("/:assignmentId/submit", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can submit assignments"
            });
        }

        const { submission_link } = req.body;
        const assignmentId = req.params.assignmentId;

        if (!submission_link || !submission_link.trim()) {
            return res.status(400).json({
                message: "Submission link is required"
            });
        }

        const assignment = await db.query(
            `SELECT a.id, a.due_date
             FROM assignments a
             JOIN assignment_allocations aa
               ON a.id = aa.assignment_id
             LEFT JOIN group_members gm
               ON aa.group_id = gm.group_id
             WHERE a.id = $1
               AND (gm.student_id = $2 OR aa.student_id = $2)
             LIMIT 1`,
            [assignmentId, req.user.id]
        );

        if (assignment.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found for this student"
            });
        }

        const dueDate = assignment.rows[0].due_date;
        const status = dueDate && new Date() > new Date(dueDate)
            ? "late"
            : "submitted";

        const result = await db.query(
            `INSERT INTO submissions
             (assignment_id, student_id, submission_link, status, submitted_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (assignment_id, student_id)
             DO UPDATE SET
                submission_link = EXCLUDED.submission_link,
                status = EXCLUDED.status,
                submitted_at = NOW()
             RETURNING *`,
            [
                assignmentId,
                req.user.id,
                submission_link.trim(),
                status
            ]
        );

        res.status(201).json({
            message: "Assignment submitted successfully",
            submission: result.rows[0]
        });

    } catch (error) {
        console.error("Submission error:", error.message);
        res.status(500).json({
            message: "Assignment submission failed"
        });
    }
});

// Professor views submissions for an assignment
router.get("/:assignmentId/submissions", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== "professor") {
            return res.status(403).json({
                message: "Only professors can view submissions"
            });
        }

        const assignment = await db.query(
            `SELECT id FROM assignments
             WHERE id = $1 AND created_by = $2`,
            [req.params.assignmentId, req.user.id]
        );

        if (assignment.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        const result = await db.query(
            `SELECT s.id, s.submission_link, s.status,
                    s.submitted_at, u.name, u.email
             FROM submissions s
             JOIN users u ON u.id = s.student_id
             WHERE s.assignment_id = $1
             ORDER BY s.submitted_at DESC`,
            [req.params.assignmentId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Fetch submissions error:", error.message);
        res.status(500).json({
            message: "Unable to fetch submissions"
        });
    }
});

module.exports = router;

