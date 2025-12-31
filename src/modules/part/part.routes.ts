// import { Router } from 'express';
// import { authenticate, authorizePermissions } from '../../shared/middleware/auth.middleware';
// import { validate } from '../../shared/middleware/validation.middleware';
// import { createPartSchema, updatePartSchema, partQuerySchema } from './part.dto';
// import * as partController from './part.controller';

// const router = Router();

// router.use(authenticate);

// /**
//  * @swagger
//  * tags:
//  *   name: Parts
//  *   description: Parts catalog management endpoints
//  */

// /**
//  * @swagger
//  * /parts:
//  *   post:
//  *     summary: Create a new part
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - category
//  *               - unitPrice
//  *               - costPrice
//  *             properties:
//  *               name:
//  *                 type: string
//  *               category:
//  *                 type: string
//  *                 enum: [SCREEN, BATTERY, CHARGER, BACK_COVER, CAMERA, SPEAKER, MICROPHONE, CHARGING_PORT, HEADPHONE_JACK, BUTTON, FLEX_CABLE, MOTHERBOARD, RAM, STORAGE, OTHER]
//  *               unitPrice:
//  *                 type: number
//  *               costPrice:
//  *                 type: number
//  *     responses:
//  *       201:
//  *         description: Part created successfully
//  *   get:
//  *     summary: Get all parts
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: category
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Parts retrieved successfully
//  */
// router.post('/', authorizePermissions('parts.create'), validate(createPartSchema), partController.createPart);
// router.get('/', authorizePermissions('parts.read'), validate(partQuerySchema), partController.getParts);

// /**
//  * @swagger
//  * /parts/search:
//  *   get:
//  *     summary: Search parts
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: query
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Search results retrieved successfully
//  */
// router.get('/search', authorizePermissions('parts.read'), partController.searchParts);

// /**
//  * @swagger
//  * /parts/stats:
//  *   get:
//  *     summary: Get part statistics
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Statistics retrieved successfully
//  */
// router.get('/stats', authorizePermissions('parts.read'), partController.getPartStats);

// /**
//  * @swagger
//  * /parts/number/{partNumber}:
//  *   get:
//  *     summary: Get part by part number
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: partNumber
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Part retrieved successfully
//  */
// router.get('/number/:partNumber', authorizePermissions('parts.read'), partController.getPartByPartNumber);

// /**
//  * @swagger
//  * /parts/{id}:
//  *   get:
//  *     summary: Get part by ID
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Part retrieved successfully
//  *   put:
//  *     summary: Update part
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *     responses:
//  *       200:
//  *         description: Part updated successfully
//  *   delete:
//  *     summary: Delete part
//  *     tags: [Parts]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Part deleted successfully
//  */
// router.get('/:id', authorizePermissions('parts.read'), partController.getPartById);
// router.put('/:id', authorizePermissions('parts.update'), validate(updatePartSchema), partController.updatePart);
// router.delete('/:id', authorizePermissions('parts.delete'), partController.deletePart);

// export default router;

