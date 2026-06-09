# GEMINI.md

# ChefLab

## Project Overview

ChefLab is a multi-tenant recipe management platform designed for restaurants and cafés.

The system helps organizations centralize recipe knowledge, standardize preparation procedures, calculate recipe costs, and manage employee access through role-based permissions.

The project is currently under active development.

---

# Problem Statement

Many restaurants and cafés manage recipes using:

* Paper notebooks
* Printed sheets
* Excel files
* Word documents
* Messaging applications

This causes:

* Inconsistent recipe formats
* Loss of operational knowledge
* Difficulty calculating costs
* Difficulty maintaining product quality
* Limited accessibility

ChefLab solves these problems by providing a centralized digital recipe management platform.

---

# Target Users

## Organization Admin

Responsible for:

* User Management
* Role Management
* Recipe Management
* Ingredient Management
* Category Management

---

## Chef

Responsible for:

* Creating recipes
* Updating recipes
* Managing preparation instructions
* Creating recipe steps

---

## Employee

Responsible for:

* Viewing assigned recipes
* Following recipe instructions
* Executing assigned preparation steps

---

# MVP Features

## Authentication

* Login
* Logout

---

## User Management

* Create User
* Update User
* Delete User

---

## Role Management

* Create Role
* Update Role
* Delete Role

---

## Category Management

* Create Category
* Update Category
* Delete Category

---

## Ingredient Management

* Create Ingredient
* Update Ingredient
* Delete Ingredient

---

## Recipe Management

* Create Recipe
* Update Recipe
* Delete Recipe
* View Recipe

---

## Recipe Ingredients

Recipes contain multiple ingredients.

Each recipe ingredient stores:

* Ingredient
* Quantity
* Usage Unit
* Unit Cost

---

## Recipe Steps

Recipes contain multiple preparation steps.

Each step contains:

* Title
* Description
* Role Responsibility
* Optional Image
* Optional Video

The assigned role represents the role responsible for executing the step.

Example:

Step 1 → Chef

Step 2 → Assistant

Step 3 → Employee

---

## Cost Calculation

Recipe cost is calculated automatically from recipe ingredients.

---

## Localization

Supported Languages:

* Arabic
* English

---

# Architecture

Frontend

React

Vite

React Router

TanStack Query

React Hook Form

Zod

i18next

Axios

---

Backend

Node.js

Express.js

Prisma ORM

JWT Authentication

Bcrypt Password Hashing

---

Database

PostgreSQL

---

Storage

Cloudinary

---

Deployment

Frontend → Vercel

Backend → Render

Database → Neon PostgreSQL

---

# Database Entities

Organization

User

Role

RecipeCategory

Ingredient

Recipe

RecipeIngredient

RecipeStep

---

# Permission Model

Roles store permissions using JSONB.

Example:

{
"recipe.read": true,
"recipe.create": true,
"recipe.update": true,
"recipe.delete": false
}

---

# Multi-Tenant Design

Every Organization owns:

* Users
* Roles
* Categories
* Ingredients
* Recipes

Data must always be scoped by organization_id.

---

# Development Rules

## Backend

* Use Express Router
* Use Controller-Service architecture
* Validate all incoming data
* Use Prisma for database access
* Never access Prisma directly from controllers

---

## Frontend

* Use feature-based folder structure
* Use TanStack Query for server state
* Use React Hook Form for forms
* Use Zod for validation
* Use i18next for translations

---


# Project Goal

Build a production-ready full-stack SaaS application that demonstrates:

* Database Design
* REST API Development
* Authentication & Authorization
* RBAC
* Multi-Tenant Architecture
* React Frontend Development
* Software Engineering Best Practices
