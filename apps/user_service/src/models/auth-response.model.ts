// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 15-20, 2025
// Scope: Generated AuthResponse model:
//   - Simple response model for JWT access token
//   - Class-validator decorator for type safety
// Author review: Code reviewed, tested, and validated by team. No modifications needed.

import { IsString } from 'class-validator';

export class AuthResponse {
  @IsString()
  accessToken!: string;
}
