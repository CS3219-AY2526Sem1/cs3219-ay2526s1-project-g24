import { IsString } from 'class-validator';

export class AuthResponse {
  @IsString()
  accessToken!: string;
}
