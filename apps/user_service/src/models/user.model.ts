// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 15-20, 2025
// Scope: Generated User model with validation decorators:
//   - User class with fields: id, displayName, email, proficiencyLevel, programmingLanguages
//   - Class-validator decorators for runtime validation
//   - Integration with Prisma types for enums
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added custom validation for programming languages array
//   - Enhanced type safety with Prisma enum types

import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDate,
} from 'class-validator';
import { proficiency_level, programming_language } from '@prisma/client';

export class User {
  @IsString()
  id!: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  display_name?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  google_id?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(proficiency_level)
  @IsOptional()
  programming_proficiency?: proficiency_level;

  @IsEnum(programming_language)
  @IsOptional()
  preferred_language?: programming_language;

  @IsDate()
  created_at!: Date;

  @IsDate()
  updated_at!: Date;
}
