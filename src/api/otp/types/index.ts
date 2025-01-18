// src/api/otp/types/index.ts
import type { Schema } from '@strapi/types';

export interface OTPAttributes {
  email: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OTPEntity {
  id: number;
  attributes: OTPAttributes;
}

export interface OTPRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}