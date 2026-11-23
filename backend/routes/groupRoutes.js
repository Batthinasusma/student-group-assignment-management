

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

// Create a group
router.post("/", verifyToken, async (req, res) => {
    const { group_name } = req.body;
    const userId = req.user.id;

    if (req.user.role !== "student") {
        return res.status(403).json({
            message: "Only students can create groups"
        });
    }

    if (!group_name || !group_name.trim()) {
        return res.status(400).json({
            message: "Group name is required"
        });
    }

    let client;

    try {
        client = await db.connect();

        await client.query("BEGIN");

        // Check for duplicate group names
        const existingGroup = await client.query(
            `SELECT id FROM groups
             WHERE LOWER(group_name) = LOWER($1)
             AND created_by = $2`,
            [group_name.trim(), userId]
        );

        if (existingGroup.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "You have already created this group"
            });
        }

        // Create group
        const group = await client.query(
            `INSERT INTO groups (group_name, created_by)
             VALUES ($1, $2)
             RETURNING *`,
            [group_name.trim(), userId]
        );

        // Add creator as group member
        await client.query(
            `INSERT INTO group_members (group_id, student_id)
             VALUES ($1, $2)`,
            [group.rows[0].id, userId]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Group created successfully",
            group: group.rows[0]
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }

        console.error("Group creation error:", error.message);

        res.status(500).json({
            message: "Group creation failed"
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});

// View groups
router.get("/", verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT g.*
             FROM groups g
             JOIN group_members gm
             ON g.id = gm.group_id
             WHERE gm.student_id = $1
             ORDER BY g.id`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Fetch groups error:", error.message);

        res.status(500).json({
            message: "Unable to fetch groups"
        });
    }
});

// Add a student to a group
router.post("/:groupId/members", verifyToken, async (req, res) => {
    try {
        const { email } = req.body;
        const groupId = req.params.groupId;

        if (!email || !email.trim()) {
            return res.status(400).json({
                message: "Student email is required"
            });
        }

        // Check group ownership
        const group = await db.query(
            `SELECT * FROM groups
             WHERE id = $1 AND created_by = $2`,
            [groupId, req.user.id]
        );

        if (group.rows.length === 0) {
            return res.status(404).json({
                message: "Group not found or you are not the creator"
            });
        }

        // Find student
        const student = await db.query(
            `SELECT id FROM users
             WHERE LOWER(email) = LOWER($1)
             AND role = 'student'`,
            [email.trim()]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Add student to group
        await db.query(
            `INSERT INTO group_members (group_id, student_id)
             VALUES ($1, $2)`,
            [groupId, student.rows[0].id]
        );

        res.status(201).json({
            message: "Student added to group successfully"
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Student is already in this group"
            });
        }

        console.error("Add member error:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;
