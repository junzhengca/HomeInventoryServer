import { Response } from "express";
import User from "../models/User";
import { generateAccessToken } from "../utils/jwt";
import { AuthRequest, SignupRequest, LoginRequest, UpdateUserRequest } from "../types";

interface AuthRequestWithBody extends AuthRequest {
  body: any;
}

export async function signup(req: AuthRequestWithBody, res: Response): Promise<void> {
  try {
    const { email, password }: SignupRequest = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({ email, password });

    const accessToken = generateAccessToken(user._id.toString(), user.email);

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req: AuthRequestWithBody, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString(), user.email);

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUser(req: AuthRequestWithBody, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword, avatarUrl }: UpdateUserRequest = req.body;

    // Validate password change requirements
    const hasCurrentPassword = !!currentPassword;
    const hasNewPassword = !!newPassword;

    if (hasCurrentPassword !== hasNewPassword) {
      res.status(400).json({ message: "Both currentPassword and newPassword are required to change password" });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      res.status(400).json({ message: "New password must be at least 6 characters" });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify current password if changing password
    if (currentPassword && newPassword) {
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }
      user.password = newPassword;
    }

    // Update avatar URL if provided
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }

    // Save changes (password will be hashed by pre-save hook)
    await user.save();

    // Refresh the user from DB to get updated data
    const updatedUser = await User.findById(req.user.userId);

    res.json({
      id: updatedUser!._id,
      email: updatedUser!.email,
      avatarUrl: updatedUser!.avatarUrl,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
