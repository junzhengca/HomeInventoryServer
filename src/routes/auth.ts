import { Router, RequestHandler } from "express";
import {
  signup,
  login,
  getCurrentUser,
  updateUser,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/signup", signup as RequestHandler);
router.post("/login", login as RequestHandler);
router.get("/me", authenticate, getCurrentUser as RequestHandler);
router.patch("/me", authenticate, updateUser as RequestHandler);

export default router;
