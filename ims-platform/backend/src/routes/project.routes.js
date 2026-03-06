'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR, requireManager } = require('../middleware/rbac');
const ctrl = require('../controllers/project.controller');

router.get('/', protect, ctrl.getProjects);
router.post('/', protect, requireManager, ctrl.createProject);
router.get('/:id', protect, ctrl.getProjectById);
router.put('/:id', protect, requireManager, ctrl.updateProject);
router.delete('/:id', protect, requireHR, ctrl.deleteProject);
router.put('/:id/members', protect, requireManager, ctrl.updateMembers);
router.put('/:id/clients', protect, requireManager, ctrl.updateClients);
router.get('/:id/tasks', protect, ctrl.getProjectTasks);
router.get('/:id/notes', protect, ctrl.getProjectNotes);
router.post('/:id/notes', protect, ctrl.createProjectNote);

module.exports = router;
