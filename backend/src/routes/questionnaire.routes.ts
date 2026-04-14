import { Router } from 'express';
import { questionnaireController } from '../modules/questionnaire/questionnaire.controller';

const router = Router();

router.get('/', (req, res) => questionnaireController.getAll(req, res));
router.get('/:id', (req, res) => questionnaireController.getOne(req, res));
router.post('/', (req, res) => questionnaireController.create(req, res));
router.put('/:id', (req, res) => questionnaireController.update(req, res));
router.delete('/:id', (req, res) => questionnaireController.delete(req, res));

router.post('/:id/responses', (req, res) => questionnaireController.saveResponses(req, res));
router.get('/:testId/responses', (req, res) => questionnaireController.getResponses(req, res));
router.get('/:testId/responses/student/:studentId', (req, res) => questionnaireController.getStudentResponses(req, res));

export default router;