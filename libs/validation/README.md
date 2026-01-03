<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-validation" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-validation.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-validation.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-validation" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-validation.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-validation

A validation service for NestJS applications using class-validator and class-transformer.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides a `ValidationService` that wraps `class-validator` and `class-transformer` to provide a consistent validation API for DTOs and class instances in NestJS applications.

## Installation

```bash
npm install @dismissible/nestjs-validation
```

You'll also need to install the peer dependencies:

```bash
npm install class-validator class-transformer
```

## Getting Started

### Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { ValidationModule } from '@dismissible/nestjs-validation';

@Module({
  imports: [ValidationModule],
})
export class AppModule {}
```

### Validating DTOs

The `ValidationService` can validate plain objects against DTO classes:

```typescript
import { Injectable } from '@nestjs/common';
import { ValidationService } from '@dismissible/nestjs-validation';
import { IsString, IsEmail, IsOptional } from 'class-validator';

class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Injectable()
export class UserService {
  constructor(private readonly validationService: ValidationService) {}

  async createUser(data: unknown) {
    // Validates and transforms the data, throws BadRequestException if invalid
    const dto = await this.validationService.validateDto(CreateUserDto, data);

    // dto is now a validated instance of CreateUserDto
    // Use dto.name, dto.email, etc.
  }
}
```

### Validating Existing Instances

You can also validate class instances that have already been created:

```typescript
import { Injectable } from '@nestjs/common';
import { ValidationService } from '@dismissible/nestjs-validation';
import { IsString, IsDate } from 'class-validator';

class MyDto {
  @IsString()
  name!: string;

  @IsDate()
  createdAt!: Date;
}

@Injectable()
export class MyService {
  constructor(private readonly validationService: ValidationService) {}

  async validateInstance(dto: MyDto) {
    // Validates the instance, throws BadRequestException if invalid
    await this.validationService.validateInstance(dto);
  }
}
```

### Error Handling

The validation service throws `BadRequestException` with formatted error messages when validation fails:

```typescript
import { BadRequestException } from '@nestjs/common';
import { ValidationService } from '@dismissible/nestjs-validation';

@Injectable()
export class MyService {
  constructor(private readonly validationService: ValidationService) {}

  async handleRequest(data: unknown) {
    try {
      const dto = await this.validationService.validateDto(MyDto, data);
      // Process valid data
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Handle validation errors
        console.error('Validation failed:', error.message);
      }
      throw error;
    }
  }
}
```

## API Reference

### ValidationService

#### `validateDto<T>(dtoClass, data): Promise<T>`

Validates and transforms plain data into a DTO instance.

**Parameters:**

- `dtoClass: ClassConstructor<T>` - The DTO class to validate against
- `data: unknown` - The data to validate

**Returns:** `Promise<T>` - A validated instance of the DTO class

**Throws:** `BadRequestException` if validation fails

#### `validateInstance<T>(instance): Promise<void>`

Validates an existing class instance.

**Parameters:**

- `instance: T` - The instance to validate

**Throws:** `BadRequestException` if validation fails

### ValidationModule

A NestJS module that provides `ValidationService` as a singleton.

**Exports:**

- `ValidationService` - The validation service

## Features

- Automatic transformation using `class-transformer`
- Validation using `class-validator` decorators
- Nested validation error extraction
- Formatted error messages
- Type-safe DTOs with TypeScript generics

## Example: Using in a Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ValidationService } from '@dismissible/nestjs-validation';
import { IsString, IsEmail } from 'class-validator';

class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;
}

@Controller('users')
export class UserController {
  constructor(private readonly validationService: ValidationService) {}

  @Post()
  async create(@Body() body: unknown) {
    const dto = await this.validationService.validateDto(CreateUserDto, body);
    // Use validated dto
    return { message: `Creating user: ${dto.name}` };
  }
}
```

## Related Packages

This validation service is used by:

- `@dismissible/nestjs-core` - Validates dismissible items

## License

MIT
