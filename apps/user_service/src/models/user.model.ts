import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDate,
} from 'class-validator';
import { proficiency_level } from '@prisma/client';

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

  @IsDate()
  created_at!: Date;

  @IsDate()
  updated_at!: Date;
}
